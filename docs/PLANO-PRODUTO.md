# Plano de produto — Marketing OS (nome de trabalho)

Documento mestre: visão, personas, escopo por fase, métricas de sucesso e riscos. Detalhamento de execução está em `TASKS.md` e `MVP-PLANO.md`.

---

## 1. Visão

**Um painel unificado** para planejar conteúdo, gerar e revisar textos com IA, publicar em redes sociais com consistência, captar leads e **encaminhá-los ao AgentCRM** — com opção de **assinatura multi-tenant** no futuro.

**Diferencial inicial:** execução fim a fim para **uma marca piloto (IT Booster)** antes de escalar para vários SaaS; integração nativa com o ecossistema IT Booster (Logto, Supabase, VPS, LiteLLM, Asaas).

---

## 2. Personas

| Persona | Necessidade principal |
|---------|------------------------|
| **Fundador / PMM (você)** | Destravar redes paradas; repetir processo por produto; pouco tempo; não ser “especialista em marketing”. |
| **Agência pequena (futuro)** | Múltiplos clientes, marca branca, relatórios, billing. |
| **PM + Eng (interno)** | Issues e roadmap alinhados ao código (GitHub/Linear + documentação neste repo). |

---

## 3. Proposta de valor

1. **Cadência:** calendário + estados claros (rascunho → aprovado → agendado → publicado).
2. **IA operacional:** legendas e variações a partir de bullets; **humano aprova** antes de publicar.
3. **Dados da jornada:** `source`, UTMs e `custom_fields` compatíveis com **AgentCRM** (`Contact`).
4. **Infra que você já domina:** sem lock-in em um único SaaS de terceiros para o núcleo.

---

## 4. Fases de produto (resumo)

| Fase | Nome | Objetivo |
|------|------|----------|
| **A** | MVP uso real | IT Booster + 2 redes + calendário + mídias + IA + publicação estável |
| **B** | Demanda → CRM | Form/landing + envio de leads ao AgentCRM |
| **C** | Multi-marca | Workspaces por SaaS + limites + billing (Asaas) |
| **D** | Profundidade | Ads read-only → alertas; atribuição v2; WhatsApp disciplinado |
| **E** | Escala agência | White-label, API pública, **MCP próprio** do produto |

Ordem detalhada e critérios de pronto: `MVP-PLANO.md`.

---

## 5. Métricas de sucesso (sugeridas)

**Fase A**

- Número de publicações **no prazo** / total agendado (por semana).
- Taxa de **falha** de API de rede (meta: abaixo de limiar acordado após período de hardening).
- **Tempo** da ideia ao agendamento (median).

**Fase B**

- % de leads com `source`/UTM preenchidos.
- Taxa de **entrega** ao AgentCRM (200 vs retries/erros).

**Comercial (Fase C+)**

- MRR, churn, limites de uso (posts, chamadas IA, contatos).

---

## 6. Fora de escopo no MVP (explícito)

- Substituição completa de Meta Ads Manager / Google Ads UI.
- Atribuição multi-touch “perfeita”.
- Automação de WhatsApp em massa sem opt-in e políticas claras.
- Gerador de vídeo YouTube completo.

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Mudança de API / revisão Meta/LinkedIn | Começar com escopo mínimo de permissões; documentar em `/docs/integracoes/` |
| Custo de IA | Quotas por tenant; LiteLLM + modelos baratos para rascunho |
| Escopo creep | “Um loop completo” por fase; `TASKS.md` com dependências |

---

## 8. Documentos relacionados

- `MVP-PLANO.md` — abordagem “IT Booster primeiro” vs outras.
- `TASKS.md` — épicos e tasks rastreáveis.
- `MCP-RECOMENDACOES.md` — MCPs para gestão de produto no IDE.
- `GITHUB-IA-REFERENCIAS.md` — ecossistema GitHub para IA.

---

*Atualizado: 2026-04-18*
