from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_settings
from api.routes import auth, audio, contributions, dictionary, lessons, translate
from api.services.nllb_service import warm_up_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("Naath API starting up…")
    if settings.skip_model_warmup:
        logger.warning("SKIP_MODEL_WARMUP=true — NLLB model will not be loaded. "
                       "Translate requests will fall back to dictionary only.")
    else:
        logger.info("Warming up NLLB model (loading into memory)…")
        await warm_up_model()
        logger.info("NLLB model ready. API is live.")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("Naath API shutting down.")


app = FastAPI(
    title="Naath API",
    description=(
        "Language learning and translation API for Nuer (nus_Latn), "
        "a low-resource language spoken in South Sudan and Ethiopia."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(translate.router)
app.include_router(dictionary.router)
app.include_router(contributions.router)
app.include_router(lessons.router)
app.include_router(audio.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Naath API"}
