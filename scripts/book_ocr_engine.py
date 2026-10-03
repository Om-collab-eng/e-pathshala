import sys
import os
import io
import json
import re

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from PIL import Image, ImageEnhance, ImageFilter

def preprocess_image(image: Image.Image) -> Image.Image:
    """Preprocess book cover image to maximize text legibility."""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Scale if needed (optimal width 1200-2400px)
    width, height = image.size
    if width < 1200:
        ratio = 1200.0 / float(width)
        image = image.resize((1200, int(height * ratio)), Image.Resampling.LANCZOS)
    elif width > 2400:
        ratio = 2400.0 / float(width)
        image = image.resize((2400, int(height * ratio)), Image.Resampling.LANCZOS)
    
    # Grayscale
    gray = image.convert('L')
    
    # Contrast Enhancement (helps stylized and artistic title typography)
    enhancer = ImageEnhance.Contrast(gray)
    high_contrast = enhancer.enhance(2.0)
    
    # Sharpness Enhancement
    sharp_enhancer = ImageEnhance.Sharpness(high_contrast)
    sharpened = sharp_enhancer.enhance(1.8)
    
    return sharpened

def extract_candidates(text: str):
    """Find ISBN, Price/MRP, Edition, and Year candidates using regex patterns."""
    if not text:
        return {"isbns": [], "prices": [], "years": [], "editions": []}

    isbns = []
    # ISBN-13 and ISBN-10 patterns with or without hyphens
    isbn_matches = re.findall(r'(?:ISBN(?:-1[03])?:?\s*)?(97[89][- ]?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9]|[0-9]{9}[0-9X])', text, re.IGNORECASE)
    for m in isbn_matches:
        cleaned = re.sub(r'[^0-9X]', '', m.upper())
        if len(cleaned) in [10, 13] and cleaned not in isbns:
            isbns.append(cleaned)
    
    # Price/MRP patterns
    prices = []
    price_matches = re.findall(r'(?:₹|Rs\.?|INR|MRP|Price)[:.\s]*([0-9]+(?:\.[0-9]{2})?)', text, re.IGNORECASE)
    for p in price_matches:
        try:
            val = float(p)
            if 20 <= val <= 25000:
                prices.append(str(int(val) if val.is_integer() else val))
        except:
            pass
            
    # Year patterns (e.g. 1980 - 2026)
    years = re.findall(r'\b(19[89][0-9]|20[0-2][0-9])\b', text)
    
    # Edition patterns
    editions = re.findall(r'\b(\d+(?:st|nd|rd|th)?\s+Edition|Revised\s+Edition|International\s+Edition|Special\s+Edition)\b', text, re.IGNORECASE)

    return {
        "isbns": isbns,
        "prices": list(set(prices)),
        "years": list(set(years)),
        "editions": list(set(editions))
    }

def process_single(image_path: str):
    if not image_path or not os.path.exists(image_path):
        return {"success": False, "error": f"Image file not found: {image_path}"}
    
    try:
        raw_img = Image.open(image_path)
    except Exception as e:
        return {"success": False, "error": f"Failed to open image: {e}"}

    processed_img = preprocess_image(raw_img)
    
    # Save preprocessed image to same directory with _proc.png
    base, _ = os.path.splitext(image_path)
    proc_path = f"{base}_proc.png"
    try:
        processed_img.save(proc_path)
    except Exception as save_err:
        proc_path = image_path

    extracted_text = ""
    engine_used = "PIL-Enhanced"
    
    try:
        import pytesseract
        for win_tess in [r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]:
            if os.path.exists(win_tess):
                pytesseract.pytesseract.tesseract_cmd = win_tess
                break
        extracted_text = pytesseract.image_to_string(processed_img, config='--oem 3 --psm 3')
        if extracted_text and len(extracted_text.strip()) > 0:
            engine_used = "PyTesseract-v5"
    except Exception:
        pass

    candidates = extract_candidates(extracted_text)

    return {
        "success": True,
        "engine": engine_used,
        "raw_text": extracted_text.strip(),
        "proc_image_path": proc_path,
        "candidates": candidates,
        "char_count": len(extracted_text.strip())
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: book_ocr_engine.py <front_image> [back_image]"}))
        sys.exit(1)
        
    front_path = sys.argv[1]
    back_path = sys.argv[2] if len(sys.argv) > 2 else None

    front_res = process_single(front_path)
    back_res = process_single(back_path) if back_path else None

    combined_isbns = list(set((front_res.get("candidates", {}).get("isbns", [])) + (back_res.get("candidates", {}).get("isbns", []) if back_res else [])))
    combined_prices = list(set((front_res.get("candidates", {}).get("prices", [])) + (back_res.get("candidates", {}).get("prices", []) if back_res else [])))
    combined_years = list(set((front_res.get("candidates", {}).get("years", [])) + (back_res.get("candidates", {}).get("years", []) if back_res else [])))
    combined_editions = list(set((front_res.get("candidates", {}).get("editions", [])) + (back_res.get("candidates", {}).get("editions", []) if back_res else [])))

    output = {
        "success": True,
        "front": front_res,
        "back": back_res,
        "combined_candidates": {
            "isbns": combined_isbns,
            "prices": combined_prices,
            "years": combined_years,
            "editions": combined_editions
        }
    }

    print(json.dumps(output))
