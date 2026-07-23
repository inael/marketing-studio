# Marketing Studio Cloud — PRD

> SaaS Multi-tenant pra centralizar produção + distribuição + análise de conteúdo de marketing digital.
> Cliente inicial: IT Booster (self-use). Futuro: vender pra clientes B2B/B2P.

## 1. Módulos (escopo definido por Inael 2026-05-20)

| # | Módulo | Descrição |
|---|---|---|
| M1 | **Distribuidor Multi-canal** | Posts automáticos em IG (multi-contas), LinkedIn (multi-contas), Blogs (multi-contas WordPress/Ghost), YouTube Shorts, TikTok |
| M2 | **Avatar Reels Generator** | Avatar do usuário reagindo a vídeos virais de empreendedorismo + IA — coletados automaticamente |
| M3 | **Planejador Meta + Google Ads** | Gera criativos (img + copy) para campanhas, agenda, monitora performance |
| M4 | **Email Marketing Builder** | Curadoria de leads + sequências automatizadas + analytics (via SimplesMail existente) |
| M5 | **Curadoria de Conteúdo** | Scraping de news, Twitter trends, virais YouTube/TikTok/IG + LLM extrai temas |
| M6 | **Studio de Criativos** | Geração de imagens + vídeos via stack já existente (Replicate, SiliconFlow, Higgsfield, ComfyUI local) |
| M7 | **Dashboard Multi-tenant** | UI web pra configurar API keys, OAuth redes sociais, ver calendário, aprovar posts |
| M8 | **Inteligência de Performance** | ROI por canal, atribuição, recomendação de boost |

## 2. Arquitetura proposta

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15 + shadcn/ui)                              │
│  marketing.itbooster.com.br (Coolify VPS)                       │
│  ├── /onboarding         (OAuth Meta, LinkedIn, Google, X, TT) │
│  ├── /calendar           (calendário visual de posts)          │
│  ├── /create             (gerador de criativos)                │
│  ├── /campaigns          (Meta + Google Ads)                   │
│  ├── /curation           (feed de conteúdo descoberto)         │
│  ├── /analytics          (ROI dashboard)                       │
│  └── /settings           (API keys + integrações)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (REST + SSE)
┌─────────────────────────────────────────────────────────────────┐
│  Backend API (Next.js API routes + FastAPI Python opcional)    │
│  ├── /api/posts          (CRUD posts agendados)                │
│  ├── /api/publish        (publica via Graph API/LinkedIn/etc)  │
│  ├── /api/generate       (chama Replicate/SiliconFlow/etc)     │
│  ├── /api/curate         (scrapes + LLM extract)               │
│  ├── /api/campaigns      (Meta/Google Ads)                     │
│  └── /api/integrations   (OAuth callbacks)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Workers (Inngest ou BullMQ Redis)                              │
│  ├── scheduler-worker    (executa posts no horário agendado)   │
│  ├── curation-worker     (scraping diário 6h)                  │
│  ├── generator-worker    (gera mídia em background)            │
│  └── analytics-worker    (pull metrics IG/LinkedIn/YT diário)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Data Layer                                                     │
│  ├── Supabase Postgres (self-hosted VPS) — relacional          │
│  ├── Supabase Storage — assets gerados (img, mp4, mp3)         │
│  ├── Supabase Auth — multi-tenant, RLS                         │
│  └── Redis (Coolify) — queue + cache                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  External APIs                                                  │
│  ├── Instagram Graph API + IG Login (oficial)                  │
│  ├── LinkedIn Marketing API + OAuth 2.0                        │
│  ├── YouTube Data API + Upload                                 │
│  ├── TikTok Content Posting API                                │
│  ├── X API v2                                                  │
│  ├── Meta Ads API + Google Ads API                             │
│  ├── Replicate + SiliconFlow + Higgsfield                      │
│  ├── ComfyUI local (Tailscale tunnel) — LoRA, geração grátis   │
│  └── MOSS-TTS / F5-TTS local                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Stack técnico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 15 + shadcn/ui + Tailwind | Padrão IT Booster |
| Backend | Next.js API routes | Mesmo deploy |
| DB | Supabase Postgres (VPS) | Já existe self-hosted |
| Auth | Supabase Auth | RLS multi-tenant nativo |
| Queue | Inngest (cloud, free tier generoso) | Cron + retries + DLQ sem manter Redis |
| Storage | Supabase Storage | Já tem |
| Deploy | Coolify VPS (`marketing.itbooster.com.br`) | Custo zero adicional |
| Observabilidade | Logs Coolify + Discord webhook | Já implementado |
| Geração IA | Stack existente (Replicate, SiliconFlow, Higgsfield, ComfyUI) | reuso total |

## 4. Tabelas Postgres (essenciais)

```sql
-- Multi-tenant
tenants (id, slug, plan, created_at)
users (id, tenant_id, email, role)

-- Integrações
integrations (id, tenant_id, provider, oauth_token, refresh_token, scopes, expires_at)
  -- provider: instagram, linkedin, youtube, tiktok, x, meta_ads, google_ads, wordpress, ghost

-- Conteúdo
posts (id, tenant_id, status, scheduled_at, published_at, type, networks[], media_ids[])
  -- status: draft|approved|scheduled|published|failed
media_assets (id, tenant_id, type, url, prompt, generator, cost_usd)

-- Campanhas
campaigns (id, tenant_id, platform, status, budget_daily, creatives[], target_audience)

-- Curadoria
curation_sources (id, tenant_id, type, url, keywords[])
curation_items (id, source_id, title, summary, url, virality_score, status)

-- Analytics
post_metrics (id, post_id, network, likes, comments, shares, reach, leads_attributed, fetched_at)
```

## 5. Roadmap em fases

| Fase | Duração | Entregáveis | Quem |
|---|---|---|---|
| **F0 — Scaffold** | 2 dias | Next.js + Supabase + Auth + Deploy Coolify + 1 página /settings | Claude Code |
| **F1 — Integrações OAuth** | 3 dias | Connect IG, LinkedIn, YouTube, TikTok, X, Meta Ads, Google Ads (tela /settings) | Claude Code |
| **F2 — Distribuidor Multi-canal (M1)** | 5 dias | Schedule + publish em IG, LinkedIn, Blog, YT, TT a partir do calendário | Claude Code |
| **F3 — Migração de scripts existentes** | 3 dias | Importar `integracoes/instagram/*` pra novo SaaS, reciclar `notify.py`, `posting_log.jsonl` | Claude Code |
| **F4 — Curadoria (M5)** | 3 dias | Scrapers + LLM extract + UI /curation | Claude Code |
| **F5 — Studio de Criativos (M6)** | 3 dias | UI /create com botões Replicate/SiliconFlow/Higgsfield + biblioteca de prompts | Claude Code |
| **F6 — Avatar Reels (M2)** | 4 dias | Avatar reagindo a vídeo viral curado | Claude Code |
| **F7 — Ads Planner (M3)** | 4 dias | Geração de criativos + push pra Meta/Google Ads | Claude Code |
| **F8 — Email Marketing (M4)** | 3 dias | Integração com SimplesMail existente | Claude Code |
| **F9 — Analytics (M8)** | 3 dias | Dashboard + ROI + atribuição | Claude Code |
| **Total** | **~33 dias úteis** (6-7 semanas) | SaaS funcional self-use IT Booster | |

## 6. Custos

| Item | Custo/mês |
|---|---|
| VPS Hostinger (já paga) | R$ 0 adicional |
| Coolify | grátis (open-source) |
| Inngest cloud (free tier 100k/mês) | R$ 0 até escalar |
| Supabase self-hosted (já existe) | R$ 0 adicional |
| Replicate (LTX-Video + FLUX) | R$ 60-100 (volume) |
| Higgsfield API | R$ 50 (avatares) |
| Edge TTS / F5-TTS local | R$ 0 |
| OAuth tokens Meta, LinkedIn, YT, TT | R$ 0 (API gratuita até cotas) |
| **Total mensal** | **R$ 110-150** |

Comparativo: Buffer + Later + Sprout Social + Vista Social = **R$ 1.500-3.000/mês** pra features similares.

## 7. Decisões críticas pendentes

| Decisão | Opção A | Opção B |
|---|---|---|
| **Repo** | `marketing-studio/` separado (atual) | Submodule dentro de `ItBooster/` |
| **Backend lang** | Next.js API routes (TypeScript) | FastAPI Python (reusa scripts existentes) |
| **Queue** | Inngest cloud (free) | BullMQ + Redis (mais controle) |
| **Multi-tenant desde início** | sim (vira produto venda) | não (só IT Booster, simplifica) |
| **Migrar 25 Task Scheduler agora** | sim (parar tudo, mover pra cloud) | rodar em paralelo até estabilizar |

## 8. Riscos

- **Meta API rate limits** + aprovação App Review (pode demorar 1-4 semanas)
- **LinkedIn Marketing API** exige aprovação Partner Program (pode levar meses)
  - Workaround: usar Postiz ou Phantombuster até aprovar
- **TikTok Content Posting API** ainda em closed beta
  - Workaround: Apify ou postar manual via Captions/Buffer
- **YouTube quota** — uploads limitados a 6/dia free (mais 50 = $250/dia)
- **OAuth complexo** — multi-conta exige refresh flow robusto
