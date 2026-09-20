import os
import io
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv
import groq

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class STTBase64Request(BaseModel):
    audio_base64: str
    mime_type: Optional[str] = "audio/webm"
    prompt: Optional[str] = None

@router.post("/stt")
async def transcribe_audio_file(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None)
):
    """
    Transcribe an audio file (e.g. webm, wav, mp3, ogg, m4a) using Groq Whisper.
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        content = await file.read()
        if not content:
            return {"transcript": ""}

        filename = file.filename or "recording.webm"
        client = groq.Groq(api_key=GROQ_API_KEY)
        
        transcription = client.audio.transcriptions.create(
            file=(filename, content),
            model="whisper-large-v3-turbo",
            response_format="json",
            prompt=prompt or "Candidate interview answer with technical terminology",
            language="en"
        )
        return {"transcript": transcription.text.strip()}
    except Exception as e:
        print(f"[STT Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stt/base64")
async def transcribe_audio_base64(req: STTBase64Request):
    """
    Transcribe base64-encoded audio data using Groq Whisper.
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        raw_b64 = req.audio_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        audio_bytes = base64.b64decode(raw_b64)
        if not audio_bytes:
            return {"transcript": ""}

        ext = "webm"
        if req.mime_type and "wav" in req.mime_type:
            ext = "wav"
        elif req.mime_type and "mp3" in req.mime_type:
            ext = "mp3"
        elif req.mime_type and "ogg" in req.mime_type:
            ext = "ogg"

        filename = f"speech.{ext}"
        client = groq.Groq(api_key=GROQ_API_KEY)
        
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model="whisper-large-v3-turbo",
            response_format="json",
            prompt=req.prompt or "Candidate interview response",
            language="en"
        )
        return {"transcript": transcription.text.strip()}
    except Exception as e:
        print(f"[STT Base64 Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))
