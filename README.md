# Naath Language Learning Platform

Naath is a full-stack language-learning and translation platform for Nuer (`nus_Latn`), a low-resource language spoken in South Sudan and Ethiopia. I built it after seeing children in the diaspora grow up without an accessible way to practice the language spoken by their families.

**Live application:** [frontend-one-iota-50.vercel.app](https://frontend-one-iota-50.vercel.app/)

## What it does

- Provides structured lessons and category-based learning paths
- Supports English-to-Nuer and Nuer-to-English translation
- Prioritizes verified, human-curated words and phrases over machine output
- Caches fallback translations to reduce repeated external requests
- Includes a searchable dictionary with detailed word pages
- Tracks learner accounts and progress
- Lets community members propose translations for review
- Supports pronunciation audio through S3-compatible storage

## Why it matters

Nuer has far fewer digital learning resources than widely supported languages. Naath combines community knowledge with practical software so younger speakers can learn vocabulary, practice lessons, and stay connected to their language. Machine-generated translations are treated as fallbacks—not as authoritative replacements for verified speakers.

## Architecture

```text
Next.js web application
        |
        | REST API
        v
FastAPI application
   |          |          |
PostgreSQL  Translation  S3-compatible audio
            fallback
```

The translation pipeline follows this order:

1. Search verified dictionary words.
2. Search verified phrases.
3. Return a previously cached fallback translation.
4. Request a fallback translation and cache the result.

## Technology

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand, Framer Motion
- **Backend:** FastAPI, Python, SQLAlchemy, Alembic, Pydantic
- **Data:** PostgreSQL in deployment and SQLite for local tests
- **Infrastructure:** Docker Compose, Vercel-compatible frontend, S3-compatible audio storage
- **Quality:** Pytest, ESLint, TypeScript, production build checks

## Run locally

### Backend

```bash
cp .env.example .env
docker compose up --build
```

The API is available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm ci
npm run dev
```

The web application is available at `http://localhost:3000`.

## Tests

```bash
pytest

cd frontend
npm run lint
npm run build
```

## Data and translation integrity

- Verified human translations take priority over automated output.
- Community submissions are kept separate until reviewed.
- Secrets, local databases, environment files, and generated build artifacts are excluded from version control.
- Nuer language data should be reviewed by fluent speakers before being treated as authoritative.

## Project status

Naath is an actively developed personal project. The current focus is expanding verified lesson content, improving pronunciation support, and strengthening the community review workflow.
