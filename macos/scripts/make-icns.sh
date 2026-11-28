#!/usr/bin/env bash
# Gera assets/icon.icns a partir de desktop/assets/icon.png (precisa macOS: sips + iconutil)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PNG="$ROOT/desktop/assets/icon.png"
OUT_DIR="$ROOT/desktop/assets"
ICONSET="$OUT_DIR/icon.iconset"

if [[ ! -f "$PNG" ]]; then
  echo "icon.png não encontrado: $PNG" >&2
  exit 1
fi

rm -rf "$ICONSET"
mkdir -p "$ICONSET"
for size in 16 32 64 128 256 512; do
  sips -z "$size" "$size" "$PNG" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  d2=$((size * 2))
  sips -z "$d2" "$d2" "$PNG" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$OUT_DIR/icon.icns"
rm -rf "$ICONSET"
echo "Gerado $OUT_DIR/icon.icns"
