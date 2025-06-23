from fastapi import FastAPI, status
from fastapi.security import HTTPBasic
from pydantic import BaseModel
import os
import requests
from collections import Counter
import openai
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import re
from pinecone import Pinecone, ServerlessSpec
import sys
import os

# Add the parent directory (i.e., the root where db.py lives)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

if not YOUTUBE_API_KEY or not openai_api_key:
    raise ValueError("API keys are missing. Check your .env file!")


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "newindex"

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create index if it doesn't exist
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=1536,  # This is correct for text-embedding-ada-002
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",         # or "gcp" as per your Pinecone project
            region="us-east-1"   # match your Pinecone project's region
        )
    )

# Get index
index = pc.Index(INDEX_NAME)


# Initialize OpenAI client for additional analysis
openai_client = None
try:
    openai_api_key = os.environ.get("OPENAI_API_KEY")  # Use environment variable for security
    if openai_api_key:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
    else:
        print("⚠ OpenAI API key not found. Some advanced features will be disabled.")
except Exception as e:
    print(f"⚠ OpenAI integration disabled: {e}")

# Predefined PDF path
PDF_PATH = "The_Stress_Management.pdf"  # <-- Hardcoded PDF path

# Lazy loading NLTK data
def download_nltk_data():
    """Download necessary NLTK data if not already downloaded."""
    import nltk
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")

    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords")

    try:
        nltk.data.find("corpora/wordnet")
    except LookupError:
        nltk.download("wordnet")

# Load NLTK data
download_nltk_data()

# Initialize stopwords and lemmatizer
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

# FastAPI app
app = FastAPI()

# Security
security = HTTPBasic()

class SurveyResponse(BaseModel):
    question: str
    response: int

class VideoRecommendation(BaseModel):
    title: str
    url: str
    thumbnail: str

# Predefined PSS Survey Questions
PSS_QUESTIONS = [
    "In the last month, how often have you been upset because of something that happened unexpectedly?",
    "In the last month, how often have you felt that you were unable to control the important things in your life?",
    "In the last month, how often have you felt nervous and stressed?",
    "In the last month, how often have you felt confident about your ability to handle your personal problems?",
    "In the last month, how often have you felt that things were going your way?",
    "In the last month, how often have you found that you could not cope with all the things that you had to do?",
    "In the last month, how often have you been able to control irritations in your life?",
    "In the last month, how often have you felt that you were on top of things?",
    "In the last month, how often have you been angered because of things that happened that were outside of your control?",
    "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?"
]

# Helper function to chunk text
def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into chunks of specified size with overlap."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

# Helper function to extract text from PDF
def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

# Helper function to preprocess and chunk PDF content
def preprocess_and_chunk_pdf(pdf_path):
    """Preprocess and chunk PDF content."""
    text = extract_text_from_pdf(pdf_path)
    # Clean text
    text = re.sub(r'\s+', ' ', text)  # Remove extra whitespace
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # Remove non-ASCII characters
    # Chunk text
    chunks = chunk_text(text)
    return chunks


@app.get("/pss-survey-questions")
def get_pss_survey_questions():
    """Get the predefined PSS survey questions."""
    return {"questions": PSS_QUESTIONS}

@app.post("/conduct-survey")
def conduct_survey(responses: list[SurveyResponse]):
    """Conduct the PSS (Perceived Stress Scale) survey."""
    if len(responses) != len(PSS_QUESTIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {len(PSS_QUESTIONS)} responses, but got {len(responses)}."
        )

    # Calculate the PSS score
    score = sum(response.response for response in responses)

    # Determine stress level based on the score
    if score <= 13:
        stress_level = "Low"
    elif 14 <= score <= 26:
        stress_level = "Moderate"
    else:
        stress_level = "High"

    return {"stress_level": stress_level}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


from fastapi import  Query, HTTPException
from typing import List
from pydantic import BaseModel

class VideoRecommendation(BaseModel):
    title: str
    url: str
    thumbnail: str
from sqlalchemy.orm import Session
from fastapi import Depends
from db import SessionLocal, UserPreference  # adjust import

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_preferences(username: str, db: Session) -> List[str]:
    prefs = (
        db.query(UserPreference)
        .filter(
            UserPreference.username == username,
            UserPreference.preference_type == "like"
        )
        .all()
    )
    return [pref.content for pref in prefs]



@app.get("/recommendations", response_model=List[VideoRecommendation])
def get_recommendations(
    username: str = Query(...),
    interests: List[str] = Query(...),
    stress_level: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        # Fetch user preferences from DB
        db_preferences = get_user_preferences(username, db)
        combined_interests = list(set(interests + db_preferences))  # merge & deduplicate

        print(f"📌 Debug - Input interests: {interests}")
        print(f"📌 Debug - DB preferences: {db_preferences}")
        print(f"📌 Debug - Combined interests: {combined_interests}")

        video_results = generate_recommendations(combined_interests, stress_level)
        return video_results[:5]  # Return top 5
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# Helper functions
def retrieve_relevant_content(query, user_interests, top_k=5):
    """Retrieve relevant content from ChromaDB based on query and user interests."""
    enhanced_query = f"{query} {', '.join(user_interests)}"

    from openai import OpenAI

    embedding_client = OpenAI(api_key=openai_api_key)

    def get_embedding(text):
        response = embedding_client.embeddings.create(
            input=[text],
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding

    query_vector = get_embedding(enhanced_query)

    response = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True
    )

    # Format response to match Chroma-style
    relevant_texts = [match['metadata']['text'] for match in response['matches']]
    all_keywords = []
    for match in response['matches']:
        if 'keywords' in match['metadata']:
            all_keywords.extend(match['metadata']['keywords'].split(", "))

    keyword_counts = Counter(all_keywords)
    top_keywords = [k for k, _ in keyword_counts.most_common(10)]

    return relevant_texts, top_keywords

    if not results["metadatas"][0]:
        return [], []

    relevant_texts = results["documents"][0]

    all_keywords = []
    for metadata in results["metadatas"][0]:
        if "keywords" in metadata:
            all_keywords.extend(metadata["keywords"].split(", "))

    keyword_counts = Counter(all_keywords)
    top_keywords = [keyword for keyword, _ in keyword_counts.most_common(10)]

    return relevant_texts, top_keywords

def analyze_with_openai(text, user_interests):
    """Use OpenAI to extract keywords and themes relevant to user interests."""
    if not openai_client:
        return []

    try:
        prompt = f"""
        Extract 5-10 key stress management concepts relevant to {', '.join(user_interests)}. 
        Focus on actionable topics that could be searched on YouTube.
        Text: {text[:4000]}...

        Provide a comma-separated list of keywords.
        """

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )

        keywords_text = response.choices[0].message.content.strip()
        return [k.strip() for k in keywords_text.split(',')]
    except Exception as e:
        return []

def generate_recommendations(user_interests, stress_level):
    """Generate video recommendations based on user interests and stress level."""
    relevant_texts, keywords = retrieve_relevant_content(
        f"stress management {stress_level}",
        user_interests
    )

    if openai_client and relevant_texts:
        combined_text = " ".join(relevant_texts[:3])
        ai_keywords = analyze_with_openai(combined_text, user_interests)
        keywords = list(set(keywords + ai_keywords))

    search_queries = []
    for interest in user_interests:
        query = f"stress relief {stress_level} {interest}"
        if keywords:
            query += " " + " ".join(keywords[:3])

        search_queries.append(query)

    all_videos = []
    for query in search_queries:
        videos = fetch_youtube_videos(query, max_results=5)
        all_videos.extend(videos)

    unique_videos = []
    seen_urls = set()
    for video in all_videos:
        if video["url"] not in seen_urls:
            unique_videos.append(video)
            seen_urls.add(video["url"])

    return unique_videos[:5]

def fetch_youtube_videos(search_query, max_results=3):
    """Fetch YouTube videos based on a search query."""
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={search_query}&key={YOUTUBE_API_KEY}&maxResults={max_results}&type=video"
    try:
        response = requests.get(url).json()
        if "error" in response:
            return []

        return [
            {
                "title": item["snippet"]["title"],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"]
            }
            for item in response.get("items", [])
        ]
    except Exception as e:
        return []

# Run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
