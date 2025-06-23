# auth.py - Fixed User Authentication Module
# ============================================================================

import hashlib
import bcrypt
from enhanced_db import get_connection


def hash_password(password):
    """Hash password using bcrypt (more secure than SHA-256)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_user(username, email, password):
    """Create a new user account"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return False, "Username already exists"

        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return False, "Email already exists"

        # Create new user
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (username, email, hashed_password))

        user_id = cursor.fetchone()[0]
        conn.commit()
        return True, user_id

    except Exception as e:
        conn.rollback()
        return False, f"Error creating user: {e}"
    finally:
        cursor.close()
        conn.close()


def login_user(username, password):
    """Authenticate user login"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, username, email, password FROM users 
            WHERE username = %s
        """, (username,))

        user = cursor.fetchone()
        if user and verify_password(password, user[3]):
            return True, {"id": user[0], "username": user[1], "email": user[2]}
        else:
            return False, "Invalid username or password"

    except Exception as e:
        return False, f"Login error: {e}"
    finally:
        cursor.close()
        conn.close()

