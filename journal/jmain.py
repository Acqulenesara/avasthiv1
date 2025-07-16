from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import jwt
from datetime import datetime, timedelta, date
import os

# Imports from your modules
from auth import create_user, login_user
from enhanced_db import get_connection, get_user_stats, fetch_entries_by_user
from journal import submit_entry
from enhanced_plot import plot_comprehensive_analysis

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
security = HTTPBearer()

# App setup
app = FastAPI(
    title="Personal Journal API (Web Version)",
    description="A journaling platform with mood tracking and sentiment analysis.",
    version="2.0"
)

# CORS settings (allow React frontend for example)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginUser(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str

class JournalEntry(BaseModel):
    mood: str
    entry: str

class EntryPreview(BaseModel):
    id: int
    entry_date: date
    mood: str
    sentiment_score: float
    preview: str

# JWT utility
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"user_id": payload["user_id"], "username": payload["username"]}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.post("/auth/register")
async def register(user: RegisterUser):
    success, result = create_user(user.username, user.email, user.password)
    if success:
        return {"message": "Account created", "user_id": result}
    raise HTTPException(status_code=400, detail=result)

@app.post("/auth/login", response_model=Token)
async def login(user: LoginUser):
    success, result = login_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=401, detail=result)

    access_token = create_access_token(
        data={"user_id": result["id"], "username": result["username"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": result["id"],
        "username": result["username"]
    }

@app.post("/journal/entry")
async def create_entry(entry: JournalEntry, current_user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        sentiment = submit_entry(conn, current_user["user_id"], entry.mood, entry.entry)
        conn.close()

        feedback = "neutral sentiment"
        if sentiment > 0.1:
            feedback = "positive sentiment"
        elif sentiment < -0.1:
            feedback = "negative sentiment"

        return {
            "message": "Entry saved successfully",
            "sentiment_score": sentiment,
            "sentiment_feedback": feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/journal/recent", response_model=List[EntryPreview])
async def recent_entries(current_user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        entries = fetch_entries_by_user(conn, current_user["user_id"], limit=5)
        conn.close()

        previews = []
        for i, (date_, sentiment, mood, text) in enumerate(entries):
            preview_text = text[:100] + "..." if len(text) > 100 else text
            previews.append({
                "id": i + 1,
                "entry_date": date_,
                "mood": mood,
                "sentiment_score": sentiment,
                "preview": preview_text
            })

        return previews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch entries: {e}")

@app.get("/journal/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        plot_comprehensive_analysis(conn, current_user["user_id"])  # Saves the plot locally
        conn.close()
        return {"message": "Analytics plotted successfully (check server directory)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {e}")

@app.get("/")
def root():
    return {"message": "Welcome to Personal Journal API!"}
