# db_config.py - Database Configuration Template
# ============================================================================

# Create this file with your PostgreSQL database credentials
DB_CONFIG = {
    'host': 'localhost',
    'database': 'mental_health_bot',
    'user': 'postgres',
    'password': '1234',
    'port': '5432'
}


# ============================================================================
# Database Schema (SQL)
# ============================================================================

"""
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    mood VARCHAR(100),
    entry TEXT NOT NULL,
    sentiment_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX idx_journal_entries_sentiment ON journal_entries(sentiment_score);
"""


# ============================================================================
# requirements.txt
# ============================================================================

"""
psycopg2-binary==2.9.7
textblob==0.17.1
matplotlib==3.7.2
numpy==1.24.3
bcrypt==4.0.1
"""