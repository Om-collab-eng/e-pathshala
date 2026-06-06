import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

def generate_invoice_pdf(invoice_id, school_name, amount, tax, total, due_date):
    """Generates a simple PDF invoice and saves it in the static folder."""
    filename = f"invoice_{invoice_id}.pdf"
    
    # Ensure static directory exists
    os.makedirs('static/invoices', exist_ok=True)
    filepath = os.path.join('static/invoices', filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "INVOICE")
    
    # Company Info
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, "librika.in")
    c.drawString(50, height - 95, "VBPS Library Solutions")
    c.drawString(50, height - 110, "Email: billing@librika.in")
    
    # Invoice Details
    c.drawString(400, height - 80, f"Invoice #: {invoice_id}")
    c.drawString(400, height - 95, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    c.drawString(400, height - 110, f"Due Date: {due_date}")
    
    # Billed To
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 150, "Billed To:")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 165, school_name)
    
    # Table Header
    c.line(50, height - 200, width - 50, height - 200)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 215, "Description")
    c.drawString(400, height - 215, "Amount (INR)")
    c.line(50, height - 225, width - 50, height - 225)
    
    # Item
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 250, "SaaS Subscription")
    c.drawString(400, height - 250, f"Rs. {amount:.2f}")
    
    # Totals
    c.line(350, height - 280, width - 50, height - 280)
    c.drawString(300, height - 300, "Subtotal:")
    c.drawString(400, height - 300, f"Rs. {amount:.2f}")
    
    c.drawString(300, height - 320, "GST (18%):")
    c.drawString(400, height - 320, f"Rs. {tax:.2f}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(300, height - 350, "TOTAL:")
    c.drawString(400, height - 350, f"Rs. {total:.2f}")
    
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 50, "Thank you for using librika.in!")
    
    c.save()
    
    return f"/static/invoices/{filename}"

