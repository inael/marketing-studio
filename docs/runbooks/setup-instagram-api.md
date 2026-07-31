# Runbook — Conectar Instagram à API oficial (Meta) para controle via Marketing Studio

Objetivo: controlar os Instagrams dos produtos IT Booster via Graph API (publicar carrossel/imagem/reel).
Modelo escalável: **1 Business Manager IT Booster + 1 System User + 1 token que não expira** controla os N.

## Pré-requisitos por conta (fazer p/ cada IG)
1. IG é conta **Comercial** ou **Criador** (app IG > Config > Tipo de conta).
2. IG **vinculado a uma Página do Facebook** (app IG > Config > Central de Contas / Página).
3. Página + IG dentro da **Business Manager da IT Booster** (business.facebook.com > Configurações > Contas).

## Setup uma vez (cobre todos)
1. **Business Manager IT Booster** existe e com **empresa verificada** (Business Verification, CNPJ).
2. **App Meta** (o `META_APP_ID_LIVE` do vault) adicionado à Business + produto **Instagram Graph API**.
3. **System User** (business.facebook.com > Usuários > Usuários do sistema > Adicionar; papel Admin).
   - Atribuir ativos: a **Página** (controle total) e a **conta do Instagram**.
   - **Gerar token** > escolher o app > permissões:
     `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   - Token de System User **não expira** (melhor que page token de 60d).
4. **App Review** do `instagram_content_publish` (Advanced Access). Antes de aprovar, publica nas contas
   que têm papel no app (as próprias). Rodar em paralelo.

## Parte da IT Booster (Claude, via API) — quando receber o token
1. `GET /me/accounts?access_token=TOKEN` -> acha a Página e o `id`.
2. `GET /{page-id}?fields=instagram_business_account&access_token=TOKEN` -> `ig_user_id`.
3. Salvar no vault (`~/.claude/credentials/services.env`):
   - `META_ITBOOSTER_IG_USER_ID=...`
   - `META_ITBOOSTER_ACCESS_TOKEN=...` (system user token)
4. Teste de publicação via `ig_graph.publish_images("itbooster", [...], caption)` ou pelo botão do painel.
5. Repetir 1-3 por produto -> vira linha em `brands` (slug, ig_user_id, token, @).

## Mapa das contas (preencher no rollout)
| Produto | @ IG | Comercial? | Página FB | ig_user_id |
|---|---|---|---|---|
| IT Booster | @itboosterglobal | ? | ? | ? |
| (demais 7) | | | | |
