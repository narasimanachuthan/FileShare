import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from azure.storage.blob import BlobServiceClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.file import FileMetadata
from app.core.config import settings

def delete_expired_files():
    db: Session = SessionLocal()
    expiration_threshold = datetime.utcnow() - timedelta(minutes=1)

    print("Deleting Expired Files")
    try:
        now = datetime.utcnow()
        expired_files = db.query(FileMetadata).filter(
            ((FileMetadata.expiration_time < now) | (FileMetadata.max_downloads != None) & (FileMetadata.download_count >= FileMetadata.max_downloads))
        ).all()

        if not expired_files:
            print("No expired files found")
            return
        print(f"Found {len(expired_files)} expired files")

        blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(settings.AZURE_CONTAINER_NAME)

        for file_record in expired_files:
            file_id = file_record.id
            try:
                container_client.delete_blob(file_id)
            except Exception as e:
                print(f"Azure delete failed: {e}")
            db.delete(file_record)
        db.commit()
        print("Cleanup complete")
    except Exception as e:
        print(e)
    finally:
        db.close()

if __name__ == "__main__":
    delete_expired_files()
