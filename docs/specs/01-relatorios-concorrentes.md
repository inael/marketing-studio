# Spec 01 — Relatórios / Análise de Concorrentes

Inspirado no mLabs (aba Relatórios → Análise de concorrentes). É o bloco mais
viável: os dados dos concorrentes já são puxados por `competitorTopPosts`
(Graph API `business_discovery`) e as marcas já têm concorrentes cadastrados.

## Objetivo
Para uma marca, comparar **o perfil dela × os concorrentes** cadastrados,
com métricas de engajamento, melhores/piores posts, dias/horários de postagem,
hashtags e seguidores.

## Fonte de dados (Graph API — business_discovery)
Um único fields por conta consultada:
```
business_discovery.username(<user>){
  followers_count, media_count,
  media.limit(50){ caption, like_count, comments_count, permalink,
                   media_type, media_product_type, timestamp, thumbnail_url, media_url }
}
```
- Consulta feita a partir do IG da marca (mesmo token do resolveIg).
- "Seu perfil" = o próprio username da marca (ou o @itbooster fallback).
- Concorrentes = `content_sources` kind=competitor (máx 5, alinhado ao mLabs).
- Limitação: **views de Reels** não vêm confiáveis no business_discovery
  (só `media_product_type=REELS`; sem play_count garantido) → exibir "n/d".

## Cálculos (janela = últimos 30 dias, configurável)
Por conta:
- posts na janela, curtidas totais, comentários totais, média de interação/post,
  posts por semana, engajamento público (%) = (likes+coments)/followers.
- distribuição por **dia da semana** e **faixa de horário** (00-03…21-00).
- **melhores/piores** posts (por likes+coments) com capa (thumbnail), legenda,
  formato, data, permalink.
- **hashtags** extraídas das legendas (top N por contagem, por conta).
- **seguidores** (followers_count) — snapshot; crescimento fica pra quando
  tivermos histórico (tabela `competitor_snapshots` diária, fase 2).

## Servidor
- `src/server/reports.ts`:
  - `type AccountStats` (username, followers, posts, likes, comments, avgInter,
    postsPerWeek, engajamento, byWeekday[7], byHour[8], hashtags[], best[], worst[]).
  - `competitorReport(brandId, days=30): { self: AccountStats|null, competitors: AccountStats[], generatedAt }`.
  - Faz N chamadas business_discovery em paralelo (self + comps). Cacheia em
    `report_cache` (brand_id, payload jsonb, created_at) por ~6h pra não bater
    a API a cada abertura.
- Cache: tabela `report_cache(brand_id uuid pk, payload jsonb, created_at)`.
  Botão "Atualizar" força refetch.

## API
- Nada novo obrigatório (server component chama `competitorReport`). Opcional:
  `POST /api/reports/refresh {brand_id}` pra forçar atualização.

## UI — nova página `/relatorios`
- Seletor de marca (chips) + seletor de período (7/30/90 dias) + "Atualizar".
- **Tabela comparativa** (seu perfil destacado no topo): engajamento, posts,
  curtidas, comentários, média/post, posts/semana, seguidores.
- **Dias e horários**: dois mini bar-charts (dia da semana / faixa de horário)
  agregando os concorrentes + frase-insight ("Qua e Qui os concorrentes mais
  postam").
- **Ranking de posts**: melhores e piores (capa, legenda truncada, likes,
  coments, formato, data, link "ver").
- **Hashtags mais usadas**: tabela comparando contagem por conta.
- **Seguidores**: números atuais + ranking (crescimento só na fase 2).
- Nav: adicionar item "Relatórios" no `app-nav`.

## Aceite
- Abrir /relatorios, escolher marca com concorrentes → ver tabela + gráficos
  preenchidos em < ~10s (com cache instantâneo depois).
- Marca sem IG conectado ou sem concorrentes → estado vazio explicativo.
- Nenhuma chamada pesada de API a cada navegação (cache 6h + botão atualizar).

## Fora de escopo (fase 2)
- Histórico/crescimento de seguidores (precisa snapshot diário via cron).
- Views de Reels (limitação da API) — mostrar "n/d".
- Análise de mercado / insights IA → Spec 03.
