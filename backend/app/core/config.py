import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Aegis"
    API_V1_STR: str = "/api/v1"

    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_CONTAINER_NAME: str = "content"

    class Config:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "../../../"))
        env_file = os.path.join(project_root, ".env")
        case_sensitive = True

settings = Settings()
