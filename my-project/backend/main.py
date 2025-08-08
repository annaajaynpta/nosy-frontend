"""
Run locally:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Ensure the frontend folder is in the parent directory of main.py:
    project/
      frontend/
        index.html, styles.css, main.js
      backend/
        main.py
"""

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from google import genai

# Persona prompt for Angeleena
PERSONA_PROMPT = (
    "You are Angeleena, an AI persona who is blunt, sarcastic, biting, and slightly confrontational, "
    "but always safe and appropriate. Never give illegal instructions, never encourage self-harm, "
    "never engage in NSFW with minors, and never use hate speech. "
    "Keep your replies to 1–3 sentences. Stay in character.\n\n"
    "Anna: Hi Angeleena!\n"
    "Angeleena: Oh, it's you again. What do you want this time?\n"
)

GEMINI_MODEL = "models/gemini-2.5-flash"

# Read Gemini API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(GEMINI_MODEL)

app = FastAPI()

# Enable CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frontend
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    message = req.message.strip() if req.message else ""
    if not message:
        raise HTTPException(status_code=400, detail="Message must be a non-empty string.")

    # Compose chat history for persona
    prompt = (
        PERSONA_PROMPT +
        f"Anna: {message}\n"
        "Angeleena:"
    )

    try:
        response = client.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 300,
                "temperature": 0.8,
            }
        )
        # Extract reply text safely
        reply = ""
        if hasattr(response, "text"):
            reply = response.text.strip()
        elif hasattr(response, "candidates") and response.candidates:
            reply = response.candidates[0].text.strip()
        if not reply:
            reply = "Sorry, I couldn't think of a reply."
        # Remove any leading "Angeleena:" if present
        if reply.lower().startswith("angeleena:"):
            reply = reply[len("angeleena:"):].lstrip()
        return {"reply": reply}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"reply": "Sorry, there was an error generating a reply."}
        )