from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://gz_user:gz_local_password@localhost:5432/groundzero"
    DATABASE_URL_SYNC: str = "postgresql://gz_user:gz_local_password@localhost:5432/groundzero"
    REDIS_URL: str = "redis://localhost:6379/0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # SPARK AI Companion — Bedrock via OpenAI-compatible proxy
    SPARK_API_KEY: str = ""  # set via .env / .env.production
    SPARK_BASE_URL: str = "https://bedrock-mantle.ap-southeast-2.api.aws/v1"
    SPARK_MODEL: str = "openai.gpt-oss-safeguard-120b"
    SPARK_MAX_TURNS: int = 4

    # Auth — JWT + bcrypt
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"  # override via .env
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # 100ms Live Class
    HMS_ACCESS_KEY: str = ""  # from 100ms dashboard
    HMS_APP_SECRET: str = ""  # from 100ms dashboard

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
