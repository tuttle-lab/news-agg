from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import httpx
import feedparser
import asyncio

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
    "Reuters":      "https://feeds.reuters.com/reuters/topNews",
    "AP":           "https://feeds.apnews.com/rss/apf-topnews",
    "Hacker News":  "https://news.ycombinator.com/rss",
    "FT":           "https://www.ft.com/rss/home",
}

KALSHI_MARKETS = [
    "FED-25JUN",   # Fed rate decision
    "INFL-25JUN",  # CPI / inflation
    "REC-25",      # Recession
]


@app.get("/api/ping")
def ping():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "news-agg-api",
    }


@app.get("/api/tickers")
async def tickers():
    results = {}
    async with httpx.AsyncClient(timeout=8) as client:
        spy_task = client.get(
            "https://query1.finance.yahoo.com/v8/finance/chart/SPY",
            params={"interval": "1d", "range": "1d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        btc_task = client.get(
            "https://api.crypto.com/exchange/v1/public/get-ticker",
            params={"instrument_name": "BTC_USDT"},
        )
        spy_res, btc_res = await asyncio.gather(spy_task, btc_task, return_exceptions=True)

    # SPY
    try:
        data = spy_res.json()
        meta = data["chart"]["result"][0]["meta"]
        price = meta.get("regularMarketPrice") or meta.get("previousClose")
        prev  = meta.get("chartPreviousClose") or meta.get("previousClose")
        change_pct = round((price - prev) / prev * 100, 2) if prev else 0
        results["SPY"] = {"price": round(price, 2), "change_pct": change_pct}
    except Exception:
        results["SPY"] = {"price": None, "change_pct": None, "error": "unavailable"}

    # BTC
    try:
        data = btc_res.json()
        ticker = data["result"]["data"]
        price = float(ticker["a"])  # best ask as proxy for last price
        change_pct = round(float(ticker.get("c", 0)), 2)
        results["BTC"] = {"price": round(price, 0), "change_pct": change_pct}
    except Exception:
        results["BTC"] = {"price": None, "change_pct": None, "error": "unavailable"}

    return {"tickers": results, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/kalshi")
async def kalshi():
    markets = []
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://trading-api.kalshi.com/trade-api/v2/markets",
                params={"limit": 20, "status": "open"},
                headers={"Accept": "application/json"},
            )
        if resp.status_code == 200:
            data = resp.json()
            for m in data.get("markets", [])[:12]:
                yes_ask = m.get("yes_ask") or m.get("last_price") or 0
                markets.append({
                    "ticker":    m.get("ticker_name", ""),
                    "title":     m.get("title", ""),
                    "yes_price": round(yes_ask / 100, 2) if yes_ask else None,
                    "volume":    m.get("volume", 0),
                })
    except Exception:
        pass

    return {
        "markets": markets,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Requires Kalshi API key for full access" if not markets else None,
    }


@app.get("/api/news")
async def news(limit: int = 40):
    articles = []

    async def fetch_feed(source: str, url: str):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"}, follow_redirects=True)
            feed = feedparser.parse(resp.text)
            for entry in feed.entries[:10]:
                published = entry.get("published", "") or entry.get("updated", "")
                articles.append({
                    "source":    source,
                    "title":     entry.get("title", ""),
                    "url":       entry.get("link", ""),
                    "summary":   entry.get("summary", "")[:300] if entry.get("summary") else "",
                    "published": published,
                })
        except Exception:
            pass

    await asyncio.gather(*[fetch_feed(src, url) for src, url in RSS_FEEDS.items()])

    # Sort newest-first where possible, push entries without dates to bottom
    def sort_key(a):
        try:
            import email.utils
            return email.utils.parsedate_to_datetime(a["published"])
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    articles.sort(key=sort_key, reverse=True)

    return {
        "articles": articles[:limit],
        "total":    len(articles),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
