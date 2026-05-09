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
    token = os.getenv("APIFY_API_TOKEN") or os.getenv("APIFY_API_KEY")
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


# ── Apify social scraping tools ──────────────────────────────────────────────

def _apify_run(actor: str, payload: dict) -> list:
    """Run an Apify actor synchronously and return the dataset items."""
    token = os.getenv("APIFY_API_TOKEN") or os.getenv("APIFY_API_KEY")
    if not token:
        return []
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token={token}&timeout=60&memory=256"
    raw = _http_post_json(url, payload)
    items = json.loads(raw)
    return items if isinstance(items, list) else []


@tool
def scrape_linkedin_profile(profile_url: str) -> str:
    """Scrape a LinkedIn profile or company page to get posts, bio, and engagement context."""
    items = _apify_run("apify~linkedin-profile-scraper", {"startUrls": [{"url": profile_url}]})
    if not items:
        return f"No LinkedIn data found for: {profile_url}"
    item = items[0]
    lines = [f"LinkedIn profile: {profile_url}"]
    lines.append(f"Name: {item.get('fullName') or item.get('name') or 'Unknown'}")
    lines.append(f"Headline: {item.get('headline', '')}")
    lines.append(f"Summary: {item.get('summary', '')[:800]}")
    posts = item.get("posts") or item.get("articles") or []
    if posts:
        lines.append(f"\nTop posts ({len(posts[:5])}):")
        for post in posts[:5]:
            text = post.get("text") or post.get("commentary") or ""
            likes = post.get("likeCount") or post.get("numLikes") or 0
            lines.append(f"  [{likes} likes] {text[:300]}")
    return "\n".join(lines)


@tool
def scrape_instagram_profile(username_or_url: str) -> str:
    """Scrape an Instagram profile to get recent posts, captions, and engagement."""
    payload = {"usernames": [username_or_url.replace("https://www.instagram.com/", "").strip("/")], "resultsType": "posts", "resultsLimit": 10}
    items = _apify_run("apify~instagram-scraper", payload)
    if not items:
        return f"No Instagram data found for: {username_or_url}"
    lines = [f"Instagram profile: {username_or_url}"]
    for post in items[:5]:
        caption = post.get("caption") or ""
        likes = post.get("likesCount") or 0
        comments = post.get("commentsCount") or 0
        post_type = post.get("type") or "post"
        lines.append(f"\n[{post_type} · {likes} likes · {comments} comments]\n{caption[:400]}")
    return "\n".join(lines)


@tool
def scrape_facebook_page(page_url: str) -> str:
    """Scrape a Facebook page to get recent posts and engagement."""
    items = _apify_run("apify~facebook-pages-scraper", {"startUrls": [{"url": page_url}], "maxPosts": 5})
    if not items:
        return f"No Facebook data found for: {page_url}"
    lines = [f"Facebook page: {page_url}"]
    for item in items[:1]:
        lines.append(f"Page: {item.get('title') or ''}")
        for post in (item.get("posts") or [])[:5]:
            text = post.get("text") or ""
            likes = post.get("likes") or 0
            lines.append(f"\n[{likes} likes] {text[:400]}")
    return "\n".join(lines)


@tool
def search_news_articles(query: str) -> str:
    """Search for recent news articles and blog posts on a topic using Apify Google News Scraper."""
    token = os.getenv("APIFY_API_TOKEN") or os.getenv("APIFY_API_KEY")
    if not token:
        # Fallback to DuckDuckGo news search
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query + ' site:medium.com OR site:forbes.com OR site:techcrunch.com')}"
        try:
            html = _http_get(url)
            result_pattern = re.compile(
                r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>[\s\S]*?<[^>]+class="result__snippet"[^>]*>(?P<snippet>.*?)</[^>]+>',
                re.IGNORECASE,
            )
            matches = list(result_pattern.finditer(html))[:5]
            lines = [f"News results for: {query}"]
            for i, m in enumerate(matches, 1):
                lines.append(f"{i}. {_strip_tags(m.group('title'))}\n   {_strip_tags(m.group('snippet'))}")
            return "\n\n".join(lines) if len(lines) > 1 else f"No news found for: {query}"
        except Exception as exc:  # noqa: BLE001
            return f"News search failed: {exc}"

    items = _apify_run("apify~google-news-scraper", {"query": query, "maxItems": 8, "language": "en"})
    if not items:
        return f"No news articles found for: {query}"
    lines = [f"News articles for: {query}"]
    for i, item in enumerate(items[:6], 1):
        title = item.get("title") or "Untitled"
        source = item.get("source") or ""
        snippet = item.get("description") or item.get("snippet") or ""
        url = item.get("url") or item.get("link") or ""
        lines.append(f"{i}. {title} ({source})\nURL: {url}\n{snippet[:300]}")
    return "\n\n".join(lines)


# ── DALL-E 3 image generation ─────────────────────────────────────────────────

@tool
def generate_image_dalle(prompt: str) -> str:
    """Generate an image using DALL-E 3 and return the URL. Use for blog post hero images and section visuals."""
    import urllib.request as req
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return f"OPENAI_API_KEY not configured. Image prompt was: {prompt}"
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1792x1024",
        "quality": "standard",
        "response_format": "url",
    }
    request = req.Request(
        "https://api.openai.com/v1/images/generations",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with req.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
        url = data["data"][0]["url"]
        revised = data["data"][0].get("revised_prompt", "")
        return f"IMAGE_URL: {url}\nRevised prompt: {revised}"
    except Exception as exc:  # noqa: BLE001
        return f"Image generation failed: {exc}. Prompt was: {prompt}"


# ── Tool sets ─────────────────────────────────────────────────────────────────

SOCIAL_SCRAPE_TOOLS = [scrape_linkedin_profile, scrape_instagram_profile, scrape_facebook_page]
BLOG_TOOLS = [search_web, fetch_web_page, apify_google_search, search_news_articles, generate_image_dalle]
FULL_RESEARCH_TOOLS = [search_web, fetch_web_page, apify_google_search, search_news_articles]