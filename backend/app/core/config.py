import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str

    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_CONTAINER_NAME: str

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_DB: str
    DATABASE_URL: str

    REDIS_URL: str

    class Config:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "../../../"))
        env_file = os.path.join(project_root, ".env")
        case_sensitive = True

settings = Settings()
