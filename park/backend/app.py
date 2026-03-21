from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from generate_receipt import generate_parking_receipt
from generate_report import generate_full_payments_pdf, generate_users_report_pdf
import os
import mysql.connector
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- MYSQL CONFIGURATION ---
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "", # Add your MySQL password here
    "database": "parkease_db"
}

def get_db_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

def init_db():
    try:
        # Initial connection to create database if not exists
        conn = mysql.connector.connect(
            host=MYSQL_CONFIG["host"],
            user=MYSQL_CONFIG["user"],
            password=MYSQL_CONFIG["password"]
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_CONFIG['database']}")
        conn.close()

        # Connect to the actual database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Transactions Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                plate VARCHAR(50),
                destination VARCHAR(255),
                date VARCHAR(50),
                time VARCHAR(50),
                amount VARCHAR(50),
                type VARCHAR(50),
                slot VARCHAR(20),
                status VARCHAR(20),
                duration VARCHAR(20),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Slots Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS slots (
                id VARCHAR(20) PRIMARY KEY,
                state VARCHAR(20) DEFAULT 'free',
                user VARCHAR(255) DEFAULT '',
                plate VARCHAR(50) DEFAULT '',
                since VARCHAR(50) DEFAULT ''
            )
        ''')
        
        # Initialize slots if empty (ALLOCATE NEWLY)
        cursor.execute('SELECT COUNT(*) FROM slots')
        if cursor.fetchone()[0] == 0:
            for i in range(1, 9):
                slot_id = f"B2-A{str(i).zfill(2)}"
                cursor.execute('INSERT INTO slots (id, state) VALUES (%s, %s)', (slot_id, 'free'))
                
        conn.commit()
        conn.close()
        print("MYSQL DATABASE INITIALIZED SUCCESSFULLY")
    except Exception as e:
        print(f"MYSQL INITIALIZATION FAILED: {e}")
        print("HINT: Ensure MySQL Server is running on localhost:3306 and credentials are correct.")

init_db()

RECEIPTS_DIR = os.path.join(os.path.dirname(__file__), "generated_receipts")
if not os.path.exists(RECEIPTS_DIR):
    os.makedirs(RECEIPTS_DIR)

@app.route('/api/generate-receipt', methods=['POST'])
def handle_receipt_generation():
    try:
        data = request.json
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
        
        import re
        safe_plate = re.sub(r'[^\w\s-]', '', user_details['plate']).strip().replace(' ', '_')
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"receipt_{safe_plate}_{timestamp}.pdf"
        file_path = os.path.join(RECEIPTS_DIR, filename)
        
        generate_parking_receipt(user_details, file_path)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/record-transaction', methods=['POST'])
def record_transaction():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Update SQL Transactions
        cursor.execute('''
            INSERT INTO transactions (name, plate, destination, date, time, amount, type, slot, status, duration)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        
        # 2. Update Slot State
        cursor.execute('''
            UPDATE slots SET state = 'occupied', user = %s, plate = %s, since = %s
            WHERE id = %s
        ''', (
            data.get('name'),
            data.get('plate'),
            data.get('time'),
            data.get('slot')
        ))
        
        conn.commit()
        conn.close()

        # 3. JSON Log sync (as before)
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

        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            except:
                pass
        
        logs.append(transaction_entry)
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)

        return jsonify({"message": "Transaction recorded in MySQL & JSON"}), 201
    except Exception as e:
        return jsonify({"error": f"MySQL Error: {str(e)}"}), 400

@app.route('/api/get-transactions', methods=['GET'])
def get_transactions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM transactions ORDER BY timestamp DESC')
        transactions = cursor.fetchall()
        conn.close()
        return jsonify(transactions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-slots', methods=['GET'])
def get_slots():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM slots')
        slots = cursor.fetchall()
        conn.close()
        return jsonify(slots), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/release-slot', methods=['POST'])
def release_slot():
    try:
        data = request.json
        slot_id = data.get('id')
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE slots SET state = 'free', user = '', plate = '', since = ''
            WHERE id = %s
        ''', (slot_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": f"Slot {slot_id} released"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/admin/reinitialize-slots', methods=['POST'])
def reinitialize_slots():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Clear existing
        cursor.execute("DELETE FROM slots")
        
        # New Allocation (Quantum Hub B2)
        for i in range(1, 9):
            slot_id = f"B2-A{str(i).zfill(2)}"
            cursor.execute('INSERT INTO slots (id, state) VALUES (%s, %s)', (slot_id, 'free'))
            
        conn.commit()
        conn.close()
        return jsonify({"message": "Slots reallocated to Quantum B2 structure"}), 200
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
    print("ParkEase Backend (MySQL) is running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
