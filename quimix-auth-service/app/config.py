from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_name: str = "quimix-auth-service"
    app_version: str = "0.1.0"
    database_url: str = "sqlite:///./quimix_auth.db"
    jwt_secret: str = "quimix_dev_jwt_secret_change_me_please_32chars"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 7
    seed_admin_enabled: bool = True
    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = "Admin@12345"
    seed_admin_name: str = "Admin Quimix"

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            value = "postgresql://" + value[len("postgres://") :]
        if value.startswith("postgresql://"):
            value = "postgresql+psycopg://" + value[len("postgresql://") :]
        return value


settings = Settings()
