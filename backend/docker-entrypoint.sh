#!/bin/sh
set -e

# Render/Railway costumam expor DATABASE_URL no formato postgres://
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
  # postgres://user:pass@host:port/db  -> jdbc:postgresql://host:port/db
  WITHOUT_SCHEME=${DATABASE_URL#postgres://}
  WITHOUT_SCHEME=${WITHOUT_SCHEME#postgresql://}
  USERINFO=${WITHOUT_SCHEME%%@*}
  HOSTPART=${WITHOUT_SCHEME#*@}
  export DB_USERNAME=${USERINFO%%:*}
  export DB_PASSWORD=${USERINFO#*:}
  export DB_URL="jdbc:postgresql://${HOSTPART}"
fi

# Plataformas usam PORT
if [ -n "${PORT:-}" ]; then
  export SERVER_PORT="$PORT"
fi

exec java -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
