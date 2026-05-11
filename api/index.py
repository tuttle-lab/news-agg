from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import httpx
import feedparser
import asyncio
import re

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

RSS_FEEDS = {
    "Bloomberg":   "https://feeds.bloomberg.com/markets/news.rss",
    "NYT":         "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "WSJ":         "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    "FT":          "https://www.ft.com/rss/home",
    "Hacker News": "https://news.ycombinator.com/rss",
}

# BTC-USD goes through same Yahoo Finance path as equities
STOCK_SYMBOLS = ["SPY", "VOO", "JPM", "NVDA", "BTC-USD"]

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
            for entry in feed.entries[:12]:
                published = entry.get("published") or entry.get("updated", "")

                if source == "Hacker News":
                    primary_url = entry.get("comments") or entry.get("link", "")
                    article_url = entry.get("link", "")
                else:
                    primary_url = entry.get("link", "")
                    article_url = primary_url

                summary = re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")[:300]

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
