import PyPDF2
import os
import openai
from pinecone import Pinecone, ServerlessSpec


import os
from dotenv import load_dotenv

load_dotenv()  # Loads the .env file variables into environment variables

os.environ["OPENAI_API_KEY"]= os.getenv("OPENAI_API_KEY")
api_key= os.getenv("PINECONE_API_KEY")
cloud_region= os.getenv("PINECONE_ENVIRONMENT")


# Load the PDF file
pdf_file = "C:/Users/acqul/PycharmProjects/avasthi/backend/The_Stress_Management.pdf"  # Replace with the actual path to your PDF file

# Function to extract text from a PDF
def extract_text_from_pdf(pdf_file):
    with open(pdf_file, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

# Extract text from the PDF
pdf_text = extract_text_from_pdf(pdf_file)

# Split the text into chunks for embedding (optional, depending on the PDF's length)
# You can split it into smaller chunks if needed, based on the text length.
 # If you want to keep the entire text as a single chunk

# Initialize OpenAI
openai.api_key = os.environ["OPENAI_API_KEY"]

# Function to generate embeddings

import openai
from nltk.tokenize import sent_tokenize
import nltk
nltk.download('punkt')
import nltk
nltk.download('punkt_tab')

# Function to split text into chunks based on token limits
def split_text(text, max_tokens=4000):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_tokens = 0

    for sentence in sentences:
        # Estimate token count by counting words as a proxy
        sentence_tokens = len(sentence.split())

        if current_tokens + sentence_tokens > max_tokens:
            # If adding the sentence exceeds the token limit, create a new chunk
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    # Add the last chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

# Function to generate embeddings


import openai


def generate_embeddings(texts, model="text-embedding-ada-002"):
    embeddings = []

    for text in texts:
        try:
            # Request embeddings from OpenAI API using the new interface
            response = openai.embeddings.create(input=[text], model=model)

            # Extract the embedding from the response
            embedding = response.data[0].embedding

            embeddings.append(embedding)

        except Exception as e:
            print(f"Error generating embedding for text: {text[:50]}... - {e}")
            embeddings.append(None)

    return embeddings


texts = split_text(pdf_text)
# Generate embeddings
print("Generating embeddings...")
embeddings = generate_embeddings(texts)

# Prepare data with metadata
data_to_upsert = []
for i, (text, embedding) in enumerate(zip(texts, embeddings)):
    if embedding is not None:  # Skip failed embeddings
        metadata = {"text": text}  # Add any additional metadata fields here
        data_to_upsert.append({"id": f"pdf-text-{i}", "values": embedding, "metadata": metadata})

# Initialize Pinecone
embedding_dimension = 1536  # Match the embedding model's dimension
index_name = "newindex"

pc = Pinecone(api_key=api_key)

# Check if the index exists, and create it if it doesn't
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=embedding_dimension,
        metric='cosine',  # Use 'cosine', 'dotproduct', or 'euclidean'
        spec=ServerlessSpec(
            cloud="aws",
            region=cloud_region.split("-")[1]
        )
    )

# Access the index
index = pc.Index(index_name)
print(f"Pinecone index '{index_name}' initialized successfully!")

# Upsert embeddings with metadata into Pinecone
print("Upserting embeddings with metadata into Pinecone...")
try:
    index.upsert(data_to_upsert)
    print(f"Successfully upserted {len(data_to_upsert)} embeddings into '{index_name}'!")
except Exception as e:
    print(f"Error during upsert: {e}")


def debug_pinecone_upsert(index, example_ids=None):
    """
    Fetches and prints metadata and first 5 embedding values for given vector IDs from Pinecone.

    Args:
        index: Pinecone index object
        example_ids: List of vector IDs to fetch and debug. Defaults to first 2 known IDs.
    """
    if example_ids is None:
        example_ids = [f"pdf-text-{i}" for i in range(2)]  # Adjust range or pass explicit ids

    # Fetch vectors by IDs
    fetched = index.fetch(ids=example_ids)

    vectors = fetched.get("vectors", {})
    print(f"📌 Retrieved {len(vectors)} vectors from Pinecone")

    for i, (vec_id, vec_data) in enumerate(vectors.items()):
        metadata = vec_data.get("metadata", {})
        embedding = vec_data.get("values", [])

        print(f"\n🗂️ Metadata {i + 1} (ID: {vec_id}): {metadata}")
        print(f"🔢 Embedding {i + 1} (First 5 values): {embedding[:5]} ... [truncated]")

debug_pinecone_upsert(index)  # Will fetch first 2 by default
