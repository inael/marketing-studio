# twitter-scraper (fonte Twitter/X das sugestões)

Microserviço self-host (FastAPI + twikit) que puxa **busca de tweets e trends**
do nicho, sem a API paga do X. **Não guarda senha**: usa cookies gerados 1x pelo
`login_local.py`.

⚠️ Scraping viola o ToS do X — **use uma conta dedicada/queimada**, nunca a
principal.

## Passo 1 — gerar os cookies (na sua máquina, 1x)
```bash
pip install twikit
python login_local.py
```
Digite usuário, email e senha. Se o X pedir o **código do email**, o twikit pede
no terminal — cole o código. Ao final, copie TODO o conteúdo do `cookies.json`.

## Passo 2 — subir na VPS
```bash
# na VPS, dentro de /docker/twitter-scraper (ou onde preferir)
export SCRAPER_TOKEN="<gerar um token forte>"
docker compose up -d --build
```
Ajuste as labels do Traefik em `docker-compose.yml` pra bater com o proxy da VPS
(rede + cert resolver reais). Endpoint final ex.:
`https://twitter-scraper.itbooster.com.br`.
Cadastre essa URL no **status dashboard** (status.toolpad.cloud).

## Passo 3 — plugar no app
No Vercel do `marketing-studio`, setar:
- `TWITTER_SCRAPER_URL=https://twitter-scraper.itbooster.com.br`
- `TWITTER_SCRAPER_TOKEN=<mesmo SCRAPER_TOKEN>`

## Passo 4 — conectar (colar cookies)
No app: **Config → Twitter/X → colar cookies** (o app manda pro `/cookies` do
serviço). `GET /status` deve responder `{"connected": true}`. A aba **Twitter/X**
em Sugestões passa a gerar.

## Endpoints
- `GET /health`
- `GET /status` (Bearer token)
- `POST /cookies` `{cookies: <json>}` (Bearer)
- `GET /search?q=...&limit=20` (Bearer) → tweets recentes
- `GET /trends` (Bearer) → trending topics

## Notas
- twikit muda de tempos em tempos; se `search_tweet`/`get_trends` quebrarem,
  atualizar a lib e ajustar os nomes dos métodos.
- Mantenha leve na VPS (cpus 0.5 / 512m já no compose).
