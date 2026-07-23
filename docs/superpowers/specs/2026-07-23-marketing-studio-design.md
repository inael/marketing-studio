# Marketing Studio — Design (spec)

- **Data:** 2026-07-23
- **Status:** aprovado no brainstorm, aguardando review do Inael antes do plano de implementação
- **Autor:** Claude Code (sessão com Inael)

## 1. Objetivo

Um produto único que **cria, aprova, agenda e publica** conteúdo social (Instagram + LinkedIn) para os produtos da IT Booster, com **interface gráfica** (calendário editorial), **publicação via API oficial** e **geração de mídia** via Higgsfield + templates editoriais por marca.

Substitui as automações espalhadas no Task Scheduler do PC pessoal (que rodavam escondidas, quebravam em silêncio e não escalavam) por um orquestrador central, rodando na infra da IT Booster.

## 2. Produtos no escopo (8)

FreelanceGo, Darkemail, JetSend, SimplesZap, UseTokia (Tokia), IT Booster, Recapitule, AssinaAgora.

**Rollout:** piloto **IT Booster** primeiro (fecha o loop ponta a ponta), depois clonar para os outros 7. Cada produto é uma linha em `brands`.

## 3. Direção visual (sair da "cara de IA")

Decisão do Inael: os carrosséis atuais ficaram com "cara de IA" (gradiente roxo genérico + rosto sintético sem propósito). A correção **não** é um look novo forçado nos 8, e sim:

- **Editorial por marca:** cada produto usa seu **brand kit real** (cor, fonte, tom), com tipografia forte, dado real e **print de UI real**. O template lê o kit e se adapta.
- **Elenco compartilhado IT Booster:** os personagens Higgsfield (**Inael, Karla, Tata, Tarsila**) aparecem em **todos** os produtos como fio condutor da holding. Recorrente + nomeado + consistente = recurso de marca (tipo porta-voz), não stock aleatório.
- **Régua anti-cara-de-IA:** consistência + qualidade + uso intencional. Nada de rosto sintético aleatório enchendo o feed; nada de gradiente genérico.
- **Brand kit é curado, não só herdado:** onde a identidade do produto é forte (Tokia, Recapitule, JetSend), respeitar; onde é fraca (**FreelanceGo**), **elevar** (manter o núcleo da cor, definir fonte/hierarquia/sistema de card decentes). O site é **semente**, não sentença.

### 3.1 Brand kits (extraídos dos sites em 2026-07-23)

| Produto | Cor principal | Apoio | Fonte | Vibe | Nota |
|---|---|---|---|---|---|
| IT Booster | roxo `#9333ea` + navy `#020015` | azul `#60a5fa` | Inter | tech/IA, escuro | piloto |
| JetSend | índigo `#4f46e5` | laranja `#f97316`, verde `#10b981` | Inter | dev, técnico | forte |
| SimplesZap | grafite `#111827` | azul `#3b82f6` | Geist | dev, minimal | forte |
| Tokia | verde `#10b981` | zinc `#18181b` | Geist + JetBrains Mono | IA premium BR | forte |
| Recapitule | azul `#2e86f0` | off-white `#faf9f5`, quase-preto `#141413` | Montserrat | clean, privacidade | forte |
| AssinaAgora | verde `#5cb85c` + azul `#4a90e2` | navy `#030213` | sans | jurídico, confiança | ok |
| Darkemail | grafite `#111827` | magenta `#c026d3` | Inter | utilitário, dark | ok |
| FreelanceGo | verde-esmeralda `#059669` | (só isso) | sans padrão | marketplace BR | **fraca: elevar** |

Cada kit vira uma linha editável em `brands` (Supabase). Personagens são camada compartilhada (assets Higgsfield + prompts de consistência).

## 4. Formatos de post (5)

1. **Carrossel editorial** (sem personagem): tese/dado/UI, no brand kit do produto.
2. **Imagem com personagem** (elenco Higgsfield em cena + selo do produto).
3. **Imagem sem personagem** (print de UI / editorial).
4. **Reel/short com personagem** (fala/apresentação).
5. **Reel do sistema** (screen-rec da UI, com ou sem personagem/voz).

## 5. Arquitetura

Adotada do PRD existente (`marketing-studio/docs/PRD-MARKETING-STUDIO-CLOUD.md`), enxugada para a Fase A.

```
GUI (Next.js 15 + shadcn/ui + Tailwind)   marketing.itbooster.com.br (Coolify)
  /calendar  /create  /approve  /library  /brands  /settings
        |  REST
Backend (Next.js API routes)
  /api/posts  /api/publish  /api/generate  /api/brands  /api/media
        |
Worker Python (reusa ig_graph.py + render node)  <-- publica e renderiza
        |
Inngest (cron + retry + DLQ)  -> dispara publish no horário
        |
Supabase self-hosted (Postgres + Storage + Auth) + R2 (mídia pública p/ Graph API)
        |
Externos: Instagram Graph API (oficial) · LinkedIn API · Higgsfield (MCP) · LiteLLM/Tokia (legendas)
```

| Camada | Tecnologia | Nota |
|---|---|---|
| Front + GUI | Next.js 15 + shadcn/ui + Tailwind + lucide + sonner | padrão IT Booster |
| Backend | Next.js API routes | mesmo deploy |
| Worker publicação/render | Python (`ig_graph.py`) + Node (`build_carousel.mjs`) | reuso do que já existe |
| DB | Supabase Postgres (VPS) | já existe self-hosted |
| Storage | Supabase Storage + R2 (URL pública p/ Graph API) | Graph API exige URL pública |
| Fila/cron | Inngest | cron + retry + DLQ sem manter Redis |
| Geração imagem/vídeo | Higgsfield (MCP) | só fundo/cena/elemento e personagens; **nunca** rosto sintético aleatório |
| Legendas | LiteLLM / Tokia | sempre com revisão humana antes de agendar |
| Deploy | Coolify VPS `marketing.itbooster.com.br` | custo zero adicional |
| Observabilidade | Logs Coolify + alerta Discord/WhatsApp | reuso |

## 6. Modelo de dados (Supabase)

- **`brands`** (produto): `slug, nome, cor_principal, cor_apoio[], fonte, logo_url, tom_voz, ig_user_id, ig_token, linkedin_org_id, linkedin_token, site_url, ativo`.
- **`characters`** (elenco compartilhado): `nome, higgsfield_refs (jsonb), prompt_base, voz, ativo`.
- **`posts`**: `brand_id, tipo (carousel|image|reel), formato (com_personagem|sem_personagem|demo_ui), character_id?, legenda, hashtags[], media_ids[], scheduled_at, status (draft|approved|scheduled|published|failed), aprovado_por, aprovado_em, external_url`.
- **`media_assets`**: `brand_id, tipo (img|video), url (R2/Storage), origem (higgsfield|upload|render_carousel|screenshot), meta jsonb`.
- **`publish_logs`**: `post_id, rede (ig|linkedin), status, external_id, erro, ts`.

RLS por `brand` quando virar multi-usuário.

## 7. Geração, publicação, agendamento, GUI

- **Gerar:** Higgsfield (MCP) para imagem com personagem e reels; `build_carousel.mjs` (reestilizado por brand kit) para cards editoriais; upload de print de UI; legenda por LLM (Tokia/LiteLLM) **com revisão humana** obrigatória antes de `approved`.
- **Publicar:** `ig_graph.py` (IG oficial, multi-conta) + módulo LinkedIn novo (`/rest/posts` + upload de Documento para carrossel PDF). Uma conta por produto.
- **Agendar:** Inngest cron dispara no `scheduled_at`; retry exponencial; DLQ; alerta de falha no Discord/WhatsApp.
- **GUI:** `/calendar` (mês/semana), fila por status, `/create` (escolhe brand + formato + gera/anexa mídia + legenda), `/approve` (revisão humana), `/library` (mídia), `/brands` (edita brand kit), botão publicar/retentar por post.

## 8. Fases e critério de "pronto"

- **Fase 0 (setup):** repo `marketing-studio` + `.itbooster-meta.yaml` (catálogo) + schema Supabase + Coolify + domínio `marketing.itbooster.com.br`. Cadastrar URL no status dashboard.
- **Fase A (piloto IT Booster):** 1 brand, IG+LinkedIn, calendário, os 5 formatos, fluxo `draft→approved→scheduled→published/failed`, biblioteca. **Pronto quando:** 8 posts agendados e publicados em 4 semanas, com taxa de falha documentada e corrigida.
- **Fase B (clonar):** os outros 7 produtos (cada um = linha em `brands` + token + @ + brand kit; FreelanceGo entra com kit elevado). Contas dark.email e assinaagora já existem.
- **Fase C (refino):** analytics de publicação, curadoria de ideias, hooks recorrentes, e (se virar produto de venda) multi-tenant + billing.

## 9. Reuso de código existente

- `integracoes/instagram/lib/ig_graph.py` (monorepo ItBooster) — motor de publicação IG oficial multi-conta. **Portar** para o worker.
- `integracoes/instagram/build_carousel.mjs` — render de cards. **Parametrizar** por brand kit.
- `integracoes/instagram/lib/slot_state.py`, `notify.py` — referência de idempotência e notificação.
- `marketing-studio/projetos_para_estudo/poc_agente_social/` (`creator_agent`, `inspiration_engine`, `publisher`) — referência de fluxo de criação.
- Personagens Higgsfield já criados (Inael/Karla/Tata/Tarsila) e contas IG já criadas (dark.email, assinaagora, etc.).

## 10. Decisões abertas / dependências

- **Auth:** Logto (padrão IT Booster, SSO do time) vs Supabase Auth (RLS nativo, escolha do PRD). Ferramenta interna, decidir no início da implementação. *(Meta aponta Logto por ora.)*
- **Token por produto:** cada conta precisa do mesmo setup do IT Booster (conta Comercial + Página FB + token longo). Operacional, feito no rollout.
- **LinkedIn:** app + produto *Community Management API* (aprovação da LinkedIn, ~dias). Bloqueia o publish automático no LinkedIn; até lá, lembrete manual pela GUI.
- **Nome/marca final:** hoje `marketing-studio` (nome de trabalho no PRD era *BoostDeck*). Decidir marca/domínio antes de expor publicamente.
- **Qualidade do elenco Higgsfield:** definir uma barra visual pra não recair no "cara de IA".

## 11. Fora de escopo (agora)

Ads pagos (Meta/Google), X/TikTok/YouTube, billing/multi-tenant para venda externa, integração com CRM (Fase B+), agente 100% autônomo (sempre revisão humana antes de publicar nesta fase).
