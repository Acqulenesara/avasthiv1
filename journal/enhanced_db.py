# enhanced_db.py - Fixed Database Operations
# ============================================================================

import psycopg2
from db_config import DB_CONFIG
import datetime


def get_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)


def insert_entry(conn, user_id, entry_date, mood, entry_text, sentiment):
    """Insert journal entry into database"""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO journal_entries (user_id, entry_date, mood, entry, sentiment_score)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, entry_date, mood, entry_text, sentiment))
        conn.commit()
    finally:
        cursor.close()


def fetch_entries_by_user(conn, user_id, limit=None):
    """Fetch user entries with optional limit"""
    with conn.cursor() as cursor:
        if limit:
            cursor.execute("""
                SELECT entry_date, sentiment_score, mood, entry FROM journal_entries
                WHERE user_id = %s ORDER BY entry_date DESC LIMIT %s
            """, (user_id, limit))
        else:
            cursor.execute("""
                SELECT entry_date, sentiment_score, mood, entry FROM journal_entries
                WHERE user_id = %s ORDER BY entry_date
            """, (user_id,))
        return cursor.fetchall()


def get_user_stats(conn, user_id):
    """Get comprehensive user statistics"""
    with conn.cursor() as cursor:
        # Total entries
        cursor.execute("SELECT COUNT(*) FROM journal_entries WHERE user_id = %s", (user_id,))
        total_entries = cursor.fetchone()[0]

        # Average sentiment
        cursor.execute("SELECT AVG(sentiment_score) FROM journal_entries WHERE user_id = %s", (user_id,))
        avg_sentiment = cursor.fetchone()[0] or 0

        # Mood distribution
        cursor.execute("""
            SELECT mood, COUNT(*) FROM journal_entries 
            WHERE user_id = %s GROUP BY mood ORDER BY COUNT(*) DESC
        """, (user_id,))
        mood_distribution = cursor.fetchall()

        # Sentiment categories
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN sentiment_score > 0.1 THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN sentiment_score < -0.1 THEN 1 ELSE 0 END) as negative,
                SUM(CASE WHEN sentiment_score BETWEEN -0.1 AND 0.1 THEN 1 ELSE 0 END) as neutral
            FROM journal_entries WHERE user_id = %s
        """, (user_id,))
        sentiment_counts = cursor.fetchone()

        # Recent dates for streak calculation
        cursor.execute("""
            SELECT entry_date FROM journal_entries 
            WHERE user_id = %s ORDER BY entry_date DESC LIMIT 30
        """, (user_id,))
        recent_dates = [row[0] for row in cursor.fetchall()]

        return {
            'total_entries': total_entries,
            'avg_sentiment': float(avg_sentiment),
            'mood_distribution': mood_distribution,
            'positive_entries': sentiment_counts[0] or 0,
            'negative_entries': sentiment_counts[1] or 0,
            'neutral_entries': sentiment_counts[2] or 0,
            'recent_dates': recent_dates
        }
