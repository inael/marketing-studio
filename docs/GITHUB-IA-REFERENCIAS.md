# Referências GitHub — construir sistemas com IA

Resumo de **projetos relevantes** (não são dependências obrigatórias do Marketing OS; servem de **inspiração e stack** alinhada ao que você já usa: TypeScript, Next, monorepo).

---

## 1. Protocolo e servidores MCP

| Repo | Descrição |
|------|-----------|
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Servidores de **referência** (fetch, git, SQLite, etc.) e links para SDKs. |
| [github/github-mcp-server](https://github.com/github/github-mcp-server) | MCP **oficial** GitHub — issues, PRs, código. |
| Listas “awesome” | [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers), [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) |

**Uso:** padronizar como o **produto futuro** (Marketing OS) expõe ferramentas para agentes.

---

## 2. Frameworks de agentes e orquestração (TypeScript / full-stack)

| Repo | Stack | Quando considerar |
|------|--------|-------------------|
| [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | TypeScript, workflows, RAG, MCP | Monorepo TS/Next; agentes com **ferramentas** e trilhas de observabilidade; encaixa com LiteLLM na infra. |
| [Vercel AI SDK](https://github.com/vercel/ai) (`ai`) | React/Next, streaming | UI de chat, streaming, `generateObject` com Zod — já usado no **agentcrm** (`apps/web`). |
| [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | TS, grafos de estado | Fluxos multi-passo complexos; curva de aprendizado maior. |

**Python** (se um dia houver serviço Python): [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph), [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI), [Google ADK](https://github.com/google/adk) — úteis para pipelines de dados ou times já em Python; seu ecossistema atual é **Node-first**.

---

## 3. Plataformas low-code / ops de LLM

| Repo | Descrição |
|------|-----------|
| [langgenius/dify](https://github.com/langgenius/dify) | Orquestração, RAG, apps — muitas estrelas; **alternativa** a construir tudo do zero (avaliar se não duplica N8N que você já tem). |

---

## 4. Alinhamento com seus repositórios

- **agentcrm:** `@ai-sdk/*`, `ai`, Next 16 — continuar esse padrão para features de IA no **web**.
- **simpleszap:** MCP em `mcp/simpleszap-mcp` — **modelo** para um futuro `marketing-mcp` chamando sua API.
- **Infra:** LiteLLM + Supabase + N8N na VPS — agentes podem ser **workers** + fila, não só rotas síncronas.

---

## 5. Leitura recomendada

- Documentação **MCP**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- Comparativos mudam rápido; validar versão no npm/GitHub antes de travar arquitetura.

---

*Atualizado: 2026-04-18*
