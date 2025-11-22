import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.security import generate_upload_sas, generate_download_sas

app = FastAPI(title="File Share")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/request-upload")
def request_upload_url(filename: str):
    file_id = str(uuid.uuid4())
    url = generate_upload_sas(file_id)
    return {
        "upload_url": url,
        "file_id": file_id,
        "filename": filename
    }

@app.get("/api/v1/request-download")
def request_download_url(file_id: str):
    url = generate_download_sas(file_id)
    return {"download_url": url}