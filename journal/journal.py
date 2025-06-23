# journal.py - Fixed Journal Entry Module
# ============================================================================

from textblob import TextBlob
import datetime
from enhanced_db import insert_entry


def analyze_sentiment(text):
    """Analyze sentiment of text using TextBlob"""
    return TextBlob(text).sentiment.polarity


def submit_entry(conn, user_id, mood, entry_text):
    """Submit a new journal entry"""
    entry_date = datetime.date.today()
    sentiment = analyze_sentiment(entry_text)
    insert_entry(conn, user_id, entry_date, mood, entry_text, sentiment)
    return sentiment