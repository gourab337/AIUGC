#!/bin/bash
# Start the UGCC local inference server (image + voice)
set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AIUGC_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

if [ ! -d "$SCRIPT_DIR/.venv" ]; then
    echo "Error: Python venv not found. Run setup-local-models.sh first."
    exit 1
fi

source "$SCRIPT_DIR/.venv/bin/activate"

export GENERATED_DIR="$AIUGC_DIR/backend/public/generated"
export BACKEND_URL="http://localhost:3001"

mkdir -p "$GENERATED_DIR"

echo "UGCC Inference Server starting on http://localhost:8000"
echo "Generated files → $GENERATED_DIR"
echo ""

cd "$SCRIPT_DIR"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
