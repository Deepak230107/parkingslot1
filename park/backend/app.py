from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from generate_receipt import generate_parking_receipt
from generate_report import generate_full_payments_pdf, generate_users_report_pdf
import os
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- DATABASE SETUP ---
DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            plate TEXT,
            destination TEXT,
            date TEXT,
            time TEXT,
            amount TEXT,
            type TEXT,
            slot TEXT,
            status TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Ensure a directory for generated receipts exists
RECEIPTS_DIR = os.path.join(os.path.dirname(__file__), "generated_receipts")
if not os.path.exists(RECEIPTS_DIR):
    os.makedirs(RECEIPTS_DIR)

@app.route('/api/generate-receipt', methods=['POST'])
def handle_receipt_generation():
    try:
        data = request.json
        
        # Extract details from the frontend form
        user_details = {
            "name": data.get('name', 'Valued Customer'),
            "plate": data.get('plate', 'N/A'),
            "date": data.get('date', 'N/A'),
            "time": data.get('time', 'N/A'),
            "type": data.get('type', 'Standard Car'),
            "location": data.get('location', 'Central Hub - B2'),
            "slot": data.get('slot', 'B2-14'),
            "amount": data.get('amount', 'INR 1.00')
        }
        
        # Create a unique filename and sanitize it for Windows/Linux
        import re
        safe_plate = re.sub(r'[^\w\s-]', '', user_details['plate']).strip().replace(' ', '_')
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"receipt_{safe_plate}_{timestamp}.pdf"
        file_path = os.path.join(RECEIPTS_DIR, filename)
        
        # Call the existing generator function
        generate_parking_receipt(user_details, file_path)
        
        # Return the PDF file to the browser
        return send_file(file_path, as_attachment=True)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

@app.route('/api/record-transaction', methods=['POST'])
def record_transaction():
    try:
        data = request.json
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (name, plate, destination, date, time, amount, type, slot, status, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('plate'),
            data.get('location'),
            data.get('date'),
            data.get('time'),
            data.get('amount'),
            data.get('type'),
            data.get('slot'),
            'SUCCESS',
            data.get('duration')
        ))
        conn.commit()
        conn.close()

        # --- ALSO SAVE TO JSON LOG ---
        log_file = os.path.join(os.path.dirname(__file__), "transactions_log.json")
        transaction_entry = {
            "name": data.get('name'),
            "plate": data.get('plate'),
            "location": data.get('location'),
            "date": data.get('date'),
            "time": data.get('time'),
            "type": data.get('type'),
            "slot": data.get('slot'),
            "amount": data.get('amount'),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Read existing or start new list
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        logs.append(transaction_entry)
        
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)

        return jsonify({
            "message": "Transaction recorded in SQL & JSON",
            "json_path": log_file
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/admin/download-report', methods=['GET'])
def download_admin_report():
    try:
        report_path = generate_full_payments_pdf()
        if report_path and os.path.exists(report_path):
            return send_file(report_path, as_attachment=True)
        return jsonify({"error": "No data found to generate report"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/download-users-report', methods=['GET'])
def download_users_report():
    try:
        report_path = generate_users_report_pdf()
        if report_path and os.path.exists(report_path):
            return send_file(report_path, as_attachment=True)
        return jsonify({"error": "No user data found to generate report"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 ParkEase Backend is running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
