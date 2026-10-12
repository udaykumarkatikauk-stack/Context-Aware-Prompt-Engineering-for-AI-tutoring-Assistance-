# Configuration
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_US_NUMBER = os.getenv("TWILIO_US_NUMBER")
MONGO_URI = os.getenv("MONGO_URI")
NGROK_URL = os.getenv("NGROK_URL", "").rstrip("/")
MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Validate required configuration
required_vars = {
    "GROQ_API_KEY": GROQ_API_KEY,
    "TWILIO_ACCOUNT_SID": TWILIO_ACCOUNT_SID,
    "TWILIO_AUTH_TOKEN": TWILIO_AUTH_TOKEN,
    "TWILIO_US_NUMBER": TWILIO_US_NUMBER,
    "MONGO_URI": MONGO_URI,
    "NGROK_URL": NGROK_URL,
}
missing_vars = [name for name, value in required_vars.items() if not value]
if missing_vars:
    raise ValueError("Missing environment variables: " + ", ".join(missing_vars))

# Database and AI clients
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.tutor_platform_db
learning_logs = db.learning_logs
sessions_col = db.sessions

groq_client = Groq(api_key=GROQ_API_KEY)
app = FastAPI()