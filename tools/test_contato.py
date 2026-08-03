"""test_contato.py — envia um e-mail de teste pra contato@<produto> e confere no Mailpit.

Envia via SMTP pro Mailpit (inbound.itbooster.com.br:25) e depois consulta a API do
Mailpit pra confirmar o recebimento. O encaminhamento pro Gmail e' conferido na caixa
itbooster.global@gmail.com (o webhook faz o forward).
"""
import smtplib, time, json, base64, sys, urllib.request, urllib.error, urllib.parse
from email.message import EmailMessage
from pathlib import Path

MAILPIT_URL = "https://mail.darkemail.school"
TO = sys.argv[1] if len(sys.argv) > 1 else "contato@freelancego.com.br"
FROM = "teste-itbooster@gmail.com"
TOKEN = "itbtest7788"
HOSTS = ["inbound.itbooster.com.br", "72.61.135.214"]


def env(k):
    for line in (Path.home() / ".claude/credentials/services.env").read_text(encoding="utf-8").splitlines():
        if line.startswith(k + "="):
            return line.split("=", 1)[1].strip()
    return None


def build():
    m = EmailMessage()
    m["From"] = f"Teste IT Booster <{FROM}>"
    m["To"] = TO
    m["Subject"] = f"Teste forwarding contato {TOKEN}"
    m.set_content(f"Teste automatico do encaminhamento de {TO}. token={TOKEN}")
    return m


def send():
    msg = build()
    for h in HOSTS:
        try:
            s = smtplib.SMTP(h, 25, timeout=25)
            s.sendmail(FROM, [TO], msg.as_string())
            s.quit()
            print(f"SMTP OK via {h} -> {TO}")
            return True
        except Exception as e:
            print(f"SMTP falhou via {h}: {e}")
    return False


def check():
    auth = env("MAILPIT_API_AUTH")
    url = MAILPIT_URL + "/api/v1/search?query=" + urllib.parse.quote(TOKEN)
    req = urllib.request.Request(url)
    req.add_header("Authorization", "Basic " + base64.b64encode(auth.encode()).decode())
    req.add_header("User-Agent", "Mozilla/5.0 ITBooster/1.0")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
        msgs = data.get("messages", [])
        print(f"Mailpit: {len(msgs)} msg(s) com token '{TOKEN}'")
        for m in msgs[:3]:
            to = ", ".join(x.get("Address", "") for x in m.get("To", []))
            print(f"  - To={to} | Subject={m.get('Subject')} | Created={m.get('Created')}")
        return len(msgs) > 0
    except urllib.error.HTTPError as e:
        print("Mailpit API erro:", e.code, e.read().decode()[:200])
        return False


if __name__ == "__main__":
    if send():
        time.sleep(5)
        check()
