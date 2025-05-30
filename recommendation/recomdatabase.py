import sqlite3


def init_db():
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            interests TEXT,
            stress_level INTEGER DEFAULT 5
        )
    """)

    # Create indexed_pdfs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS indexed_pdfs (
            pdf_id TEXT PRIMARY KEY NOT NULL,
            indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


# Register User
def register_user(username, password, interests):
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, interests) VALUES (?, ?, ?)",
                       (username, password, interests))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False


# Authenticate User
def authenticate_user(username, password):
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()
    return user


def get_user_data(username):
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT interests, stress_level FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()

    if result:
        interests = result[0].split(",") if result[0] else []
        stress_level = int(result[1]) if result[1] else 0
        return interests, stress_level
    return [], 0


# Check if a PDF is indexed
def check_pdf_indexed(pdf_id):
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM indexed_pdfs WHERE pdf_id = ?", (pdf_id,))
    result = cursor.fetchone()
    conn.close()
    return result is not None


# Add a new indexed PDF
def add_indexed_pdf(pdf_id):
    conn = sqlite3.connect("../users.db")
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO indexed_pdfs (pdf_id) VALUES (?)", (pdf_id,))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False