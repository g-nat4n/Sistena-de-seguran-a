#!/usr/bin/env bash
# Copia o JAR da API para macos/dist/api
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/macos/dist/api"
mkdir -p "$OUT"

JAR_SRC=""
if [[ -f "$ROOT/backend/target/smartguard-api-0.0.1-SNAPSHOT.jar" ]]; then
  JAR_SRC="$ROOT/backend/target/smartguard-api-0.0.1-SNAPSHOT.jar"
elif [[ -f "$ROOT/windows/dist/api/smartguard-api.jar" ]]; then
  JAR_SRC="$ROOT/windows/dist/api/smartguard-api.jar"
else
  echo "==> Compilando backend..."
  (cd "$ROOT/backend" && ./mvnw -q -DskipTests package)
  JAR_SRC="$ROOT/backend/target/smartguard-api-0.0.1-SNAPSHOT.jar"
fi

if [[ ! -f "$JAR_SRC" ]]; then
  echo "JAR não encontrado: $JAR_SRC" >&2
  exit 1
fi

cp -f "$JAR_SRC" "$OUT/smartguard-api.jar"
echo "API em $OUT/smartguard-api.jar"
