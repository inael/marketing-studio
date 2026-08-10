# ACTIVE_PLAN — Marketing Studio GUI completa

**Objetivo:** transformar a fundação (motor de publicação IG + auth + deploy) num app
operável de ponta a ponta pra gerenciar o social dos 8 produtos IT Booster. Sem landing
pública por agora (decisão do Inael 2026-08-06).

## Direção de design
Console escuro multi-marca ("switchboard"). Chrome monocromático; a única cor viva vem da
marca de cada post (spine/dot com `brand.cor_principal`). Geist Sans + Geist Mono. Nada de
roxo/gradiente na chrome, nada de glassmorphism (regra "sem cara de IA").

## Marcas (8)
itbooster, freelancego, darkemail, jetsend, simpleszap, usetokia, recapitule, assinaagora.
Cada uma com cor própria (color-coding do switchboard), site, tom_voz, e credenciais IG
(itbooster já resolve via env `META_ITBOOSTER_*`; demais entram quando linkarem IG↔Página FB).

## Escopo (todas as funcionalidades)
1. **App shell** — sidebar (Posts, Criar, Calendário, Marcas) + auth guard + user/sair. [feito]
2. **Design tokens** — console escuro. [feito]
3. **Marcas** — grid das 8 + editar (cor, site, tom_voz, fonte, creds IG/LinkedIn, ativo).
   Server: listAllBrands/getBrandById/updateBrand/createBrand + seed dos 7 novos.
4. **Criar post** — marca, tipo (imagem/carrossel/reel), formato, upload de mídia → R2,
   legenda, hashtags, agendamento. Endpoint `/api/media` (upload). createPost estendido
   (scheduled_at + status draft/scheduled).
5. **Posts** — lista com spine da marca, thumb, filtro por marca/status, ações
   (aprovar / publicar / editar / excluir) + detalhe `/posts/[id]`.
6. **Calendário** — mês, posts por `scheduled_at`, dot por marca.
7. **Agendamento real** — `/api/cron/publish` publica aprovados+agendados vencidos;
   Vercel Cron.

## Ideias reusadas do autoposter.ai (2026-08-06)
- **Agendamento em lote** ("mês em 5 min") → aterrissa no Calendário (gerar/agendar vários).
- **Brand-voice na IA** → usar `tom_voz`/`fonte` da marca ao gerar/reescrever legenda.
- **Biblioteca de mídia** (pastas/tags/reuso) → em cima de `media_assets`.
- Fase 2: assistente de chat (criar/gerar/agendar conversando) + Análises (IG Insights).

## Fora de escopo agora
Landing pública; geração de imagem por IA no app (Higgsfield API server-side); vídeo/reel
publish (só container image/carousel hoje); LinkedIn publish (API em aprovação); analytics.

## Regras
Cada incremento buildável (`npm run build`) antes do push; git auto-deploya. Commits como inael.
