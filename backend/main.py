from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import openai
import chromadb
from chromadb.utils import embedding_functions
import nltk
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, create_engine, MetaData, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database
from pinecone import Pinecone, ServerlessSpec


# PostgreSQL URL
DATABASE_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://postgres:acqulene@localhost:5432/mental_health_bot")

# SQLAlchemy setup
Base = declarative_base()
metadata = MetaData()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)

class ChatInteraction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    query = Column(String)
    response = Column(String)
    timestamp = Column(String, default=datetime.utcnow().isoformat)

# Use databases for async DB interaction
database = Database(DATABASE_URL)
engine = create_engine(DATABASE_URL.replace("asyncpg", "psycopg2"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables (you can also run Alembic migrations)
Base.metadata.create_all(bind=engine)


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


# OpenAI Assistant Setup
client = openai.OpenAI()
assistant = client.beta.assistants.create(
    name="Arohi the AI Psychologist",
    instructions="Provide emotional support and stress management advice.",
    tools=[],
    model="gpt-4o-mini",
)
thread = client.beta.threads.create()


pinecone_api_key = "pcsk_5D1v7g_MTTv3ZifoaK9ffLM5kZMyuL3HN2Kjc6jWDjjt6jHdWFqftdFHdc2AyfHBqXTKqQ"
cloud_region = "us-east-1"
embedding_dimension = 1536
index_name = "newindex"

global query_history
query_history = ""

# Initialize Pinecone
pc = Pinecone(api_key=pinecone_api_key)
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=embedding_dimension,
        metric="cosine",
        spec=ServerlessSpec(cloud="gcp", region=cloud_region.split("-")[1]),
    )
index = pc.Index(index_name)


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

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.post("/register")
async def register_user(user: UserRegister):
    query = "SELECT * FROM users WHERE username = :username"
    existing_user = await database.fetch_one(query=query, values={"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = get_password_hash(user.password)
    insert_query = "INSERT INTO users (username, password) VALUES (:username, :password)"
    await database.execute(query=insert_query, values={"username": user.username, "password": hashed_password})
    return {"message": "User registered successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    query = "SELECT * FROM users WHERE username = :username"
    user = await database.fetch_one(query=query, values={"username": form_data.username})
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

# Replace get_embedding with OpenAI Embedding
def get_embedding(text: str) -> list[float]:
    try:
        response = openai.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print("❌ Failed to generate embedding:", e)
        return []


# Function to retrieve similar documents from ChromaDB
def search_similar_text(query_text, top_k=10, score_threshold=0.8):
    query_vector = get_embedding(query_text)

    if not query_vector:
        return "No similar documents found."

    try:
        pinecone_results = index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True
        )

        retrieved_contexts = []
        for match in pinecone_results.matches:
            if match.score >= score_threshold and "text" in match.metadata:
                retrieved_contexts.append(match.metadata["text"])

        return "\n".join(retrieved_contexts) if retrieved_contexts else "No similar documents found."

    except Exception as e:
        print("❌ Pinecone query failed:", e)
        return "No similar documents found."


def extract_context_from_text(text: str) -> dict:
    prompt = f"""
    You are an NLP assistant helping another assistant understand emotional context.

    Task: From the user's message, extract:
    - scenario: one of ["family_conflict", "academic_stress", "work_pressure", "relationship_issue", "financial_stress", "health_anxiety", "social_anxiety", "existential_crisis", "grief_or_loss", "self_doubt"]
    - role: their position in the situation (e.g., daughter, son, student, employee, partner, friend, patient)

    Return a JSON object only, like:
    {{ "scenario": "relationship_issue", "role": "partner" }}

    Example:
    Text: "I got into a fight with my dad. He doesn't understand me."
    -> {{ "scenario": "family_conflict", "role": "daughter" }}

    Text: "I failed two tests and I don't think I can pass this semester."
    -> {{ "scenario": "academic_stress", "role": "student" }}

    Now analyze this:
    Text: "{text}"
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    import json
    try:
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print("❌ JSON parsing failed", e)
        return {"scenario": "unknown", "role": "user"}


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
        # Extract scenario and user role using GPT
        context = extract_context_from_text(query)
        scenario = context.get("scenario", "unknown")
        role = context.get("role", "user")

        # Build dynamic instructions
        sentiment_instruction = {
            "positive": "Maintain an engaging and encouraging tone.",
            "neutral": "Respond normally with helpful advice.",
            "negative": "Use a compassionate and supportive tone. Offer stress-relief tips briefly. Keep it short."
        }.get(sentiment, "Respond normally. Be concise and to the point.")

        instructions = (
            f"You are Arohi, an AI mental health assistant. "
            f"The user is going through a {scenario.replace('_', ' ')} situation and is acting as a {role}. "
            f"The user has a premium account. {sentiment_instruction}"
        )

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

            insert_query = """
            INSERT INTO interactions (username, query, response, timestamp)
            VALUES (:username, :query, :response, :timestamp)
            """
            await database.execute(query=insert_query, values={
                "username": username,
                "query": query,
                "response": response_text,
                "timestamp": datetime.utcnow().isoformat()
            })

        return {"thread_id": current_thread_id, "response": response_text}


    except Exception as e:
        import traceback
        print("❌ Error in /query:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

@app.get("/chat-history")
async def get_chat_history(token: str = Depends(oauth2_scheme)):
    username = extract_username_from_token(token)
    query = "SELECT * FROM interactions WHERE username = :username ORDER BY timestamp DESC LIMIT 100"
    chats = await database.fetch_all(query=query, values={"username": username})
    return {"history": [dict(chat) for chat in chats]}

# Print available routes properly
print("\nAvailable routes:")
for route in app.routes:
    print(f"{route.path} - {', '.join(route.methods)}")
