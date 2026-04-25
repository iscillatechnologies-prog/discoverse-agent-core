"""Web research tool using Playwright for resilient HTML extraction.

Uses DuckDuckGo HTML endpoint as the search engine (no API key required).
"""
import asyncio
import re
from urllib.parse import quote_plus

from bs4 import BeautifulSoup
import httpx

from app.core.logging import get_logger

log = get_logger(__name__)


async def search_and_extract(query: str, max_results: int = 5) -> list[dict]:
    """Search the web and return [{title, url, snippet}, ...]."""
    try:
        results = await _ddg_search(query, max_results)
    except Exception as e:
        log.warning("web.search.failed", error=str(e))
        return []

    # Enrich top results with extracted snippets via Playwright
    enriched: list[dict] = []
    for r in results[:max_results]:
        snippet = r.get("snippet", "")
        try:
            extracted = await _extract_with_playwright(r["url"])
            if extracted:
                snippet = (extracted[:500] + "…") if len(extracted) > 500 else extracted
        except Exception as e:
            log.info("web.extract.skipped", url=r["url"], error=str(e))
        enriched.append({"title": r["title"], "url": r["url"], "snippet": snippet})
    return enriched


async def _ddg_search(query: str, max_results: int) -> list[dict]:
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; DiscoverseBot/1.0)"}
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        r = await client.get(url, headers=headers)
        r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    results = []
    for a in soup.select("a.result__a")[:max_results]:
        href = a.get("href", "")
        # DDG sometimes wraps: extract uddg
        m = re.search(r"uddg=([^&]+)", href)
        if m:
            from urllib.parse import unquote
            href = unquote(m.group(1))
        title = a.get_text(strip=True)
        snippet_el = a.find_parent().find_next("a", class_="result__snippet")
        snippet = snippet_el.get_text(" ", strip=True) if snippet_el else ""
        if href.startswith("http"):
            results.append({"title": title, "url": href, "snippet": snippet})
    return results


async def _extract_with_playwright(url: str) -> str:
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        context = await browser.new_context()
        page = await context.new_page()
        try:
            await page.goto(url, timeout=10_000, wait_until="domcontentloaded")
            text = await page.evaluate("() => document.body.innerText")
            return (text or "").strip()
        finally:
            await context.close()
            await browser.close()
