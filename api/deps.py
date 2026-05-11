import os
from functools import lru_cache
from .db import DatabaseClient, SupabaseClient


@lru_cache(maxsize=1)
def get_db() -> DatabaseClient:
    # To swap databases: return a different DatabaseClient subclass here.
    return SupabaseClient(
        url=os.environ["SUPABASE_URL"],
        key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
