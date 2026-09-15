from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_name: str = "quimix-api-gateway"
    app_version: str = "0.1.0"
    cors_origins: str = "http://localhost:5173"
    rate_limit_per_minute: int = 120
    simulation_service_url: str = "http://localhost:8001"
    auth_service_url: str = "http://localhost:8002"
    jwt_secret: str = "quimix_dev_jwt_secret_change_me_please_32chars"
    jwt_algorithm: str = "HS256"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
