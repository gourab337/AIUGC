"""UGCC Local Inference Server — handles image (FLUX via mflux) and voice (Kokoro TTS)."""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.image import router as image_router
from routes.voice import router as voice_router

app = FastAPI(title="UGCC Inference Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router, prefix="/image", tags=["image"])
app.include_router(voice_router, prefix="/voice", tags=["voice"])

@app.get("/health")
def health():
    generated_dir = os.getenv("GENERATED_DIR", "/tmp/ugcc_generated")
    Path(generated_dir).mkdir(parents=True, exist_ok=True)
    return {"status": "ok", "generated_dir": generated_dir}
