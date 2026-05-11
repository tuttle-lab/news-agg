from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import httpx
import feedparser
import asyncio
import re
import os
import time as _time

# Cache daily data — APOD and Wiki only change once per day
_daily_cache: tuple[dict, float] | None = None
_DAILY_TTL = 3600.0

app = FastAPI(
    title="news-agg API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Per-source entry caps — academic feeds can drop 70+ papers at once
SOURCE_LIMITS = {
    "NBER":        5,
    "JMLR":        5,
    "arXiv q-fin": 6,
    "arXiv econ":  6,
}
DEFAULT_SOURCE_LIMIT = 12

RSS_FEEDS = {
    "Bloomberg":     "https://feeds.bloomberg.com/markets/news.rss",
    "NYT":           "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "WSJ":           "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    "FT":            "https://www.ft.com/rss/home",
    "NPR":           "http://www.npr.org/rss/rss.php?id=1019",
    "Hacker News":   "https://news.ycombinator.com/rss",
    "NoahPinion":    "https://noahpinion.substack.com/feed",
    "Derek Thompson":"https://derekthompson.substack.com/feed",
    "Marginal Rev":  "http://www.marginalrevolution.com/marginalrevolution/index.rdf",
    "JMLR":          "https://www.jmlr.org/jmlr.xml",
    "NBER":          "https://www.nber.org/rss/new.xml",
    "arXiv q-fin":   "https://rss.arxiv.org/rss/q-fin",
    "arXiv econ":    "https://rss.arxiv.org/rss/econ",
}

# BTC-USD goes through same Yahoo Finance path as equities
STOCK_SYMBOLS = ["SPY", "VOO", "JPM", "NVDA", "BTC-USD"]

PODCASTS = [
    {"name": "Odd Lots",          "rss": "https://feeds.simplecast.com/WBWmS_GU",          "spotify": "https://open.spotify.com/show/7BuQbpSBfwlhUbC9eOzpLw"},
    {"name": "Ezra Klein",        "rss": "https://rss.art19.com/the-ezra-klein-show",       "spotify": "https://open.spotify.com/show/3oB5noYIwEB2dMAREj2F7S"},
    {"name": "Dwarkesh",          "rss": "https://www.dwarkeshpatel.com/podcast/rss",       "spotify": "https://open.spotify.com/show/3PM2bAqoEKGOHaADv5ZUSY"},
    {"name": "EconTalk",          "rss": "https://www.econtalk.org/feed/",                 "spotify": "https://open.spotify.com/show/7fYCX0GasGDyz6EvMvbYQX"},
    {"name": "Money Stuff",       "rss": "https://feeds.megaphone.fm/money-stuff-the-podcast","spotify": "https://open.spotify.com/show/4PKxjMKMR4gK3Jcm5FJALz"},
    {"name": "Eye on the Market", "rss": "https://feeds.simplecast.com/JPM5762513472",      "spotify": "https://open.spotify.com/show/0kKMECGBMHIHeJrGnNNL5f"},
    {"name": "Huberman Lab",      "rss": "https://feeds.megaphone.fm/hubermanlab",          "spotify": "https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P"},
]

KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2"
KALSHI_SKIP = {"Sports"}
KALSHI_TOP_N = 5


@app.get("/api/ping")
def ping():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "news-agg-api",
    }


async def _fetch_yahoo(client: httpx.AsyncClient, symbol: str) -> tuple[str, dict]:
    try:
        res = await client.get(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
            params={"interval": "1d", "range": "1d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        meta = res.json()["chart"]["result"][0]["meta"]
        price = meta.get("regularMarketPrice") or meta.get("previousClose")
        prev  = meta.get("chartPreviousClose") or meta.get("previousClose")
        change_pct = round((price - prev) / prev * 100, 2) if prev else 0
        # Round BTC to nearest dollar, equities to 2dp
        decimals = 0 if symbol == "BTC-USD" else 2
        display_key = "BTC" if symbol == "BTC-USD" else symbol
        return display_key, {"price": round(price, decimals), "change_pct": change_pct}
    except Exception:
        display_key = "BTC" if symbol == "BTC-USD" else symbol
        return display_key, {"price": None, "change_pct": None, "error": "unavailable"}


@app.get("/api/tickers")
async def tickers():
    async with httpx.AsyncClient(timeout=8) as client:
        results_list = await asyncio.gather(
            *[_fetch_yahoo(client, sym) for sym in STOCK_SYMBOLS]
        )
    return {
        "tickers":   dict(results_list),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def _kalshi_series(client: httpx.AsyncClient) -> list[str]:
    try:
        r = await client.get(
            f"{KALSHI_BASE}/events",
            params={"limit": 100, "status": "open"},
            headers={"Accept": "application/json"},
        )
        if r.status_code != 200:
            return []
        return [
            e["series_ticker"]
            for e in r.json().get("events", [])
            if e.get("category") not in KALSHI_SKIP and e.get("series_ticker")
        ]
    except Exception:
        return []


@app.get("/api/kalshi")
async def kalshi():
    all_markets = []
    async with httpx.AsyncClient(timeout=15) as client:
        series = await _kalshi_series(client)

        async def fetch_series(st: str):
            try:
                r = await client.get(
                    f"{KALSHI_BASE}/markets",
                    params={"limit": 10, "status": "open", "series_ticker": st},
                    headers={"Accept": "application/json"},
                )
                if r.status_code != 200:
                    return
                for m in r.json().get("markets", []):
                    yes = m.get("yes_ask_dollars") or m.get("last_price_dollars")
                    if yes is None:
                        continue
                    liquidity = float(m.get("open_interest_fp") or m.get("volume_fp") or 0)
                    all_markets.append({
                        "ticker":    m.get("ticker", ""),
                        "title":     m.get("title", ""),
                        "yes_price": round(float(yes), 2),
                        "no_price":  round(1 - float(yes), 2),
                        "liquidity": liquidity,
                        "volume":    float(m.get("volume_fp") or 0),
                        "url":       f"https://kalshi.com/markets/{m.get('ticker', '')}",
                    })
            except Exception:
                pass

        await asyncio.gather(*[fetch_series(st) for st in series[:20]])

    # Top N by liquidity
    all_markets.sort(key=lambda m: m["liquidity"], reverse=True)
    top = all_markets[:KALSHI_TOP_N]
    for m in top:
        del m["liquidity"]  # internal sort key, not needed by client

    return {"markets": top, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/podcasts")
async def podcasts():
    results = []

    async def fetch_podcast(pod: dict):
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                res = await client.get(pod["rss"], headers={"User-Agent": "Mozilla/5.0"})
            feed = feedparser.parse(res.text)
            episodes = []
            for entry in feed.entries[:5]:
                duration = (
                    entry.get("itunes_duration")
                    or entry.get("duration")
                    or ""
                )
                summary = re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")[:800].strip()
                episodes.append({
                    "title":     entry.get("title", ""),
                    "summary":   summary,
                    "published": entry.get("published") or entry.get("updated", ""),
                    "duration":  str(duration),
                    "url":       entry.get("link", ""),
                })
            results.append({
                "name":     pod["name"],
                "spotify":  pod["spotify"],
                "episodes": episodes,
            })
        except Exception:
            results.append({"name": pod["name"], "spotify": pod["spotify"], "episodes": []})

    await asyncio.gather(*[fetch_podcast(p) for p in PODCASTS])
    # Preserve config order
    order = {p["name"]: i for i, p in enumerate(PODCASTS)}
    results.sort(key=lambda r: order.get(r["name"], 99))
    return {"podcasts": results, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/daily")
async def daily():
    global _daily_cache
    now = _time.monotonic()
    if _daily_cache and (now - _daily_cache[1]) < _DAILY_TTL:
        return _daily_cache[0]

    today = datetime.now(timezone.utc)
    nasa_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    wiki_ua  = "news-agg/1.0 (https://github.com/tuttle-lab/news-agg)"

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        nasa_res, wiki_res = await asyncio.gather(
            client.get("https://api.nasa.gov/planetary/apod", params={"api_key": nasa_key}),
            client.get(
                f"https://en.wikipedia.org/api/rest_v1/feed/featured"
                f"/{today.year}/{today.month:02d}/{today.day:02d}",
                headers={"User-Agent": wiki_ua},
            ),
            return_exceptions=True,
        )

    result: dict = {}

    try:
        d = nasa_res.json()
        result["apod"] = {
            "title":       d["title"],
            "explanation": d["explanation"][:500],
            "image_url":   d["url"] if d.get("media_type") == "image" else None,
            "hd_url":      d.get("hdurl"),
            "media_type":  d.get("media_type", "image"),
            "date":        d["date"],
            "link":        "https://apod.nasa.gov/apod/astropix.html",
        }
    except Exception:
        result["apod"] = None

    try:
        tfa = wiki_res.json().get("tfa", {})
        result["wiki"] = {
            "title":     tfa.get("normalizedtitle") or tfa.get("title", ""),
            "extract":   tfa.get("extract", "")[:400],
            "url":       tfa.get("content_urls", {}).get("desktop", {}).get("page", ""),
            "thumbnail": (tfa.get("thumbnail") or {}).get("source"),
        }
    except Exception:
        result["wiki"] = None

    result["date"] = today.strftime("%B %d, %Y")
    _daily_cache = (result, now)
    return result


@app.get("/api/news")
async def news(limit: int = 60):
    articles = []

    async def fetch_feed(source: str, url: str):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(
                    url,
                    headers={"User-Agent": "Mozilla/5.0"},
                    follow_redirects=True,
                )
            feed = feedparser.parse(res.text)
            cap = SOURCE_LIMITS.get(source, DEFAULT_SOURCE_LIMIT)
            for entry in feed.entries[:cap]:
                published = entry.get("published") or entry.get("updated", "")

                if source == "Hacker News":
                    primary_url = entry.get("comments") or entry.get("link", "")
                    article_url = entry.get("link", "")
                else:
                    primary_url = entry.get("link", "")
                    article_url = primary_url

                summary = re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")[:1000]

                articles.append({
                    "source":      source,
                    "title":       entry.get("title", ""),
                    "url":         primary_url,
                    "article_url": article_url,
                    "summary":     summary.strip(),
                    "published":   published,
                })
        except Exception:
            pass

    await asyncio.gather(*[fetch_feed(src, url) for src, url in RSS_FEEDS.items()])

    def sort_key(a):
        try:
            import email.utils
            return email.utils.parsedate_to_datetime(a["published"])
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    articles.sort(key=sort_key, reverse=True)
    return {
        "articles":  articles[:limit],
        "total":     len(articles),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
