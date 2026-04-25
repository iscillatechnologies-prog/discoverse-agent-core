"""Serve generated artifacts (PDFs, CSVs) created by the agents."""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.tools.document_gen import ARTIFACTS_DIR

router = APIRouter()


@router.get("/{filename}")
async def get_artifact(filename: str):
    safe = Path(filename).name  # strip any path traversal
    path = ARTIFACTS_DIR / safe
    if not path.exists():
        raise HTTPException(404, "Artifact not found")
    return FileResponse(path)
