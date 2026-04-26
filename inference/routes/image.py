"""Stable Diffusion image generation via diffusers + PyTorch MPS (Apple Silicon).

Model: Lykon/dreamshaper-8 — cinematic, photorealistic, great for UGC marketing.
No HuggingFace token required. Downloads ~2GB on first run.
"""

import asyncio
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=1)

GENERATED_DIR = Path(os.getenv("GENERATED_DIR", "/tmp/ugcc_generated"))
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

MODEL_ID = "Lykon/dreamshaper-8"
_pipeline = None


def _load_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    import torch
    from diffusers import StableDiffusionPipeline, EulerDiscreteScheduler

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    # float16 on MPS produces NaN/black images — use float32 for stable output
    dtype = torch.float32

    print(f"[image] Loading {MODEL_ID} on {device} (first run downloads ~2GB)...")

    pipe = StableDiffusionPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config)
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()

    print(f"[image] {MODEL_ID} loaded ✓")
    _pipeline = pipe
    return _pipeline


class ImageRequest(BaseModel):
    prompt: str
    style: str = "cinematic"
    width: int = 576
    height: int = 1024
    steps: int = 20
    num_images: int = 3
    model_alias: Optional[str] = "schnell"


def _generate_sync(req: ImageRequest) -> dict:
    import torch
    from PIL import Image as PILImage

    pipe = _load_pipeline()

    # SD 1.5-based models work best at multiples of 64 near 512px
    gen_w = 512
    gen_h = 768  # ~2:3 portrait — close to 9:16 UGC format

    style_prefix = {
        "cinematic": "cinematic photo, dramatic lighting, shallow depth of field",
        "ugc":       "UGC style, authentic, lifestyle photography, natural light",
        "product":   "commercial product photography, clean background, studio lighting",
        "portrait":  "portrait photography, cinematic, detailed face, professional",
    }.get(req.style, "cinematic photo, high quality, detailed")

    full_prompt = f"{style_prefix}, {req.prompt}, 8k, sharp focus, professional"
    negative = "blurry, ugly, bad anatomy, watermark, text, low quality, pixelated"

    steps = max(10, min(req.steps, 30))
    num_images = max(1, min(req.num_images, 4))

    # Use CPU generator — MPS generator causes black/NaN images
    generator = torch.Generator("cpu").manual_seed(42)

    with torch.no_grad():
        result = pipe(
            prompt=full_prompt,
            negative_prompt=negative,
            width=gen_w,
            height=gen_h,
            num_inference_steps=steps,
            guidance_scale=7.5,
            num_images_per_prompt=num_images,
            generator=generator,
        )

    urls = []
    for img in result.images:
        file_id = uuid.uuid4().hex[:12]
        output_path = GENERATED_DIR / f"image_{file_id}.png"
        if (req.width, req.height) != (gen_w, gen_h):
            img = img.resize((req.width, req.height), PILImage.LANCZOS)
        img.save(str(output_path))
        urls.append(f"{BACKEND_URL}/generated/{output_path.name}")

    return {
        "urls": urls,
        "url": urls[0],
    }


@router.post("/generate")
async def generate_image(req: ImageRequest):
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(_executor, _generate_sync, req)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
