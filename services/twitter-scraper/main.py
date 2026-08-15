"""Microserviço self-host (twikit) — fonte Twitter/X pras sugestões.
Não faz login com senha: usa COOKIES gerados 1x pelo login_local.py.
Protegido por Bearer SCRAPER_TOKEN."""
import json
import os
from fastapi import Body, FastAPI, Header, HTTPException
from twikit import Client

TOKEN = os.environ.get("SCRAPER_TOKEN", "")
COOKIES = os.environ.get("COOKIES_PATH", "/data/cookies.json")

app = FastAPI(title="twitter-scraper")
client = Client("en-US")
state = {"loaded": False}


def _auth(authorization: str | None) -> None:
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


def _load() -> None:
    try:
        if os.path.exists(COOKIES):
            client.load_cookies(COOKIES)
            state["loaded"] = True
    except Exception:
        state["loaded"] = False


_load()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/status")
def status(authorization: str | None = Header(default=None)):
    _auth(authorization)
    return {"connected": state["loaded"]}


@app.post("/cookies")
def set_cookies(authorization: str | None = Header(default=None), body: dict = Body(...)):
    """Recebe os cookies (json ou string) gerados pelo login_local.py."""
    _auth(authorization)
    cookies = body.get("cookies")
    if isinstance(cookies, str):
        cookies = json.loads(cookies)
    if not isinstance(cookies, dict):
        raise HTTPException(status_code=400, detail="cookies invalidos")
    os.makedirs(os.path.dirname(COOKIES), exist_ok=True)
    with open(COOKIES, "w", encoding="utf-8") as f:
        json.dump(cookies, f)
    _load()
    return {"status": "ok" if state["loaded"] else "error", "connected": state["loaded"]}


@app.get("/search")
async def search(q: str, limit: int = 20, authorization: str | None = Header(default=None)):
    _auth(authorization)
    if not state["loaded"]:
        raise HTTPException(status_code=400, detail="sem cookies — conecte primeiro")
    tweets = await client.search_tweet(q, "Latest", count=min(max(limit, 1), 40))
    return [
        {
            "text": t.text,
            "likes": getattr(t, "favorite_count", 0),
            "retweets": getattr(t, "retweet_count", 0),
            "user": t.user.screen_name,
            "url": f"https://x.com/{t.user.screen_name}/status/{t.id}",
            "date": str(getattr(t, "created_at", "")),
        }
        for t in tweets
    ]


@app.get("/trends")
async def trends(authorization: str | None = Header(default=None)):
    _auth(authorization)
    if not state["loaded"]:
        raise HTTPException(status_code=400, detail="sem cookies")
    tr = await client.get_trends("trending")
    return [{"name": t.name, "count": getattr(t, "tweets_count", None)} for t in tr]
