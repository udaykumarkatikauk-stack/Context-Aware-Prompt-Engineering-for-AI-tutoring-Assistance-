import os
import pymongo
import hashlib
import json
from PIL import Image
import pytesseract
from pypdf import PdfReader
from docx import Document
from pptx import Presentation
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from groq import Groq

# --- CONFIGURATION ---
# Configuration
DATA_FOLDER = os.getenv(
    "DATA_FOLDER",
    r"C:\Users\chava\Downloads\PE_Work\my_engineering_docs"
)

MONGO_URI = os.getenv("MONGO_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not MONGO_URI or not GROQ_API_KEY:
    raise ValueError("MONGO_URI and GROQ_API_KEY must be set in .env")

client = pymongo.MongoClient(MONGO_URI)
db = client["jairisys01"]
collection = db["knowledge_base"]
groq_client = Groq(api_key=GROQ_API_KEY)