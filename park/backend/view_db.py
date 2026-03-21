import mysql.connector
import os

# --- MYSQL CONFIG ---
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "", 
    "database": "parkease_db"
}

def view_all_transactions():
    """Prints all recorded transactions from MySQL in a readable format."""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        
        if not rows:
            print("📭 No transactions found in the MySQL database.")
            conn.close()
            return

        print("-" * 110)
        print(f"{'ID':<4} | {'NAME':<15} | {'PLATE':<12} | {'DESTINATION':<25} | {'DATE':<12} | {'SLOT':<6} | {'STATUS':<8}")
        print("-" * 110)
        
        for row in rows:
            print(f"{row['id']:<4} | {row['name']:<15} | {row['plate']:<12} | {row['destination'][:25]:<25} | {row['date']:<12} | {row['slot']:<6} | {row['status']:<8}")
        
        print("-" * 110)
        conn.close()
    except Exception as e:
        print(f"❌ Error reading MySQL: {e}")
        print("💡 Ensure MySQL Server is running and config in view_db.py matches app.py")

if __name__ == "__main__":
    print("🔍 Fetching all parking records from MySQL Database...")
    view_all_transactions()
