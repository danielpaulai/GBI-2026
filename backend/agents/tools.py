from __future__ import annotations

import json
import os
import re
import ssl
from html import unescape
from urllib.error import URLError
from urllib.parse import parse_qs, quote_plus, urlparse
from urllib.request import Request, urlopen

from langchain_core.tools import tool

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def _http_get(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=12) as response:
            return response.read().decode("utf-8", errors="ignore")
    except (ssl.SSLCertVerificationError, URLError) as error:
        reason = error.reason if isinstance(error, URLError) else error
        if not isinstance(reason, ssl.SSLCertVerificationError):
            raise
        # Some public pages in this environment present incomplete cert chains.
        insecure_context = ssl._create_unverified_context()
        with urlopen(request, timeout=12, context=insecure_context) as response:
            return response.read().decode("utf-8", errors="ignore")


def _strip_tags(raw_html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", raw_html, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _resolve_duckduckgo_link(href: str) -> str:
    if href.startswith("//"):
        href = f"https:{href}"
    parsed = urlparse(href)
    if "duckduckgo.com" not in parsed.netloc:
        return href
    query = parse_qs(parsed.query)
    return query.get("uddg", [href])[0]


def _http_post_json(url: str, payload: dict) -> str:
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore")


@tool
def search_web(query: str) -> str:
    """Search the public web and return the top results with titles, URLs, and snippets."""
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    html = _http_get(url)
    result_pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>|<div[^>]+class="result__snippet"[^>]*>)(?P<snippet>.*?)(?:</a>|</div>)',
        re.IGNORECASE,
    )

    matches = list(result_pattern.finditer(html))[:5]
    if not matches:
        return f"No web results found for: {query}"

    lines = [f"Top results for: {query}"]
    for index, match in enumerate(matches, start=1):
        title = _strip_tags(match.group("title"))
        href = _resolve_duckduckgo_link(match.group("href"))
        snippet = _strip_tags(match.group("snippet"))
        lines.append(f"{index}. {title}\nURL: {href}\nSnippet: {snippet}")
    return "\n\n".join(lines)


@tool
def fetch_web_page(url: str) -> str:
    """Fetch a web page and return a readable text excerpt for analysis."""
    raw_html = _http_get(url)
    text = _strip_tags(raw_html)
    excerpt = text[:5000]
    return f"Page: {url}\n\n{excerpt}"


@tool
def apify_google_search(query: str) -> str:
    """Use Apify Google Search Scraper for source-backed research when APIFY_API_TOKEN is configured."""
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        return "APIFY_API_TOKEN is not configured. Add it to backend/.env to enable Apify-backed research."

    actor = "apify~google-search-scraper"
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token={token}"
    payload = {
        "queries": query,
        "maxPagesPerQuery": 1,
        "resultsPerPage": 5,
        "languageCode": "en",
    }

    try:
        raw = _http_post_json(url, payload)
        items = json.loads(raw)
        if not isinstance(items, list) or not items:
            return f"Apify returned no results for: {query}"

        lines = [f"Apify results for: {query}"]
        for index, item in enumerate(items[:5], start=1):
            title = item.get("title") or item.get("organicResultsTitle") or "Untitled"
            link = item.get("url") or item.get("link") or ""
            snippet = item.get("description") or item.get("snippet") or ""
            lines.append(f"{index}. {title}\nURL: {link}\nSnippet: {snippet}")
        return "\n\n".join(lines)
    except Exception as exc:  # noqa: BLE001
        return f"Apify search failed for '{query}': {exc}"


WEB_RESEARCH_TOOLS = [search_web, fetch_web_page, apify_google_search]