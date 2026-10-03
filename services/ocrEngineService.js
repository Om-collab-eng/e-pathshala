/**
 * services/ocrEngineService.js
 * Unified Hybrid OCR & Image Preprocessing Pipeline
 * Coordinates Python (PIL contrast/sharpness) and Tesseract.js/PyTesseract
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');

// Candidate python paths on Windows
const PYTHON_CANDIDATES = [
  'C:\\Users\\a21kumar\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe',
  'python',
  'python3'
];

function getValidPythonPath() {
  for (const p of PYTHON_CANDIDATES) {
    if (p.includes('\\') && fs.existsSync(p)) return p;
  }
  return 'python';
}

/**
 * Extract candidates from text using JS regex
 */
function extractJsCandidates(text) {
  if (!text) return { isbns: [], prices: [], years: [], editions: [] };

  const isbns = [];
  const isbnMatches = text.match(/(?:ISBN(?:-1[03])?:?\s*)?(97[89][- ]?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9]|[0-9]{9}[0-9X])/gi) || [];
  for (const m of isbnMatches) {
    const cleaned = m.replace(/[^0-9X]/gi, '').toUpperCase();
    if ((cleaned.length === 10 || cleaned.length === 13) && !isbns.includes(cleaned)) {
      isbns.push(cleaned);
    }
  }

  const prices = [];
  const priceMatches = text.match(/(?:₹|Rs\.?|INR|MRP|Price)[:.\s]*([0-9]+(?:\.[0-9]{2})?)/gi) || [];
  for (const p of priceMatches) {
    const num = parseFloat(p.replace(/[^0-9.]/g, ''));
    if (num >= 20 && num <= 25000 && !prices.includes(String(Math.round(num)))) {
      prices.push(String(Math.round(num)));
    }
  }

  const years = (text.match(/\b(19[89][0-9]|20[0-2][0-9])\b/g) || []).filter((v, i, a) => a.indexOf(v) === i);
  const editions = (text.match(/\b(\d+(?:st|nd|rd|th)?\s+Edition|Revised\s+Edition|International\s+Edition)\b/gi) || []).filter((v, i, a) => a.indexOf(v) === i);

  return { isbns, prices, years, editions };
}

/**
 * Run Python Preprocessing Engine
 */
function runPythonPreprocessor(frontPath, backPath) {
  return new Promise((resolve) => {
    const pyExe = getValidPythonPath();
    const scriptPath = path.join(__dirname, '..', 'scripts', 'book_ocr_engine.py');
    const args = [scriptPath, frontPath];
    if (backPath) args.push(backPath);

    let stdout = '';
    let stderr = '';

    const proc = spawn(pyExe, args);

    proc.stdout.on('data', data => { stdout += data.toString('utf8'); });
    proc.stderr.on('data', data => { stderr += data.toString('utf8'); });

    proc.on('close', code => {
      try {
        const clean = stdout.trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resolve(JSON.parse(jsonMatch[0]));
        } else {
          resolve({ success: false, error: stderr || 'No JSON output from Python' });
        }
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });

    proc.on('error', err => {
      resolve({ success: false, error: err.message });
    });
  });
}

let sharp = null;
try { sharp = require('sharp'); } catch(e) {}

/**
 * Ensures any image file (including SVG, WebP, TIFF) is converted to a clean raster PNG
 */
async function ensureValidRasterPng(filePath) {
  if (!filePath || !fs.existsSync(filePath) || !sharp) return filePath;
  try {
    const pngPath = filePath + '_norm.png';
    await sharp(filePath).png().toFile(pngPath);
    return pngPath;
  } catch (err) {
    return filePath;
  }
}

/**
 * Run Tesseract.js OCR on an image file
 */
async function runNodeOcr(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) return '';
  try {
    let input = imagePath;
    if (sharp) {
      try {
        input = await sharp(imagePath).png().toBuffer();
      } catch (sErr) {}
    }
    const { data: { text } } = await Tesseract.recognize(input, 'eng', {
      logger: () => {}
    });
    return (text || '').trim();
  } catch (err) {
    console.warn('[OCR Engine] Node Tesseract error:', err.message);
    return '';
  }
}

/**
 * Complete OCR Extraction for Front & Back Covers
 * @param {string} frontImagePath - Path to saved front image
 * @param {string} backImagePath - Path to saved back image (optional)
 */
async function processBookImages(frontImagePath, backImagePath = null) {
  const startTime = Date.now();
  let frontText = '';
  let backText = '';
  let candidates = { isbns: [], prices: [], years: [], editions: [] };
  let pythonSuccess = false;
  let nodeOcrUsed = false;

  // Normalize images to standard PNGs if needed
  const normFront = await ensureValidRasterPng(frontImagePath);
  const normBack = backImagePath ? await ensureValidRasterPng(backImagePath) : null;

  // 1. Python Preprocessing & Candidate Scan
  const pyResult = await runPythonPreprocessor(normFront, normBack);
  let frontToOcr = normFront;
  let backToOcr = normBack;

  if (pyResult && pyResult.success) {
    pythonSuccess = true;
    if (pyResult.front) {
      frontText = pyResult.front.raw_text || '';
      if (pyResult.front.proc_image_path && fs.existsSync(pyResult.front.proc_image_path)) {
        frontToOcr = pyResult.front.proc_image_path;
      }
    }
    if (pyResult.back) {
      backText = pyResult.back.raw_text || '';
      if (pyResult.back.proc_image_path && fs.existsSync(pyResult.back.proc_image_path)) {
        backToOcr = pyResult.back.proc_image_path;
      }
    }
    if (pyResult.combined_candidates) {
      candidates = pyResult.combined_candidates;
    }
  }

  // 2. If text was not extracted by Python pytesseract, run Tesseract.js on the enhanced images
  if (!frontText || frontText.length < 10) {
    nodeOcrUsed = true;
    const nodeFrontText = await runNodeOcr(frontToOcr);
    if (nodeFrontText) {
      frontText = nodeFrontText;
      const frontCandidates = extractJsCandidates(frontText);
      candidates.isbns = Array.from(new Set([...candidates.isbns, ...frontCandidates.isbns]));
      candidates.prices = Array.from(new Set([...candidates.prices, ...frontCandidates.prices]));
      candidates.years = Array.from(new Set([...candidates.years, ...frontCandidates.years]));
      candidates.editions = Array.from(new Set([...candidates.editions, ...frontCandidates.editions]));
    }
  }

  if (backToOcr && (!backText || backText.length < 10)) {
    nodeOcrUsed = true;
    const nodeBackText = await runNodeOcr(backToOcr);
    if (nodeBackText) {
      backText = nodeBackText;
      const backCandidates = extractJsCandidates(backText);
      candidates.isbns = Array.from(new Set([...candidates.isbns, ...backCandidates.isbns]));
      candidates.prices = Array.from(new Set([...candidates.prices, ...backCandidates.prices]));
      candidates.years = Array.from(new Set([...candidates.years, ...backCandidates.years]));
      candidates.editions = Array.from(new Set([...candidates.editions, ...backCandidates.editions]));
    }
  }

  return {
    success: true,
    frontText,
    backText,
    candidates,
    diagnostics: {
      pythonPreprocessorUsed: pythonSuccess,
      nodeOcrUsed,
      durationMs: Date.now() - startTime,
      frontCharCount: frontText.length,
      backCharCount: backText.length
    }
  };
}

module.exports = {
  processBookImages,
  runPythonPreprocessor,
  runNodeOcr,
  extractJsCandidates
};
