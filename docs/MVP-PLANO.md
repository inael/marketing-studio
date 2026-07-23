# Plano MVP — Marketing OS (IT Booster primeiro)

Documento vivo: descreve **abordagem em fases**, **contraste com outras**, e **escopo Sprint 1 vs depois**.

---

## 1. Qual a diferença na prática desta abordagem para outra?

### Abordagem adotada aqui — **“usar antes de generalizar”**

| Aspeto | Na prática |
|--------|------------|
| **Objetivo do primeiro corte** | Colocar **IT Booster** (1 workspace) a publicar de forma **repetível** em **2 redes** (ex. LinkedIn + Instagram), com calendário, rascunhos e IA para legendas, **antes** de suportar N marcas SaaS com a mesma profundidade. |
| **Entrega de valor** | Você (e quem for piloto) **usa o produto na vida real** em semanas, não após meses só com tela bonita. |
| **Risco** | Se o fluxo estiver errado (ex. aprovação, agendamento, limites de API), você descobre **cedo** e corrige **sem** ter multiplicado o erro para vários workspaces. |
| **Prioridade de código** | Primeiro: **um tenant**, auth, filas, 1–2 integrações sociais **estáveis**. Depois: **isolamento forte** entre workspaces, billing granular, múltiplos conectores. |
| **Documentação e decisões** | Cada fase tem **critério de “pronto”** (ex.: “2 posts/semana agendados por 4 semanas sem falha”). |

### Outra abordagem comum — **“plataforma completa antes do primeiro uso”**

| Aspeto | Na prática |
|--------|------------|
| **Objetivo** | Entrar no mercado já com **multi-tenant cheio**, ads, email, WhatsApp, white-label, etc., num único grande lançamento. |
| **Entrega de valor** | Demora **muito** até alguém postar o primeiro conteúdo de verdade; o time constrói no vácuo. |
| **Risco** | Integrações e regras multi-marca **antes** de validar o fluxo core = **retrabalho** quando o calendário/editor precisar mudar. |
| **Prioridade de código** | Muita infra genérica cedo; o que importa (consistência de publicação) compete por tempo com features “de slide”. |

### Terceira — **“lista de features sem marco”**

| Aspeto | Na prática |
|--------|------------|
| **Problema** | Várias funcionalidades **meio prontas**; nenhuma história de usuário fecha ponta a ponta (“do tema → ao ar”). |
| **Resultado** | Redes continuam paradas; o produto não **prova** que resolve a dor. |

**Resumo:** a diferença não é “menos ambição”, e sim **ordem**: primeiro **fechar o loop** (ideia → IA → aprovar → agendar → publicar → ver status) para **uma** marca; depois **clonar o modelo** para cada SaaS com workspaces e billing.

---

## 2. Fases (alinhado ao combinado)

### Sprint / Fase A — Uso real: IT Booster

**Escopo mínimo:**

- 1 workspace (IT Booster).
- 2 redes sociais (definir quais APIs primeiro: Meta IG+FB **ou** LinkedIn conforme viabilidade técnica e revisão de app).
- Calendário editorial (visão lista/semana simples).
- Post: rascunho → aprovado → agendado → publicado / erro.
- Biblioteca de mídias (upload + listagem).
- IA: gerar legendas/variações a partir de bullet points; **sempre** com revisão humana antes de agendar.
- Observabilidade: logs de publicação e falha; retry básico.

**Critério de pronto (exemplo):**

- Pelo menos **8 postagens agendadas e publicadas** em 4 semanas (ajustável) com taxa de falha documentada e corrigida se > limiar definido.

**Fora de escopo nesta fase:**

- Segundo workspace para outros SaaS com isolamento completo de billing.
- Tráfego pago (Meta/Google) na UI.
- Sincronização de leads com AgentCRM (pode ser **Fase B** imediata se prioridade for vendas).

### Fase B — Demanda e CRM

- Formulário/landing mínima + UTMs.
- `POST` para AgentCRM (API key ou M2M): criar/atualizar `Contact` (`source`, `tags`, `custom_fields`, `lead_status`).

### Fase C — Múltiplas marcas (SaaS)

- Workspaces por produto; limites por plano; reutilizar o mesmo fluxo da Fase A.

---

## 3. Princípios de produto (fixos)

1. **Um loop completo** vale mais que cinco meias features.
2. **IA** assiste decisão; não publica sozinha sem política de aprovação (configurável no futuro).
3. **Integrações**: segredos só no backend; filas na VPS para jobs longos.
4. **Documentar** cada integração social: permissões, limites de API, o que falha e como o usuário corrige.

---

## 4. Referências internas

- AgentCRM — modelo de contacto/lead: `packages/shared` (`Contact`, `source`, `lead_status`, …).
- Infra prevista: Supabase, VPS, Logto, LiteLLM, Asaas (ver `services.env` central — não commitar segredos).
- Plano ampliado: [`PLANO-PRODUTO.md`](./PLANO-PRODUTO.md)
- Lista de execução: [`TASKS.md`](./TASKS.md)
- MCP para gestão no IDE: [`MCP-RECOMENDACOES.md`](./MCP-RECOMENDACOES.md)
- Ecossistema IA (GitHub): [`GITHUB-IA-REFERENCIAS.md`](./GITHUB-IA-REFERENCIAS.md)

---

*Última atualização: 2026-04-18*
