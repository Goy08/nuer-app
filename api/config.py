from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"

    # Auth
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Database — Railway provides postgresql://, we need postgresql+asyncpg://
    database_url: str = "postgresql+asyncpg://naath:naath_password@localhost:5432/naath"

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "naath-audio"

    # ML
    nllb_model_name: str = "facebook/nllb-200-distilled-600M"
    model_device: str = "cpu"
    # Set true in local dev to skip the 2.4 GB model download at startup
    skip_model_warmup: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
