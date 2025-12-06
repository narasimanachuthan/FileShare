from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class FileMetadata(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_upload_complete = Column(Boolean, default=False)
    expiration_time = Column(DateTime(timezone=True), nullable=False)
    max_downloads = Column(Integer, nullable=True)
    download_count = Column(Integer, default=0)