# Tasks do projeto — Marketing OS

Lista viva de **épicos e tarefas** para execução. Convém espelhar em **GitHub Issues** (e, se adotar Linear, sincronizar). IDs são estáveis para referência em commits (`refs TASK-A12`).

**Legenda:** `[ ]` pendente · `[~]` em progresso · `[x]` feito (atualizar ao concluir).

---

## EPIC A — Fundação do repositório e padrões

| ID | Task | Notas |
|----|------|--------|
| A1 | `[ ]` Inicializar monorepo (`pnpm` workspaces): `apps/web`, `apps/api`, `packages/shared` | Alinhar a **agentcrm** / **simpleszap** |
| A2 | `[ ]` TypeScript strict, ESLint, Prettier (regras comuns em `packages/config` se fizer sentido) | |
| A3 | `[ ]` README raiz: o que é o produto, como rodar `web` + `api`, link para `docs/` | |
| A4 | `[ ]` CI mínima (lint + typecheck no push) | GitHub Actions |
| A5 | `[ ]` `.env.example` sem segredos; documentar variáveis | |

---

## EPIC B — Identidade, tenant e modelo de dados

| ID | Task | Notas |
|----|------|--------|
| B1 | `[ ]` Definir modelo: `Organization` (workspace), `User`/`Membership`, `SocialAccount` | Supabase + RLS ou equivalente |
| B2 | `[ ]` Integrar **Logto** (mesmo padrão agentcrm): login no `web`, validação JWT na `api` | |
| B3 | `[ ]` Migrações iniciais + seeds de dev (1 org IT Booster) | |
| B4 | `[ ]` Política de segredos: tokens Meta/LinkedIn só no backend | |

---

## EPIC C — Conteúdo e calendário (MVP Fase A)

| ID | Task | Notas |
|----|------|--------|
| C1 | `[ ]` CRUD de **posts**: título/notas, canal, data/hora, status (`draft` → `approved` → `scheduled` → `published` / `failed`) | |
| C2 | `[ ]` UI calendário (lista + visão semanal simples) | Priorizar uso, não beleza excessiva |
| C3 | `[ ]` **Biblioteca de mídias**: upload, listagem, associação a post | Storage: Supabase Storage ou S3 compatível |
| C4 | `[ ]` Auditoria: quem aprovou e quando | |

---

## EPIC D — Integração social (2 redes no MVP)

| ID | Task | Notas |
|----|------|--------|
| D1 | `[ ]` ADR: escolher **par redes v1** (ex. Meta IG+FB *ou* LinkedIn) conforme app review | Documentar em `docs/adr/` |
| D2 | `[ ]` Fluxo OAuth / tokens long-lived; armazenamento cifrado ou vault | |
| D3 | `[ ]` Worker na **VPS**: fila (BullMQ/pgqueuer ou similar), retry exponencial | |
| D4 | `[ ]` Job `publishPost`: chamar API da rede; gravar `external_post_id` e erros | |
| D5 | `[ ]` Logs estruturados + alerta básico (email/Discord) se fila morrer | |

---

## EPIC E — IA (legendas e variações)

| ID | Task | Notas |
|----|------|--------|
| E1 | `[ ]` Integração **LiteLLM** (base URL + roteamento de modelo por ambiente) | |
| E2 | `[ ]` Endpoint ou action “Gerar legendas” a partir de bullets + tom de voz | Zod no I/O |
| E3 | `[ ]` Política: não agendar sem `approved` humano (flag por org no futuro) | |
| E4 | `[ ]` Persistir prompt/resposta resumida para suporte e melhoria contínua | Opcional redact PII |

---

## EPIC F — Observabilidade e hardening (Fase A)

| ID | Task | Notas |
|----|------|--------|
| F1 | `[ ]` Dashboard interno ou query: taxa de sucesso de publicação (7 dias) | |
| F2 | `[ ]` Critério de saída Fase A: **8+ posts** publicados em 4 semanas (ajustável) — checklist em `MVP-PLANO.md` | |

---

## EPIC G — Demanda e AgentCRM (Fase B)

| ID | Task | Notas |
|----|------|--------|
| G1 | `[ ]` Formulário ou landing mínima com campos de lead + captura de UTM | |
| G2 | `[ ]` `POST` servidor-a-servidor para AgentCRM: criar/atualizar `Contact` (`source`, `tags`, `custom_fields`) | Ver API em evolução no agentcrm |
| G3 | `[ ]` Retry + dead-letter queue se CRM indisponível | |
| G4 | `[ ]` Documentar contrato JSON (OpenAPI snippet ou exemplos em `docs/api/`) | |

---

## EPIC H — Multi-marca e billing (Fase C)

| ID | Task | Notas |
|----|------|--------|
| H1 | `[ ]` Workspaces adicionais com isolamento de dados (RLS) | |
| H2 | `[ ]` Planos e limites (posts/mês, créditos IA) | |
| H3 | `[ ]` Integração **Asaas** (assinatura, webhooks) — reaproveitar padrão SimplesZap | |

---

## EPIC I — Produto e engenharia (processo)

| ID | Task | Notas |
|----|------|--------|
| I1 | `[ ]` Habilitar **GitHub MCP** no Cursor para criar/listar issues deste repo | Ver `MCP-RECOMENDACOES.md` |
| I2 | `[ ]` (Opcional) Linear MCP se o time usar Linear | |
| I3 | `[ ]` Labels GitHub: `epic/A`, `phase/MVP`, `priority/P1` | |

---

## EPIC J — Futuro (pós-MVP)

| ID | Task | Notas |
|----|------|--------|
| J1 | `[ ]` Leitura de campanhas ads (Meta/Google) + alertas | |
| J2 | `[ ]` Atribuição v2 (UTM + eventos + CRM) | |
| J3 | `[ ]` **MCP próprio** do Marketing OS (tools: resumo semanal, listar posts) | |
| J4 | `[ ]` White-label (domínio, relatório PDF para cliente) | |

---

## Dependências sugeridas (ordem)

1. A → B → C → E (IA pode paralelizar com D após C1 esboçado)  
2. D + F fecham **Fase A**  
3. G → **Fase B**  
4. H → **Fase C**  
5. J conforme prioridade de negócio  

---

*Atualizado: 2026-04-18*
