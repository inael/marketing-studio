"""hostinger_dns.py — le/atualiza DNS via API Hostinger (forwarding de e-mail via ImprovMX).

Uso:
  python hostinger_dns.py audit                      # confere os 5 dominios do Grupo A (so leitura)
  python hostinger_dns.py get <dominio>              # dump da zona
  python hostinger_dns.py set-improvmx <dominio> --apply   # grava MX improvmx + SPF (se seguro)
"""
import sys, json, urllib.request, urllib.error
from pathlib import Path

BASE = "https://developers.hostinger.com/api"
DOMAINS = ["freelancego.com.br", "jetsend.com.br", "usetokia.com", "simpleszap.com", "recapitule.com.br"]
MX_RECORDS = [{"content": "10 mx1.improvmx.com."}, {"content": "20 mx2.improvmx.com."}]
SPF = "v=spf1 include:spf.improvmx.com ~all"


def token():
    for line in (Path.home() / ".claude/credentials/services.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("HOSTINGER_API_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("HOSTINGER_API_TOKEN nao encontrado")


def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, method=method, data=data, headers={
        "Authorization": "Bearer " + token(),
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ITBooster-DNS/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def zone(domain):
    st, body = api("GET", f"/dns/v1/zones/{domain}")
    if st != 200:
        return None, st, body
    return json.loads(body), st, body


def root_info(z):
    mx = [r["content"] for e in z if e["name"] == "@" and e["type"] == "MX" for r in e["records"]]
    spf = [r["content"] for e in z if e["name"] == "@" and e["type"] == "TXT" for r in e["records"] if "spf1" in r["content"]]
    return mx, spf


def audit():
    for d in DOMAINS:
        z, st, body = zone(d)
        if z is None:
            print(f"{d}: ERRO {st} {body[:100]}")
            continue
        mx, spf = root_info(z)
        print(f"{d}: root_MX={mx or 'NENHUM'} | root_SPF={'SIM ' + str(spf) if spf else 'nao'}")


def set_improvmx(domain, apply):
    z, st, body = zone(domain)
    if z is None:
        print(f"{domain}: ERRO ao ler zona {st}")
        return
    mx, spf = root_info(z)
    if mx:
        print(f"{domain}: JA TEM root MX ({mx}) -> abortando pra nao quebrar")
        return
    payload = {"overwrite": False, "zone": [{"name": "@", "type": "MX", "ttl": 3600, "records": MX_RECORDS}]}
    if not spf:
        payload["zone"].append({"name": "@", "type": "TXT", "ttl": 3600, "records": [{"content": SPF}]})
    else:
        print(f"{domain}: ja existe root SPF ({spf}); NAO vou mexer no SPF (evitar 2 SPF)")
    if not apply:
        print(f"{domain}: [DRY] enviaria -> {json.dumps(payload['zone'])}")
        return
    st, resp = api("PUT", f"/dns/v1/zones/{domain}", payload)
    print(f"{domain}: PUT status {st} {resp[:150]}")
    z2, _, _ = zone(domain)
    if z2:
        print(f"{domain}: agora root_MX={root_info(z2)[0]}")


def main():
    cmd = sys.argv[1]
    apply = "--apply" in sys.argv
    if cmd == "audit":
        audit()
    elif cmd == "get":
        st, body = api("GET", f"/dns/v1/zones/{sys.argv[2]}")
        print("STATUS", st); print(body[:4000])
    elif cmd == "mx":
        z, st, body = zone(sys.argv[2])
        if z is None:
            print("ERRO", st); return
        for e in z:
            if e["type"] == "MX" or (e["type"] in ("A", "CNAME") and e["name"] in ("@", "mail", "inbound", "mx", "mx1", "mx2")):
                print(f'{e["type"]:6} {e["name"]:10} -> {[r["content"] for r in e["records"]]}')
    elif cmd == "set-improvmx":
        set_improvmx(sys.argv[2], apply)
    else:
        print("comando invalido")


if __name__ == "__main__":
    main()
