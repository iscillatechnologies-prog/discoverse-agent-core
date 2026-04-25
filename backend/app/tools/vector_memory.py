"""Optional Weaviate vector memory. Falls back to no-op when not configured."""
from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)
_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not (settings.weaviate_url and settings.weaviate_api_key):
        return None
    try:
        import weaviate
        from weaviate.classes.init import Auth
        _client = weaviate.connect_to_weaviate_cloud(
            cluster_url=settings.weaviate_url,
            auth_credentials=Auth.api_key(settings.weaviate_api_key),
        )
        return _client
    except Exception as e:
        log.warning("weaviate.connect.failed", error=str(e))
        return None


async def recall(user_id: str, query: str, k: int = 5) -> list[str]:
    c = _get_client()
    if c is None:
        return []
    try:
        coll = c.collections.get("Memory")
        res = coll.query.near_text(query=query, limit=k, filters=None)
        return [o.properties.get("content", "") for o in res.objects]
    except Exception as e:
        log.warning("weaviate.recall.failed", error=str(e))
        return []


async def remember(user_id: str, content: str, kind: str = "fact") -> None:
    c = _get_client()
    if c is None:
        return
    try:
        coll = c.collections.get("Memory")
        coll.data.insert({"user_id": user_id, "kind": kind, "content": content})
    except Exception as e:
        log.warning("weaviate.remember.failed", error=str(e))
