import uuid
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.security import generate_upload_sas, generate_download_sas
from app.core.database import engine, Base, get_db
from app.models.file import FileMetadata

Base.metadata.create_all(bind=engine)

app = FastAPI(title="File Share")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/request-upload")
def request_upload_url(
    filename: str,
    content_type: str,
    size: int, 
    db: Session = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    db_file = FileMetadata(
        id=file_id,
        filename=filename,
        content_type=content_type,
        size_bytes=size
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    url = generate_upload_sas(file_id)

    return {
        "upload_url": url,
        "file_id": file_id,
    }

@app.get("/api/v1/file/{file_id}")
def request_download_url(
    file_id: str,
    db: Session = Depends(get_db)
):
    file_record = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_record:
        return {"error": "File not found"}
    
    url = generate_download_sas(file_id)
    
    return {
        "download_url": url,
        "filename": file_record.filename,
        "content_type": file_record.content_type,
        "size": file_record.size_bytes
    }