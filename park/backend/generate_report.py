import sqlite3
import os
from fpdf import FPDF
from datetime import datetime

# --- PATH SETUP ---
DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")
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
        self.cell(0, 10, self.report_title, 0, 0, 'L') # Use dynamic title
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
    if not os.path.exists(DB_PATH):
        print("❌ Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        print("📭 No data to report.")
        return

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
    
    total_revenue = 0
    for row in rows:
        pdf.cell(10, 8, str(row['id']), 1)
        pdf.cell(25, 8, str(row['date']), 1)
        pdf.cell(40, 8, str(row['name'])[:20], 1)
        pdf.cell(30, 8, str(row['plate']), 1)
        pdf.cell(30, 8, str(row['type']), 1)
        pdf.cell(25, 8, str(row['slot']), 1)
        
        # Clean amount string to avoid Unicode Errors
        clean_amt = str(row['amount']).replace('₹', 'INR ')
        pdf.cell(30, 8, clean_amt, 1, 1, 'R')
        
        try:
            amt = float(str(row['amount']).replace('₹', '').replace('INR ', '').replace(',','').strip())
            total_revenue += amt
        except:
            total_revenue += 1.0

    # Summary Row
    pdf.ln(5)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(140, 12, "TOTAL REVENUE COLLECTED", 1, 0, 'R', True)
    pdf.set_text_color(22, 163, 74)
    pdf.cell(50, 12, f"INR {total_revenue:.2f}", 1, 1, 'C', True)

    report_path = os.path.join(REPORTS_DIR, f"Revenue_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    pdf.output(report_path)
    return report_path

def generate_users_report_pdf():
    if not os.path.exists(DB_PATH):
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Unique users based on name and plate
    cursor.execute("SELECT DISTINCT name, plate, type, COUNT(*) as visit_count FROM transactions GROUP BY plate ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return

    pdf = ParkEaseReportPDF(title="Staff & User Engagement Report")
    pdf.add_page()
    
    pdf.set_fill_color(6, 182, 212) # Vivid Cyan
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 10)
    
    cols = [("Authorized User Name", 60), ("Vehicle Plate", 40), ("Vehicle Type", 40), ("Total Visits", 30)]
    for label, width in cols:
        pdf.cell(width, 10, label, 1, 0, 'C', True)
    pdf.ln()

    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(0, 0, 0)
    for row in rows:
        pdf.cell(60, 8, str(row['name']), 1)
        pdf.cell(40, 8, str(row['plate']), 1)
        pdf.cell(40, 8, str(row['type']), 1)
        pdf.cell(30, 8, str(row['visit_count']), 1, 1, 'C')

    report_path = os.path.join(REPORTS_DIR, f"User_Engagement_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    pdf.output(report_path)
    return report_path

if __name__ == "__main__":
    r1 = generate_full_payments_pdf()
    r2 = generate_users_report_pdf()
    print(f"Reports: {r1}, {r2}")
