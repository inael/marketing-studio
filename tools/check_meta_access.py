"""check_meta_access.py — testa QUAIS Paginas/Instagrams um token do vault alcanca.

Uso: python check_meta_access.py [NOME_DA_VAR_NO_SERVICES_ENV]
Default tenta META_LUANA_USER_TOKEN.
"""
import sys, json, urllib.request, urllib.parse, urllib.error
from pathlib import Path

GRAPH = "https://graph.facebook.com/v21.0"


def env(var):
    for line in (Path.home() / ".claude/credentials/services.env").read_text(encoding="utf-8").splitlines():
        if line.startswith(var + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def g(path, token, **params):
    params["access_token"] = token
    url = f"{GRAPH}/{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ITBooster/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"__error__": e.read().decode("utf-8", "replace")[:300]}


def save_itbooster(tok):
    acc = g("me/accounts", tok, fields="name,id,access_token,instagram_business_account{username,id}", limit=200)
    for p in acc.get("data", []):
        iba = p.get("instagram_business_account") or {}
        if iba.get("username") == "itboosterglobal":
            vault = Path.home() / ".claude/credentials/services.env"
            with vault.open("a", encoding="utf-8") as f:
                f.write("\n# === Instagram itbooster (Graph API oficial) 2026-07-31 ===\n")
                f.write(f"META_ITBOOSTER_IG_USER_ID={iba['id']}\n")
                f.write(f"META_ITBOOSTER_ACCESS_TOKEN={p['access_token']}\n")
            print(f"SALVO: META_ITBOOSTER_IG_USER_ID={iba['id']} + token da Pagina (nao exibido)")
            return
    print("nao achei @itboosterglobal nessa conta")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "save-itbooster":
        save_itbooster(env("META_LUANA_USER_TOKEN"))
        return
    var = sys.argv[1] if len(sys.argv) > 1 else "META_LUANA_USER_TOKEN"
    tok = env(var)
    if not tok:
        print(f"{var} nao encontrado no vault"); return
    me = g("me", tok, fields="id,name")
    print(f"Token {var}: quem sou -> {me}")
    perms = g("me/permissions", tok)
    granted = [p["permission"] for p in perms.get("data", []) if p.get("status") == "granted"]
    need = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement", "business_management"]
    print("Permissoes p/ publicar:", {k: ("OK" if k in granted else "FALTA") for k in need})
    acc = g("me/accounts", tok, fields="name,id,instagram_business_account{username,id}", limit=200)
    if "__error__" in acc:
        print("ERRO /me/accounts:", acc["__error__"]); return
    data = acc.get("data", [])
    print(f"Paginas alcancadas: {len(data)}")
    for p in data:
        iba = p.get("instagram_business_account")
        ig = f'@{iba["username"]} (id={iba["id"]})' if iba else "(sem IG)"
        print(f"  - {p['name']} (page={p['id']}) -> {ig}")


if __name__ == "__main__":
    main()
