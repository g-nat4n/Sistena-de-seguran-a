#!/usr/bin/env bash
# Empacota JRE 21 (arm64) + Python standalone (arm64) com deps RTSP.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE="$ROOT/macos/dist/cache"
JRE_OUT="$ROOT/macos/dist/runtime/jre"
PY_OUT="$ROOT/macos/dist/vision/python"
REQ="$ROOT/ai/requirements-rtsp.txt"

mkdir -p "$CACHE"

echo "==> Baixando Eclipse Temurin JRE 21 (mac aarch64)..."
JRE_TGZ="$CACHE/temurin-jre21-mac-aarch64.tar.gz"
JRE_URL="https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jre/hotspot/normal/eclipse"
curl -fsSL -o "$JRE_TGZ" "$JRE_URL"

JRE_TMP="$CACHE/jre-extract"
rm -rf "$JRE_TMP"
mkdir -p "$JRE_TMP"
tar -xzf "$JRE_TGZ" -C "$JRE_TMP"
# Adoptium mac: Contents/Home
INNER="$(find "$JRE_TMP" -type d -path '*/Contents/Home' | head -n 1)"
if [[ -z "$INNER" ]]; then
  INNER="$(find "$JRE_TMP" -maxdepth 2 -type d | tail -n 1)"
fi
rm -rf "$JRE_OUT"
mkdir -p "$(dirname "$JRE_OUT")"
mv "$INNER" "$JRE_OUT"
chmod +x "$JRE_OUT/bin/java"
echo "JRE em $JRE_OUT"

echo "==> Baixando Python standalone 3.11 (macOS arm64)..."
# python-build-standalone (indygreg) — interpretador portátil
PY_TGZ="$CACHE/python-3.11-macos-aarch64.tar.gz"
PY_URL="https://github.com/astral-sh/python-build-standalone/releases/download/20241016/cpython-3.11.10%2B20241016-aarch64-apple-darwin-install_only.tar.gz"
curl -fsSL -L -o "$PY_TGZ" "$PY_URL"

PY_TMP="$CACHE/python-extract"
rm -rf "$PY_TMP"
mkdir -p "$PY_TMP"
tar -xzf "$PY_TGZ" -C "$PY_TMP"
# extrai pasta "python/"
if [[ -d "$PY_TMP/python" ]]; then
  SRC_PY="$PY_TMP/python"
else
  SRC_PY="$(find "$PY_TMP" -maxdepth 2 -type d -name 'bin' | head -n 1 | xargs dirname)"
fi
rm -rf "$PY_OUT"
mkdir -p "$(dirname "$PY_OUT")"
mv "$SRC_PY" "$PY_OUT"
chmod +x "$PY_OUT/bin/python3" || true
chmod +x "$PY_OUT/bin/python" || true

PY_EXE="$PY_OUT/bin/python3"
if [[ ! -x "$PY_EXE" ]]; then
  PY_EXE="$PY_OUT/bin/python"
fi
echo "Python em $PY_EXE"

echo "==> Instalando deps RTSP no Python embutido..."
"$PY_EXE" -m pip install --upgrade pip
"$PY_EXE" -m pip install -r "$REQ"

echo "Runtimes OK"
