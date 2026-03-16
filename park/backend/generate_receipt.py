import os
from fpdf import FPDF
from datetime import datetime

class ParkEaseReceipt(FPDF):
    def header(self):
        # Background color for the header
        self.set_fill_color(15, 17, 26) # #0f111a
        self.rect(0, 0, 210, 40, 'F')
        
        # Logo
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(245, 168, 0) # #f5a800
        self.set_xy(10, 10)
        self.cell(0, 20, 'ParkEase', 0, 0, 'L')
        
        self.set_font('helvetica', 'I', 10)
        self.set_text_color(148, 163, 184) # #94a3b8
        self.set_xy(10, 25)
        self.cell(0, 10, 'Premium Smart Parking Solutions', 0, 0, 'L')
        
        # Current Date/ID
        self.set_font('helvetica', '', 10)
        self.set_xy(150, 15)
        self.set_text_color(255, 255, 255)
        self.cell(50, 10, f"Issued: {datetime.now().strftime('%d %b %Y')}", 0, 0, 'R')
        self.ln(30)

    def footer(self):
        self.set_y(-30)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, 'Thank you for choosing ParkEase. This is a digitally generated permit.', 0, 0, 'C')
        self.ln(5)
        self.cell(0, 10, 'Support: help@parkease.systems | Terms & Conditions apply.', 0, 0, 'C')

def generate_parking_receipt(user_details, filename):
    pdf = ParkEaseReceipt()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Hero Title
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 18)
    pdf.set_text_color(15, 17, 26)
    pdf.cell(0, 10, 'PARKING AUTHORIZATION PERMIT', 0, 1, 'C')
    pdf.ln(5)
    
    # Receipt Table Header
    pdf.set_fill_color(245, 168, 0)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(190, 10, '   RESERVATION DETAILS', 0, 1, 'L', True)
    
    # Table Content
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(51, 65, 85)
    
    details = [
        ("Reference ID", f"PE-{datetime.now().strftime('%Y%m%d')}-001"),
        ("Authorized User", user_details.get('name', 'N/A')),
        ("Vehicle Plate", user_details.get('plate', 'N/A').upper()),
        ("Arrival Date", user_details.get('date', 'N/A')),
        ("Arrival Time", user_details.get('time', 'N/A')),
        ("Parking Location", user_details.get('location', 'Central Hub - B2')),
        ("Assigned Slot", user_details.get('slot', 'PE-104')),
    ]
    
    pdf.ln(2)
    for key, value in details:
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(60, 12, f"  {key}", 0, 0)
        pdf.set_font('helvetica', '', 11)
        pdf.cell(130, 12, f"{value}", 0, 1)
        pdf.set_draw_color(226, 232, 240)
        pdf.line(pdf.get_x() + 10, pdf.get_y(), pdf.get_x() + 180, pdf.get_y())

    # Payment Info
    pdf.ln(10)
    pdf.set_fill_color(241, 245, 249)
    pdf.rect(10, pdf.get_y(), 190, 40, 'F')
    
    pdf.set_xy(20, pdf.get_y() + 5)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 17, 26)
    pdf.cell(80, 10, 'Payment Status:', 0, 0)
    pdf.set_text_color(22, 163, 74) # Green
    pdf.cell(80, 10, 'SUCCESSFUL (INR)', 0, 1)
    
    pdf.set_xy(20, pdf.get_y() + 2)
    pdf.set_font('helvetica', 'B', 24)
    pdf.set_text_color(245, 168, 0)
    pdf.cell(80, 15, f"Amount Paid: {user_details.get('amount', 'INR 1.00')}", 0, 1)
    
    # Save PDF
    pdf.output(filename)
    print(f"✅ Receipt generated: {filename}")

if __name__ == "__main__":
    # Example User Data
    sample_user = {
        "name": "Deepak Y",
        "plate": "TN 09 AX 1234",
        "type": "Luxury SUV",
        "location": "Central Park Business District",
        "slot": "B2-14",
        "amount": "INR 1.00"
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "receipt_demo.pdf")
    generate_parking_receipt(sample_user, output_path)
