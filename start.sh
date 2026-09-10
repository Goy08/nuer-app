#!/bin/bash
set -e

echo "=== Starting Naath API ==="
echo "PORT: $PORT"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo yes || echo NO)"

echo "=== Running migrations ==="
python -m alembic upgrade head

echo "=== Starting uvicorn ==="
exec uvicorn api.main:app --host 0.0.0.0 --port "${PORT:-8000}"
