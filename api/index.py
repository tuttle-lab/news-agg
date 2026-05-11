from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from .db import DatabaseClient
from .deps import get_db

app = FastAPI(
    title="Kickstart API",
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


@app.get("/api/ping")
def ping():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "kickstart-api",
    }


class EchoBody(BaseModel):
    message: str
    timestamp: int | None = None


@app.post("/api/echo")
def echo(body: EchoBody):
    return {
        "echo": body.message,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "original_timestamp": body.timestamp,
    }


# Example of a route using the DB client via dependency injection.
# Copy this pattern for all data routes.
@app.get("/api/db-ping")
async def db_ping(db: DatabaseClient = Depends(get_db)):
    try:
        await db.rpc("pg_sleep", {"seconds": 0})
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
