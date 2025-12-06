import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from pydantic import BaseModel
from app.core.security import generate_upload_sas, generate_download_sas
from app.core.database import engine, Base, get_db
from app.models.file import FileMetadata
from app.core.ratelimit import RateLimiter

Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024

app = FastAPI(title="File Share")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/request-upload",
    dependencies=[Depends(RateLimiter(times=5, seconds=3600))]
)
def request_upload_url(
    filename: str,
    content_type: str,
    size: int,
    expire_hours: int = 24,
    max_downloads: int | None = None,
    password: str | None = None,
    db: Session = Depends(get_db)
):
    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=403,
            detail=f"File size exceeds the limit of {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB"
        )
    expiration_time = datetime.utcnow() + timedelta(hours=expire_hours)
    file_id = str(uuid.uuid4())
    hashed_pwd = pwd_context.hash(password) if password else None
    db_file = FileMetadata(
        id=file_id,
        filename=filename,
        content_type=content_type,
        size_bytes=size,
        expiration_time=expiration_time,
        max_downloads=max_downloads,
        password_hash=hashed_pwd
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    url = generate_upload_sas(file_id)

    return {
        "upload_url": url,
        "file_id": file_id,
    }

@app.get("/api/v1/file/{file_id}/preview")
def preview_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    file_record = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_record:
        return JSONResponse(status_code=404, content={"message": "File not found"})
    if datetime.now(timezone.utc) > file_record.expiration_time:
        return JSONResponse(status_code=410, content={"message": "File has expired"})
    
    return {
        "filename": file_record.filename,
        "content_type": file_record.content_type,
        "size": file_record.size_bytes,
        "max_downloads": file_record.max_downloads,
        "download_count": file_record.download_count,
        "is_protected": file_record.password_hash is not None
    }

class PasswordRequest(BaseModel):
    password: str

@app.post("/api/v1/file/{file_id}/verify")
def verify_password(
    file_id: str,
    body: PasswordRequest,
    db: Session = Depends(get_db)
):
    file_record = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_record:
        return JSONResponse(status_code=404, content={"message": "File not found"})
    if not file_record.password_hash:
        return JSONResponse(status_code=400, content={"message": "File is not password protected"})
    if not pwd_context.verify(body.password, file_record.password_hash):
        return JSONResponse(status_code=401, content={"message": "Incorrect password"})        
    if datetime.now(timezone.utc) > file_record.expiration_time:
        return JSONResponse(status_code=410, content={"message": "File has expired"})
    if file_record.max_downloads is not None:
        if file_record.download_count >= file_record.max_downloads:
             return JSONResponse(status_code=410, content={"message": "Download limit reached"})
    
    file_record.download_count += 1
    db.commit()

    url = generate_download_sas(file_id)

    return {"download_url": url} 


@app.get("/api/v1/file/{file_id}")
def request_download_url(
    file_id: str,
    db: Session = Depends(get_db)
):
    file_record = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_record:
        return JSONResponse(status_code=404, content={"message": "File not found"})
    if datetime.now(timezone.utc) > file_record.expiration_time:
        return JSONResponse(status_code=410, content={"message": "File has expired"})
    if file_record.max_downloads is not None:
        if file_record.download_count >= file_record.max_downloads:
            return JSONResponse(status_code=410, content={"message": "Download limit reached"})
    if file_record.password_hash:
        return JSONResponse(status_code=403, content={"message": "Password required. Use /verify endpoint."})
    
    file_record.download_count += 1
    db.commit()
    
    url = generate_download_sas(file_id)
    
    return {
        "download_url": url,
        "filename": file_record.filename,
    }