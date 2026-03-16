import sqlite3
import os

# --- PATH SETUP ---
DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def view_all_transactions():
    """Prints all recorded transactions in a readable format."""
    if not os.path.exists(DB_PATH):
        print("❌ Database not found. Please run the app and complete a transaction first.")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row # Allows access by column name
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        
        if not rows:
            print("📭 No transactions found in the database.")
            return

        print("-" * 105)
        print(f"{'ID':<4} | {'NAME':<15} | {'PLATE':<12} | {'DESTINATION':<25} | {'DATE':<12} | {'STATUS':<8}")
        print("-" * 105)
        
        for row in rows:
            print(f"{row['id']:<4} | {row['name']:<15} | {row['plate']:<12} | {row['destination'][:25]:<25} | {row['date']:<12} | {row['status']:<8}")
        
        print("-" * 105)
        conn.close()
    except Exception as e:
        print(f"❌ Error reading database: {e}")

if __name__ == "__main__":
    print("🔍 Fetching all parking records from SQL Database...")
    view_all_transactions()
