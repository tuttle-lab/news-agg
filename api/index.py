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
    "Bloomberg":    "https://feeds.bloomberg.com/markets/news.rss",
    "FT":           "https://www.ft.com/rss/home",
    "Hacker News":  "https://news.ycombinator.com/rss",
}

STOCK_SYMBOLS = ["SPY", "VOO", "JPM", "NVDA"]

KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2"
KALSHI_SKIP = {"Sports"}


@app.get("/api/ping")
def ping():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "news-agg-api",
    }


async def _fetch_stock(client: httpx.AsyncClient, symbol: str) -> tuple[str, dict]:
    try:
        res = await client.get(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
            params={"interval": "1d", "range": "1d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        data = res.json()
        meta = data["chart"]["result"][0]["meta"]
        price = meta.get("regularMarketPrice") or meta.get("previousClose")
        prev  = meta.get("chartPreviousClose") or meta.get("previousClose")
        change_pct = round((price - prev) / prev * 100, 2) if prev else 0
        return symbol, {"price": round(price, 2), "change_pct": change_pct}
    except Exception:
        return symbol, {"price": None, "change_pct": None, "error": "unavailable"}


async def _fetch_btc(client: httpx.AsyncClient) -> dict:
    try:
        res = await client.get(
            "https://api.crypto.com/exchange/v1/public/get-ticker",
            params={"instrument_name": "BTC_USDT"},
        )
        raw = res.json()["result"]["data"]
        ticker = raw[0] if isinstance(raw, list) else raw
        # 'a' = best ask, 'c' = 24h absolute change
        price = float(ticker.get("a") or ticker.get("k") or 0)
        change_abs = float(ticker.get("c") or 0)
        prev = price - change_abs
        change_pct = round(change_abs / prev * 100, 2) if prev else 0
        return {"price": round(price, 0), "change_pct": change_pct}
    except Exception:
        return {"price": None, "change_pct": None, "error": "unavailable"}


@app.get("/api/tickers")
async def tickers():
    results = {}
    async with httpx.AsyncClient(timeout=8) as client:
        stock_tasks = [_fetch_stock(client, sym) for sym in STOCK_SYMBOLS]
        btc_task    = _fetch_btc(client)
        *stock_results, btc = await asyncio.gather(*stock_tasks, btc_task)

    for symbol, data in stock_results:
        results[symbol] = data
    results["BTC"] = btc

    return {"tickers": results, "timestamp": datetime.now(timezone.utc).isoformat()}


async def _kalshi_events(client: httpx.AsyncClient) -> list[str]:
    """Fetch open non-sports series tickers."""
    tickers = []
    try:
        r = await client.get(
            f"{KALSHI_BASE}/events",
            params={"limit": 100, "status": "open"},
            headers={"Accept": "application/json"},
        )
        if r.status_code != 200:
            return []
        for event in r.json().get("events", []):
            if event.get("category") in KALSHI_SKIP:
                continue
            st = event.get("series_ticker")
            if st:
                tickers.append(st)
    except Exception:
        pass
    return tickers


@app.get("/api/kalshi")
async def kalshi():
    markets = []
    async with httpx.AsyncClient(timeout=12) as client:
        series = await _kalshi_events(client)

        for series_ticker in series[:8]:
            if len(markets) >= 15:
                break
            try:
                r = await client.get(
                    f"{KALSHI_BASE}/markets",
                    params={"limit": 5, "status": "open", "series_ticker": series_ticker},
                    headers={"Accept": "application/json"},
                )
                if r.status_code != 200:
                    continue
                for m in r.json().get("markets", []):
                    yes = m.get("yes_ask_dollars") or m.get("last_price_dollars")
                    if yes is None:
                        continue
                    markets.append({
                        "ticker":    m.get("ticker", ""),
                        "title":     m.get("title", ""),
                        "yes_price": round(float(yes), 2),
                        "url":       f"https://kalshi.com/markets/{m.get('ticker', '')}",
                    })
            except Exception:
                continue

    return {"markets": markets, "timestamp": datetime.now(timezone.utc).isoformat()}


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

                # For HN, primary link goes to the HN discussion, not the article
                if source == "Hacker News":
                    hn_url     = entry.get("comments") or entry.get("link", "")
                    article_url = entry.get("link", "")
                    primary_url = hn_url if hn_url else article_url
                else:
                    primary_url = entry.get("link", "")
                    article_url = primary_url

                summary = entry.get("summary", "") or ""
                # Strip HTML tags from summary
                import re
                summary = re.sub(r"<[^>]+>", "", summary)[:300]

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
        "articles": articles[:limit],
        "total":    len(articles),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
