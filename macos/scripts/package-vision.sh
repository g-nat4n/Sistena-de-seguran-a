#!/usr/bin/env bash
# Copia o código Vision (ai/) para macos/dist/vision (sem o python embutido — vem do package-runtimes)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/macos/dist/vision"
SRC="$ROOT/ai"

rm -rf "$OUT"
mkdir -p "$OUT"

# Copia app + requirements; evita caches/venv locais
rsync -a --delete \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.venv' \
  --exclude 'venv' \
  --exclude 'data' \
  --exclude 'python' \
  --exclude '.pytest_cache' \
  "$SRC/" "$OUT/"

# requirements usado pelo empacote de runtimes
if [[ ! -f "$OUT/requirements-rtsp.txt" ]]; then
  cp -f "$ROOT/ai/requirements-rtsp.txt" "$OUT/requirements-rtsp.txt"
fi

echo "Vision em $OUT"
