"""Microserviço self-host (twifork, fork mantido do twikit) — fonte Twitter/X pras sugestões.
Dois jeitos de conectar: colar COOKIES do login_local.py (POST /cookies) ou
login com senha direto pelo app (POST /login + /login/code quando o X pedir o
código do email/2FA). Protegido por Bearer SCRAPER_TOKEN."""
import asyncio
import builtins
import json
import os
import threading
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


# ---- Login com senha (fluxo do app: /login → precisa de código? → /login/code) ----
# O twikit pede o código do email/2FA via input(); rodamos o login numa THREAD
# com loop próprio e input() monkeypatchado que espera o código chegar no
# /login/code (threading.Event), sem travar o event loop do FastAPI.
login_state: dict = {"phase": "idle", "error": None}
_code_event = threading.Event()
_code_value: dict = {"code": None}
_login_lock = threading.Lock()


def _server_input(prompt: str = "") -> str:
    login_state["phase"] = "needs_code"
    _code_event.clear()
    if not _code_event.wait(timeout=300):
        raise TimeoutError("código não informado em 5 minutos")
    login_state["phase"] = "running"
    return _code_value["code"] or ""


def _login_thread(username: str, email: str, password: str) -> None:
    async def _run() -> None:
        c = Client("en-US")
        await c.login(auth_info_1=username, auth_info_2=email or None, password=password)
        os.makedirs(os.path.dirname(COOKIES), exist_ok=True)
        c.save_cookies(COOKIES)

    orig_input = builtins.input
    builtins.input = _server_input
    try:
        asyncio.run(_run())
        _load()
        login_state["phase"] = "done" if state["loaded"] else "error"
        if not state["loaded"]:
            login_state["error"] = "login terminou mas cookies não carregaram"
    except Exception as e:  # noqa: BLE001
        login_state["phase"] = "error"
        login_state["error"] = str(e)
    finally:
        builtins.input = orig_input


async def _wait_outcome(seconds: float) -> dict:
    """Espera o login sair de 'running'; devolve a resposta no contrato do app."""
    waited = 0.0
    while waited < seconds:
        phase = login_state["phase"]
        if phase == "needs_code":
            return {"status": "needs_code", "needs_code": True}
        if phase == "done":
            return {"status": "ok", "connected": True}
        if phase == "error":
            raise HTTPException(status_code=400, detail=login_state["error"] or "falha no login")
        await asyncio.sleep(0.5)
        waited += 0.5
    return {"status": "running", "detail": "login ainda processando; confira o Status em instantes"}


@app.post("/login")
async def login(authorization: str | None = Header(default=None), body: dict = Body(...)):
    _auth(authorization)
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    email = (body.get("email") or "").strip()
    if not username or not password:
        raise HTTPException(status_code=400, detail="username e password obrigatórios")
    with _login_lock:
        if login_state["phase"] in ("running", "needs_code"):
            raise HTTPException(status_code=409, detail="login já em andamento")
        login_state.update(phase="running", error=None)
    threading.Thread(target=_login_thread, args=(username, email, password), daemon=True).start()
    return await _wait_outcome(40)


@app.post("/login/code")
async def login_code(authorization: str | None = Header(default=None), body: dict = Body(...)):
    _auth(authorization)
    code = (body.get("code") or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="code obrigatório")
    if login_state["phase"] != "needs_code":
        raise HTTPException(status_code=409, detail="nenhum login esperando código")
    _code_value["code"] = code
    login_state["phase"] = "running"
    _code_event.set()
    return await _wait_outcome(40)


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


@app.get("/gtrends")
def gtrends(geo: str = "BR", limit: int = 10, authorization: str | None = Header(default=None)):
    """Google Trends (trendspy) — não precisa de cookies; segunda fonte de tendências."""
    _auth(authorization)
    try:
        from trendspy import Trends

        items = Trends().trending_now(geo=geo)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"google trends indisponível: {e}") from e
    out = []
    for t in items[: min(max(limit, 1), 25)]:
        name = getattr(t, "keyword", None) or str(t)
        out.append({"name": name, "count": getattr(t, "volume", None)})
    return out
