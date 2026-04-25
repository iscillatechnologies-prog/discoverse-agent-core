from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "discoverse-ai"}


@router.get("/")
async def root():
    return {"name": "Discoverse AI", "vendor": "Rhinoes Innovation Labs", "docs": "/docs"}
