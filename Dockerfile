FROM python:3.11-slim

WORKDIR /app

# System dependencies needed for psycopg2 and torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-download the NLLB model at build time so it's baked into the image
# Comment this out if you prefer to download at first run instead
ARG DOWNLOAD_MODEL=false
RUN if [ "$DOWNLOAD_MODEL" = "true" ]; then \
    python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
    AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); \
    AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"; \
    fi

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
