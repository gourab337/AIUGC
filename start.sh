#!/bin/bash
# UGCC: AI UGC Studio — One-command startup
# Run this. Everything starts. Open http://localhost:5173.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── colors ───────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m'
C='\033[0;36m' B='\033[0;34m' P='\033[0;35m'
BOLD='\033[1m' NC='\033[0m'

clear
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         UGCC: AI UGC Studio — Starting          ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── pre-flight checks ────────────────────────────────────────────
if [ ! -d "$DIR/backend/node_modules" ]; then
    echo -e "${Y}Installing dependencies...${NC}"
    cd "$DIR/backend" && npm install --silent
    cd "$DIR/frontend" && npm install --silent
fi

if [ ! -d "$DIR/inference/.venv" ]; then
    echo -e "${R}Python inference server not set up.${NC}"
    echo "Run this first: cd inference && ./setup-local-models.sh"
    echo ""
    echo "Continuing without image/voice generation..."
fi

# ── kill anything using our ports ────────────────────────────────
for port in 3001 8000 5173; do
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

# ── start Ollama (for script generation) ─────────────────────────
echo -ne "${Y}→ Ollama (script AI)...${NC} "
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo -e "${G}already running${NC}"
else
    brew services start ollama 2>/dev/null || true
    sleep 3
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        echo -e "${G}started${NC}"
    else
        echo -e "${Y}starting in background${NC}"
    fi
fi

# ── start backend ─────────────────────────────────────────────────
echo -ne "${Y}→ Backend (port 3001)...${NC}  "
cd "$DIR/backend" && npm run dev > /tmp/ugcc-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${G}pid $BACKEND_PID${NC}"

# ── start inference server (image + voice AI) ─────────────────────
if [ -d "$DIR/inference/.venv" ]; then
    echo -ne "${Y}→ Inference (port 8000)...${NC} "
    cd "$DIR/inference" && \
      GENERATED_DIR="$DIR/backend/public/generated" \
      BACKEND_URL="http://localhost:3001" \
      .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/ugcc-inference.log 2>&1 &
    INFERENCE_PID=$!
    echo -e "${G}pid $INFERENCE_PID${NC}"
else
    INFERENCE_PID=""
fi

# ── start frontend ────────────────────────────────────────────────
echo -ne "${Y}→ Frontend (port 5173)...${NC} "
cd "$DIR/frontend" && npm run dev > /tmp/ugcc-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${G}pid $FRONTEND_PID${NC}"

# ── wait for services ─────────────────────────────────────────────
echo ""
echo -ne "Waiting for services..."
for i in {1..12}; do
    sleep 1
    echo -n "."
    BE=$(curl -s http://localhost:3001/api/health 2>/dev/null | grep -c '"ok"' || true)
    FE=$(curl -s http://localhost:5173 2>/dev/null | grep -c 'html\|vite' || true)
    [ "$BE" -gt 0 ] && [ "$FE" -gt 0 ] && break
done
echo ""

# ── status ───────────────────────────────────────────────────────
echo ""
svc() {
    local label=$1 url=$2
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "  ${G}●${NC} $label"
    else
        echo -e "  ${R}●${NC} $label ${R}(not responding — check log)${NC}"
    fi
}
echo -e "${BOLD}Services:${NC}"
svc "Ollama (LLM)         http://localhost:11434" "http://localhost:11434/api/version"
svc "Backend API          http://localhost:3001"  "http://localhost:3001/api/health"
[ -n "$INFERENCE_PID" ] && \
svc "Inference (img/voice) http://localhost:8000" "http://localhost:8000/health"
svc "Frontend             http://localhost:5173"  "http://localhost:5173"

echo ""
echo -e "${G}${BOLD}  Open: http://localhost:5173${NC}"
echo ""
echo -e "  Logs: tail -f /tmp/ugcc-backend.log"
echo -e "        tail -f /tmp/ugcc-inference.log"
echo -e "        tail -f /tmp/ugcc-frontend.log"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop everything."
echo ""

open "http://localhost:5173" 2>/dev/null &

# ── cleanup on exit ───────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${Y}Stopping services...${NC}"
    [ -n "$BACKEND_PID"   ] && kill "$BACKEND_PID"   2>/dev/null || true
    [ -n "$INFERENCE_PID" ] && kill "$INFERENCE_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID"  ] && kill "$FRONTEND_PID"  2>/dev/null || true
    for port in 3001 8000 5173; do
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
    done
    echo -e "${G}Done.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── tail all logs together ────────────────────────────────────────
tail -f /tmp/ugcc-backend.log /tmp/ugcc-inference.log /tmp/ugcc-frontend.log 2>/dev/null
