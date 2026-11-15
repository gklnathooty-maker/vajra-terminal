from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Stock Intelligence"
    environment: str = "production"
    database_url: str = "postgresql+psycopg://USER:PASSWORD@HOST:5432/stockintel"
    redis_url: str = "redis://HOST:6379/0"
    firebase_project_id: str = ""
    provider_name: str = "licensed-provider"
    provider_api_key: str = ""

settings=Settings()
