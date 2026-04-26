"""Kokoro 82M TTS via kokoro-onnx 0.5+ (Apache 2.0).

Model files from: https://github.com/thewh1teagle/kokoro-onnx/releases/model-files-v1.0
  - kokoro-v1.0.onnx     (~165MB)
  - voices-v1.0.bin      (~430MB)
"""

import asyncio
import os
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=2)

GENERATED_DIR = Path(os.getenv("GENERATED_DIR", "/tmp/ugcc_generated"))
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
MODELS_DIR = Path(__file__).parent.parent / "models"

GENERATED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
VOICES_PATH = MODELS_DIR / "voices-v1.0.bin"

_kokoro = None

# Available voices in voices-v1.0.bin (af_ = American Female, am_ = American Male, bm_ = British Male, bf_ = British Female)
VOICE_MAP = {
    "neutral": "af_heart",
    "calm": "af_heart",
    "excited": "af_sky",
    "authoritative": "bm_george",
    "dramatic": "bm_george",
    "default": "af_heart",
    "nova": "af_sky",
    "alloy": "am_adam",
    "echo": "am_echo",
    "fable": "bm_fable",
    "onyx": "am_onyx",
    "shimmer": "af_bella",
}

VALID_VOICES = {
    "af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica", "af_kore",
    "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
    "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck",
    "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
    "bm_daniel", "bm_fable", "bm_george", "bm_lewis",
}


def _download_with_progress(url: str, dest: Path, label: str) -> None:
    if dest.exists():
        return
    print(f"[voice] Downloading {label}...")
    urllib.request.urlretrieve(url, dest)
    print(f"[voice] {label} downloaded ✓")


def _load_kokoro():
    global _kokoro
    if _kokoro is not None:
        return _kokoro

    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        raise RuntimeError("kokoro-onnx not installed. Run: pip install kokoro-onnx")

    _download_with_progress(MODEL_URL, MODEL_PATH, "kokoro-v1.0.onnx (~165MB)")
    _download_with_progress(VOICES_URL, VOICES_PATH, "voices-v1.0.bin (~430MB)")

    print("[voice] Loading Kokoro TTS model...")
    _kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
    print("[voice] Kokoro loaded ✓")
    return _kokoro


class VoiceRequest(BaseModel):
    text: str
    voice_id: str = "default"
    speed: float = 1.0
    emotion: str = "neutral"


def _generate_sync(req: VoiceRequest) -> dict:
    import soundfile as sf

    kokoro = _load_kokoro()
    file_id = uuid.uuid4().hex[:12]
    output_path = GENERATED_DIR / f"voice_{file_id}.wav"

    # Pick voice: emotion takes priority over voice_id
    voice_name = VOICE_MAP.get(req.emotion) if req.emotion != "neutral" else None
    if voice_name is None:
        voice_name = VOICE_MAP.get(req.voice_id, "af_heart")
    # Ensure the voice exists in this binary
    if voice_name not in VALID_VOICES:
        voice_name = "af_heart"

    speed = max(0.5, min(req.speed, 2.0))

    samples, sample_rate = kokoro.create(
        req.text,
        voice=voice_name,
        speed=speed,
        lang="en-us",
    )
    sf.write(str(output_path), samples, sample_rate)

    return {
        "url": f"{BACKEND_URL}/generated/{output_path.name}",
        "path": str(output_path),
        "file": output_path.name,
        "voice": voice_name,
    }


@router.post("/generate")
async def generate_voice(req: VoiceRequest):
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(_executor, _generate_sync, req)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
