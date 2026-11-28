#!/usr/bin/env bash
# Empacota runtimes + vision + API e gera o DMG (rodar no macOS / CI)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Frontend → renderer
(cd "$ROOT/frontend" && npm ci && npm run build)
rm -rf "$ROOT/desktop/renderer"
cp -R "$ROOT/frontend/dist" "$ROOT/desktop/renderer"

bash "$ROOT/macos/scripts/package-api.sh"
bash "$ROOT/macos/scripts/package-vision.sh"
bash "$ROOT/macos/scripts/package-runtimes.sh"
bash "$ROOT/macos/scripts/make-icns.sh"

cd "$ROOT/desktop"
npm ci
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac

echo "DMG em $ROOT/desktop/dist/"
ls -lh "$ROOT/desktop/dist/"*.dmg 2>/dev/null || true
