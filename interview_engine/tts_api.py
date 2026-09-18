import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

SARVAM_API_KEY = os.getenv("SARVAM_AI_API_KEY")

@router.post("/tts")
async def generate_speech(req: TTSRequest):
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="SARVAM_AI_API_KEY not configured")

    url = "https://api.sarvam.ai/text-to-speech"
    payload = {
        "inputs": [req.text],
        "target_language_code": "en-IN",
        "speaker": "aayan_v4",
        "pitch": 0,
        "pace": 1.1,
        "loudness": 1.5,
        "speech_sample_rate": 24000,
        "enable_preprocessing": True,
        "model": "bulbul:v2"
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            if "audios" in data and len(data["audios"]) > 0:
                return {"audio_base64": data["audios"][0]}
            else:
                raise HTTPException(status_code=500, detail="No audio returned from Sarvam AI")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
