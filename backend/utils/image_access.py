from utils.gdrive import get_drive_service
import os
from tempfile import NamedTemporaryFile
from PIL import Image
from io import BytesIO
_image_cache: dict[str , bytes] = {}
# utils/image_access.py
from utils.gdrive import get_drive_service
from tempfile import NamedTemporaryFile
import os

# global in-memory cache {file_id: (bytes, mime_type)}
_image_cache: dict[str, tuple[bytes, str]] = {}

def image_secure_access(file_id: str) -> tuple[bytes, str] | None:
    """
    Fetch raw bytes of a Google Drive file using PyDrive2.
    Uses in-memory cache so the same file_id isn't fetched multiple times.
    Returns (file_bytes, mime_type).
    """
    if not file_id:
        return None

    # 1. Check cache
    if file_id in _image_cache:
        return _image_cache[file_id]

    drive = get_drive_service()
    gfile = drive.CreateFile({'id': file_id})

    with NamedTemporaryFile(delete=False) as tmp:
        tmp_path = tmp.name

    try:
        # 2. Download file once
        gfile.GetContentFile(tmp_path)
        with open(tmp_path, "rb") as f:
            file_bytes = f.read()

        mime_type = gfile.get("mimeType", "application/octet-stream")

        # 3. Store in cache
        _image_cache[file_id] = (file_bytes, mime_type)

        return file_bytes, mime_type

    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

from functools import lru_cache
from io import BytesIO
from PIL import Image

# Simple in-memory cache


def create_thumbnail_from_drive(file_id: str, size=(200, 200)) -> tuple[bytes, str] | None:
    """
    Create and return a cached thumbnail for a Google Drive image.
    Returns (thumbnail_bytes, "image/jpeg").
    """
    if not file_id:
        return None

    try:
        # 2. Download original image
        file_bytes, _ = image_secure_access(file_id)

        # 3. Create thumbnail
        img = Image.open(BytesIO(file_bytes)).convert("RGB")
        img.thumbnail(size)

        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=80)

        data = buffer.getvalue()
        if not data:
            raise ValueError("Thumbnail buffer is empty")

        # 4. Save to cache

        return data, "image/jpeg"

    except Exception as e:
        print(f"[Thumbnail Error] Could not create thumbnail for file {file_id}: {e}")
        return None



