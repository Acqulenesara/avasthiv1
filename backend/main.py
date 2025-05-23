from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import openai
import chromadb
from chromadb.utils import embedding_functions
import nltk
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import sqlite3
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta


# Download necessary NLTK data
nltk.download("punkt")

from dotenv import load_dotenv
load_dotenv()  # Load environment variables

openai.api_key = os.getenv("OPENAI_API_KEY")


# FastAPI App Initialization
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Secret Key
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Ensure correct ChromaDB version
print(f"ChromaDB Version: {chromadb.__version__}")

# Define embedding function using SentenceTransformers
EMBED_MODEL = "all-MiniLM-L6-v2"
embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBED_MODEL)

# Initialize ChromaDB with embedding functions
chroma_client = chromadb.PersistentClient(path="../chroma_db")
collection_name = "pdf_text_collection"
collection = chroma_client.get_or_create_collection(name=collection_name, embedding_function=embedding_func)

# OpenAI Assistant Setup
client = openai.OpenAI()
assistant = client.beta.assistants.create(
    name="Arohi the AI Psychologist",
    instructions="Provide emotional support and stress management advice.",
    tools=[],
    model="gpt-4o-mini",
)
thread = client.beta.threads.create()

from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client["mental_health_bot"]
users_collection = db["users"]
interactions_collection = db["interactions"]
lifestyle_collection = db["lifestyle"]


#
# # SQLite Database Setup
# conn = sqlite3.connect("users.db", check_same_thread=False)
# cursor = conn.cursor()
# cursor.execute("""
#     CREATE TABLE IF NOT EXISTS users (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         username TEXT UNIQUE,
#         password TEXT
#     )
# """)
# cursor.execute("""
#     CREATE TABLE IF NOT EXISTS interactions (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         username TEXT,
#         query TEXT,
#         response TEXT,
#         timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
#     )
# """)
# cursor.execute("""
#     CREATE TABLE IF NOT EXISTS lifestyle (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         username TEXT,
#         sleep TEXT,
#         exercise TEXT,
#         diet TEXT,
#         social TEXT,
#         work_life_balance TEXT
#     )
# """)
# conn.commit()

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


# User Authentication
class UserRegister(BaseModel):
    username: str
    password: str

@app.post("/register")
async def register_user(user: UserRegister):
    if await users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = get_password_hash(user.password)
    await users_collection.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    return {"message": "User registered successfully"}


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


# Pydantic model for request handling

class QueryPayload(BaseModel):
    query: str
    thread_id: str | None = None # Add this line


# Load the sentiment analysis model from NLP Town
sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")


# Function to analyze sentiment
def analyze_sentiment_transformers(text):
    result = sentiment_pipeline(text)[0]
    label = result['label']  # e.g., '4 stars'
    rating = int(label.split()[0])  # extract the number from 'X stars'

    # You can customize the label to your format (e.g., positive, neutral, negative)
    if rating >= 4:
        return "positive"
    elif rating == 3:
        return "neutral"
    else:
        return "negative"

# Function to retrieve similar documents from ChromaDB
def search_similar_text(query_text, top_k=10, max_distance=1.0):
    query_embedding = embedding_func([query_text])
    results = collection.query(
        query_embeddings=[query_embedding[0]],
        n_results=top_k,
        include=["metadatas", "distances"]
    )

    retrieved_contexts = []
    for meta, distance in zip(results.get("metadatas", [[]])[0], results.get("distances", [[]])[0]):
        if meta and distance < max_distance:
            retrieved_contexts.append(meta.get("text", "No text available"))

    return "\n".join(retrieved_contexts) if retrieved_contexts else "No similar documents found."


def extract_username_from_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")  # "sub" usually stores the username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/query")
async def handle_query(payload: QueryPayload, token: str = Depends(oauth2_scheme)):
    try:
        username = extract_username_from_token(token)  # Auto-extract username
        query = payload.query

        current_thread_id = payload.thread_id or thread.id

        # Retrieve relevant context
        retrieved_context = search_similar_text(query)

        # Analyze sentiment
        sentiment = analyze_sentiment_transformers(query)

        # Adjust assistant instructions based on sentiment
        sentiment_instruction = {
            "positive": "Maintain an engaging and encouraging tone.",
            "neutral": "Respond normally with helpful advice.",
            "negative": "Use a compassionate and supportive tone. Offer stress-relief tips briefly.Keep it short."
        }.get(sentiment, "Respond normally.Be concise and to the point.")

        # Create a message in the thread
        message = client.beta.threads.messages.create(
            thread_id=current_thread_id,
            role="user",
            content=f"The following context is retrieved:\n{retrieved_context}\n\n{query}\n"
        )

        # Stream Assistant Response
        with client.beta.threads.runs.stream(
                thread_id=current_thread_id,
                assistant_id=assistant.id,
                instructions=f"You are Arohi.Please address the user as {username}. The user has a premium account. {sentiment_instruction}"
        ) as stream:
            stream.until_done()
            response_text = stream.get_final_messages()[0].content[0].text.value

        return {"thread_id": current_thread_id, "response": response_text}


    except Exception as e:
        import traceback
        print("❌ Error in /query:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


# Print available routes properly
print("\nAvailable routes:")
for route in app.routes:
    print(f"{route.path} - {', '.join(route.methods)}")
