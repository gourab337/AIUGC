#!/bin/bash
# UGCC Local Model Setup — M4 MacBook Pro (16GB RAM)
# Installs: Ollama (LLM), ffmpeg (video assembly), Python inference server (image + voice)
# Run from the AIUGC project root or the inference/ directory.

set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIUGC_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║      UGCC Local Model Setup — M4 MacBook Pro        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "This will install:"
echo "  • Ollama       — local LLM runtime for script generation"
echo "  • qwen2.5:7b   — 4.7GB LLM download"
echo "  • ffmpeg       — video assembly (Ken Burns effect)"
echo "  • Python 3.12  — for image + voice inference server"
echo "  • mflux        — FLUX.1-Schnell for Apple Silicon (image)"
echo "  • kokoro-onnx  — Kokoro 82M TTS (voice)"
echo ""
echo "Note: FLUX model (~6GB) downloads on first image generation."
echo "Note: Kokoro model (~400MB) downloads on first voice generation."
echo ""

# ─── 1. Brew dependencies ───────────────────────────────────
echo -e "${YELLOW}[1/5] Installing brew dependencies...${NC}"
brew install ollama ffmpeg python@3.12 2>/dev/null || {
    echo "Some packages may already be installed — continuing."
}
echo -e "${GREEN}✓ brew dependencies ready${NC}"

# ─── 2. Ollama service ──────────────────────────────────────
echo -e "${YELLOW}[2/5] Starting Ollama service...${NC}"
brew services start ollama 2>/dev/null || true
# Give it a moment to start
sleep 3
# Check if Ollama is responding
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "  Ollama service not responding — starting manually..."
    ollama serve &>/tmp/ollama.log &
    sleep 5
fi
echo -e "${GREEN}✓ Ollama running at http://localhost:11434${NC}"

# ─── 3. Pull LLM model ──────────────────────────────────────
echo -e "${YELLOW}[3/6] Pulling qwen2.5:7b (4.7GB download)...${NC}"
echo "  This may take several minutes on first run."
ollama pull qwen2.5:7b
echo -e "${GREEN}✓ qwen2.5:7b ready${NC}"

# ─── 4. Python inference server ─────────────────────────────
echo -e "${YELLOW}[4/6] Setting up Python inference server...${NC}"
cd "$SCRIPT_DIR"

PYTHON="/opt/homebrew/bin/python3.12"
if [ ! -f "$PYTHON" ]; then
    PYTHON="/usr/local/bin/python3.12"
fi
if [ ! -f "$PYTHON" ]; then
    PYTHON="$(which python3.12 2>/dev/null || which python3 2>/dev/null)"
fi

echo "  Using Python: $PYTHON ($($PYTHON --version 2>&1))"

if [ ! -d ".venv" ]; then
    "$PYTHON" -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt
deactivate
echo -e "${GREEN}✓ Python inference server dependencies installed${NC}"

# ─── 5. Download Kokoro TTS model files ─────────────────────
echo -e "${YELLOW}[5/6] Downloading Kokoro TTS model files...${NC}"
mkdir -p "$SCRIPT_DIR/models"
KOKORO_MODEL="$SCRIPT_DIR/models/kokoro-v1.0.onnx"
KOKORO_VOICES="$SCRIPT_DIR/models/voices-v1.0.bin"
if [ ! -f "$KOKORO_MODEL" ]; then
    echo "  Downloading kokoro-v1.0.onnx (~310MB)..."
    curl -L --max-time 300 -o "$KOKORO_MODEL" \
      "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
fi
if [ ! -f "$KOKORO_VOICES" ]; then
    echo "  Downloading voices-v1.0.bin (~27MB)..."
    curl -L --max-time 60 -o "$KOKORO_VOICES" \
      "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
fi
echo -e "${GREEN}✓ Kokoro TTS models ready${NC}"

# ─── 6. Directories ─────────────────────────────────────────
echo -e "${YELLOW}[6/6] Creating output directories...${NC}"
mkdir -p "$AIUGC_DIR/backend/public/generated"
echo -e "${GREEN}✓ Directories ready${NC}"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                   Setup Complete!                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the backend (if not running):"
echo "     cd $AIUGC_DIR/backend && npm run dev"
echo ""
echo "  2. Start the inference server (in a new terminal):"
echo "     cd $SCRIPT_DIR && ./start-inference.sh"
echo ""
echo "  3. In the studio, select any model marked 'Free (local)'"
echo "     and run the workflow. Ollama handles script, ffmpeg"
echo "     handles video instantly, and the inference server"
echo "     handles image + voice (first run downloads models)."
echo ""
echo "  Script model:  qwen2.5-7b-local  → Ollama qwen2.5:7b"
echo "  Image model:   flux-schnell-local → FLUX.1-Schnell (MLX)"
echo "  Voice model:   kokoro-82m-local   → Kokoro 82M (ONNX)"
echo "  Video model:   ltx-2-3-local      → ffmpeg Ken Burns"
echo ""
