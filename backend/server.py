from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import json
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (optional — only used for /api/status health-check endpoints)
_mongo_client = None
db = None
try:
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    if mongo_url and db_name:
        _mongo_client = AsyncIOMotorClient(mongo_url)
        db = _mongo_client[db_name]
except Exception:
    pass  # MongoDB not available; /api/status endpoints will be disabled

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ImageAnalysisRequest(BaseModel):
    image_url: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest):
    """Analyze an image using Google Gemini 2.5 Flash for marketing analysis."""
    try:
        from google import genai as google_genai
        from google.genai import types as genai_types

        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")

        # Download image from public URL
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(request.image_url)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download image from storage")
            image_bytes = response.content
            content_type = response.headers.get('content-type', 'image/jpeg')

        # Clean content type
        if ';' in content_type:
            content_type = content_type.split(';')[0].strip()
        if content_type not in ['image/jpeg', 'image/png', 'image/webp', 'image/gif']:
            content_type = 'image/jpeg'

        prompt = """You are a marketing analyst. Analyze this marketing/advertising image and extract the following information.
Return ONLY a valid JSON object with exactly these fields (no markdown, no extra text):
{
  "extracted_text": "All visible text in the image verbatim",
  "marketing_formula": "Primary formula used - one of: AIDA, PAS, BAB, FAB, PPPP, 4Ps, or a brief description if none apply",
  "industry": "Specific industry (e.g., SaaS, E-commerce, Health & Wellness, Finance, Real Estate, Fashion, Food & Beverage, Education, Travel)",
  "emotional_hook": "Primary emotional trigger (e.g., Fear of Missing Out, Social Proof, Aspirational Identity, Urgency, Trust & Authority, Curiosity, Pain Point)",
  "category": "Content type (e.g., Social Ad, Email Newsletter, Landing Page, Banner Ad, Print Ad, Video Script, Sales Page)"
}"""

        # Use new google-genai SDK with model fallback
        genai_client = google_genai.Client(api_key=gemini_api_key)
        
        # Try models in order of preference
        models_to_try = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash']
        response_obj = None
        last_error = None
        
        for model_name in models_to_try:
            try:
                response_obj = genai_client.models.generate_content(
                    model=model_name,
                    contents=[
                        genai_types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                        prompt
                    ]
                )
                logger.info(f"Using model: {model_name}")
                break
            except Exception as e:
                last_error = e
                logger.warning(f"Model {model_name} failed: {str(e)[:100]}, trying next...")
                continue
        
        if response_obj is None:
            raise last_error

        # Parse JSON response - handle markdown code blocks
        response_text = response_obj.text.strip()
        if '```' in response_text:
            parts = response_text.split('```')
            for part in parts:
                part = part.strip()
                if part.startswith('json'):
                    part = part[4:].strip()
                if part.startswith('{'):
                    response_text = part
                    break

        result = json.loads(response_text)
        logger.info(f"Gemini analysis complete: formula={result.get('marketing_formula')}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in Gemini response: {e}")
        return {
            "extracted_text": "Text extraction complete - detailed parsing unavailable",
            "marketing_formula": "Unknown",
            "industry": "Unknown",
            "emotional_hook": "Unknown",
            "category": "Unknown"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if _mongo_client is not None:
        _mongo_client.close()