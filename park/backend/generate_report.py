import mysql.connector
import os
from fpdf import FPDF
from datetime import datetime

# --- CONFIGURATION (Match app.py) ---
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "", 
    "database": "parkease_db"
}

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

class ParkEaseReportPDF(FPDF):
    def __init__(self, title="Report", *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.report_title = title

    def header(self):
        self.set_fill_color(2, 6, 23) # Deep Navy
        self.rect(0, 0, 210, 40, 'F')
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(139, 92, 246) # Electric Violet
        self.set_xy(10, 10)
        self.cell(0, 20, 'ParkEase', 0, 0, 'L')
        self.set_font('helvetica', 'B', 14)
        self.set_text_color(255, 255, 255)
        self.set_xy(10, 25)
        self.cell(0, 10, self.report_title, 0, 0, 'L')
        self.set_font('helvetica', '', 10)
        self.set_xy(150, 15)
        self.cell(50, 10, f"Generated: {datetime.now().strftime('%d %b %Y %H:%M')}", 0, 0, 'R')
        self.ln(30)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_full_payments_pdf():
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        print(f"❌ MySQL Error: {e}")
        return None
    
    if not rows:
        print("📭 No data to report.")
        return None

    pdf = ParkEaseReportPDF(title="Consolidated Revenue Report")
    pdf.add_page()
    
    # Table Header
    pdf.set_fill_color(139, 92, 246)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 10)
    
    cols = [
        ("ID", 10), ("Date", 25), ("User", 40), ("Plate", 30), 
        ("Type", 30), ("Slot", 25), ("Amount", 30)
    ]
    
    for label, width in cols:
        pdf.cell(width, 10, label, 1, 0, 'C', True)
    pdf.ln()

    # Layout colors
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(0, 0, 0)
    
    # Safe character replacement for Helvetica
    def safe_str(s):
        return str(s).replace('—', '-').replace('₹', 'INR ')

    total_revenue = 0
    for row in rows:
        pdf.cell(10, 8, str(row['id']), 1, 0, 'C')
        pdf.cell(25, 8, safe_str(row['date']), 1, 0, 'C')
        pdf.cell(40, 8, f" {safe_str(row['name'])[:20]}", 1, 0, 'L') # Left with small padding
        pdf.cell(30, 8, safe_str(row['plate']), 1, 0, 'C')
        pdf.cell(30, 8, safe_str(row['type']), 1, 0, 'C')
        pdf.cell(25, 8, safe_str(row['slot']), 1, 0, 'C')
        
        # Amount clean and right-aligned
        clean_amt = safe_str(row['amount'])
        pdf.cell(30, 8, f"{clean_amt} ", 1, 1, 'R') # Right with small padding
        
        try:
            amt = float(str(row['amount']).replace('₹', '').replace('INR ', '').replace(',','').strip())
            total_revenue += amt
        except:
            total_revenue += 1.0

    # Summary Row
    pdf.ln(8)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(140, 14, "NET REVENUE COLLECTED", 1, 0, 'R', True)
    pdf.set_text_color(22, 163, 74)
    pdf.cell(50, 14, f"INR {total_revenue:.2f}", 1, 1, 'C', True)

    report_path = os.path.join(REPORTS_DIR, f"Revenue_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    pdf.output(report_path)
    return report_path

def generate_users_report_pdf():
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, plate, type, COUNT(*) as visit_count FROM transactions GROUP BY plate, name, type ORDER BY name ASC")
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        print(f"❌ MySQL Error: {e}")
        return None

    if not rows:
        return None

    pdf = ParkEaseReportPDF(title="Staff & User Engagement Report")
    pdf.add_page()
    
    pdf.set_fill_color(6, 182, 212) # Vivid Cyan
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 10)
    
    def safe_str(s):
        return str(s).replace('—', '-').replace('₹', 'INR ')

    cols = [("Authorized User Name", 60), ("Vehicle Plate", 40), ("Vehicle Type", 40), ("Total Visits", 30)]
    for label, width in cols:
        pdf.cell(width, 10, label, 1, 0, 'C', True)
    pdf.ln()

    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(0, 0, 0)
    for row in rows:
        pdf.cell(60, 8, f" {safe_str(row['name'])}", 1, 0, 'L')
        pdf.cell(40, 8, safe_str(row['plate']), 1, 0, 'C')
        pdf.cell(40, 8, safe_str(row['type']), 1, 0, 'C')
        pdf.cell(30, 8, str(row['visit_count']), 1, 1, 'C')

    report_path = os.path.join(REPORTS_DIR, f"User_Engagement_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    pdf.output(report_path)
    return report_path

if __name__ == "__main__":
    print("🚀 Starting Report Generation...")
    
    # 1. Full Payments PDF
    full_pay = generate_full_payments_pdf()
    if full_pay:
        print(f"💰 Revenue Report Generated: {os.path.basename(full_pay)}")
    else:
        print("❌ Could not generate Revenue Report (likely DB error).")
        
    # 2. Users Report PDF
    user_rep = generate_users_report_pdf()
    if user_rep:
        print(f"👥 Users Engagement Report Generated: {os.path.basename(user_rep)}")
    else:
        print("❌ Could not generate Users Report.")
