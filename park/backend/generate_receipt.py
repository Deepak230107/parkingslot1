import os
from fpdf import FPDF
from datetime import datetime
import requests
import json
import urllib.parse

# ════════════ BRANDING CONSTANTS ════════════
COLOR_VIOLET = (139, 92, 246)  # Electric Violet
COLOR_CYAN = (6, 182, 212)    # Vivid Cyan
COLOR_NAVY = (2, 6, 23)       # Deep Navy Surface
COLOR_TEXT_MAIN = (51, 65, 85) # Slate Gray
COLOR_SUCCESS = (34, 197, 94) # Green

FONT_BOLD = 'helvetica'
FONT_REGULAR = 'helvetica'

class ParkEaseReceipt(FPDF):
    def header(self):
        # Background color for the header (Deep Navy)
        self.set_fill_color(*COLOR_NAVY)
        self.rect(0, 0, 210, 45, 'F')
        
        # Logo (Electric Violet Glow)
        self.set_font(FONT_BOLD, 'B', 28)
        self.set_text_color(*COLOR_VIOLET)
        self.set_xy(15, 12)
        self.cell(0, 20, 'ParkEase', 0, 0, 'L')
        
        # Subtitle
        self.set_font(FONT_REGULAR, 'I', 10)
        self.set_text_color(148, 163, 184) # Slate 400
        self.set_xy(15, 28)
        self.cell(0, 10, 'Quantum Prismatic Grid — Level B2 Authorized', 0, 0, 'L')
        
        # Metadata
        self.set_font(FONT_REGULAR, '', 10)
        self.set_xy(145, 15)
        self.set_text_color(255, 255, 255)
        self.cell(50, 10, f"Issued: {datetime.now().strftime('%d %b %Y')}", 0, 1, 'R')
        self.set_xy(145, 22)
        self.cell(50, 10, f"Permit #: PE-{datetime.now().strftime('%H%M%S')}", 0, 0, 'R')
        self.ln(35)

    def footer(self):
        self.set_y(-30)
        self.set_font(FONT_REGULAR, 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, 'Thank you for choosing ParkEase. This is a digitally signed Quantum Permit.', 0, 1, 'C')
        self.set_font(FONT_BOLD, 'B', 9)
        self.cell(0, 5, 'Support: help@parkease.systems | Securely encrypted with RSA-2048', 0, 0, 'C')

def generate_parking_receipt(user_details, filename):
    pdf = ParkEaseReceipt()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)
    
    # Hero Title (Centrally Hubbed)
    pdf.ln(15)
    pdf.set_font(FONT_BOLD, 'B', 20)
    pdf.set_text_color(15, 17, 26)
    pdf.cell(0, 10, 'QUANTUM AUTHORIZATION PERMIT', 0, 1, 'C')
    
    # Decorative Line (Cyan)
    pdf.set_draw_color(*COLOR_CYAN)
    pdf.set_line_width(0.8)
    pdf.line(70, pdf.get_y() + 2, 140, pdf.get_y() + 2)
    pdf.ln(12)
    
    # Reservation Details Box
    pdf.set_fill_color(*COLOR_VIOLET)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(FONT_BOLD, 'B', 12)
    pdf.cell(180, 12, '   SLOT ASSIGNMENT DATA', 0, 1, 'L', True)
    
    # Table Content
    pdf.set_font(FONT_REGULAR, '', 11)
    pdf.set_text_color(*COLOR_TEXT_MAIN)
    
    details = [
        ("Reference Hash", f"SHA-256_{datetime.now().strftime('%Y%m%d%H%M%S')[:12]}"),
        ("Authorized User", user_details.get('name', 'N/A')),
        ("Vehicle Plate", user_details.get('plate', 'N/A').upper()),
        ("Arrival Window", f"{user_details.get('date', 'N/A')} @ {user_details.get('time', 'N/A')}"),
        ("Parking Node", user_details.get('location', 'Central Hub - Level B2')),
        ("Strategic Slot", user_details.get('slot', 'B2-A14')),
    ]
    
    pdf.ln(4)
    for key, value in details:
        pdf.set_x(20)
        pdf.set_font(FONT_BOLD, 'B', 11)
        pdf.cell(60, 10, f"{key}", 0, 0)
        pdf.set_font(FONT_REGULAR, '', 11)
        pdf.cell(100, 10, f": {value}", 0, 1)
        pdf.set_draw_color(226, 232, 240)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())

    # Generate QR Code for Scanner
    # Filter only essential data for QR code
    qr_data = {
        "name": user_details.get('name', 'N/A'),
        "plate": user_details.get('plate', 'N/A'),
        "slot": user_details.get('slot', 'N/A'),
        "amount": user_details.get('amount', 'N/A'),
        "time": user_details.get('time', 'N/A')
    }
    qr_json = json.dumps(qr_data)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={urllib.parse.quote(qr_json)}"
    
    # Download QR code temporarily
    qr_temp_path = f"qr_{datetime.now().strftime('%H%M%S')}.png"
    try:
        response = requests.get(qr_url)
        if response.status_code == 200:
            with open(qr_temp_path, 'wb') as f:
                f.write(response.content)
            
            # Place QR Code
            pdf.image(qr_temp_path, x=155, y=145, w=35)
            
            # Clean up
            os.remove(qr_temp_path)
    except Exception as e:
        print(f"Failed to fetch QR code: {e}")

    # Payment Summary
    pdf.set_y(140)
    pdf.set_font(FONT_BOLD, 'B', 14)
    pdf.set_text_color(15, 17, 26)
    
    # Glassmorphism Mockup Box (Light Gray Backdrop)
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(15, 145, 140, 45, 'F')
    
    pdf.set_xy(25, 153)
    pdf.set_text_color(15, 17, 26)
    pdf.cell(80, 10, 'Transaction Status:', 0, 0)
    pdf.set_text_color(*COLOR_SUCCESS)
    pdf.cell(50, 10, 'VERIFIED SUCCESSFUL', 0, 1)
    
    pdf.set_x(25)
    pdf.set_font(FONT_BOLD, 'B', 24)
    pdf.set_text_color(*COLOR_VIOLET)
    pdf.cell(100, 18, f"Total Paid: {user_details.get('amount', 'INR 1.00')}", 0, 1)
    
    # Save PDF
    pdf.output(filename)
    print(f"✅ Quantum Receipt generated: {filename}")

if __name__ == "__main__":
    sample_user = {
        "name": "Deepak Y",
        "plate": "TN 09 AX 1234",
        "type": "Luxury SUV",
        "location": "Central Hub — Level B2",
        "slot": "A-01",
        "amount": "INR 1.00"
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "quantum_receipt.pdf")
    generate_opening_receipt = generate_parking_receipt(sample_user, output_path)

