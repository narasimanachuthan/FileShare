from datetime import datetime, timedelta
from azure.storage.blob import generate_blob_sas, BlobSasPermissions, BlobServiceClient
from app.core.config import settings

def generate_upload_sas(filename: str) -> str:
    blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)

    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        account_key=blob_service_client.credential.account_key,
        container_name=settings.AZURE_CONTAINER_NAME,
        blob_name=filename,
        permission=BlobSasPermissions(write=True),
        expiry=datetime.utcnow() + timedelta(minutes=10)
    )

    upload_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{settings.AZURE_CONTAINER_NAME}/{filename}?{sas_token}"

    return upload_url

def generate_download_sas(filename: str) -> str:
    blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)

    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        account_key=blob_service_client.credential.account_key,
        container_name=settings.AZURE_CONTAINER_NAME,
        blob_name=filename,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(minutes=10)
    )

    download_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{settings.AZURE_CONTAINER_NAME}/{filename}?{sas_token}"

    return download_url