from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.security import generate_upload_sas

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
    url = generate_upload_sas(filename)
    return {"upload_url": url, "filename": filename}