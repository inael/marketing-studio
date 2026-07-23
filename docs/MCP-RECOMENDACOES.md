# MCP recomendados — gestão de produto e engenharia

Este documento resume **pesquisa de mercado** (2025–2026) sobre MCPs úteis para **planejar, rastrear e entregar** software, e como **conectar no Cursor**.

> **Importante:** MCP é protocolo do **cliente** (Cursor, Claude, VS Code). Não é pacote `npm` do repositório `marketing`; a “instalação” é **registrar o servidor** nas configurações do IDE e autenticar (OAuth ou token).

---

## 1. Prioridade alta (stack típica de produto + código)

| MCP | Para quê | Notas |
|-----|----------|--------|
| **[GitHub oficial](https://github.com/github/github-mcp-server)** | Issues, PRs, Actions, código, repositório | Referência “oficial”; remoto hospedado pelo GitHub ou container `ghcr.io/github/github-mcp-server`. |
| **[Linear (oficial)](https://linear.app/docs/mcp)** | Roadmap, issues, projetos, comentários | Endpoint remoto OAuth: `https://mcp.linear.app/mcp`; ou `npx -y mcp-remote https://mcp.linear.app/mcp`. |
| **Context7** (se já usar no fluxo) | Docs de libs e APIs atualizadas | Reduz alucinação em integrações; combine com o time de engenharia. |

**GitHub MCP** cobre “tarefas no mesmo lugar do código” (issues vinculadas a PRs). **Linear MCP** cobre “produto e prioridade” se o time adotar Linear como fonte da verdade.

---

## 2. Se o stack for Atlassian (empresas maiores)

| MCP | Para quê |
|-----|----------|
| **[Atlassian Rovo MCP](https://github.com/atlassian/atlassian-mcp-server)** (oficial, cloud) | Jira, Confluence, Compass via endpoint remoto `https://mcp.atlassian.com/v1/mcp` (OAuth). |
| **[sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian)** (comunidade) | Jira + Confluence (cloud ou Data Center) com `uvx`/Docker; bom quando precisar self-host ou tokens clássicos. |

Útil quando PM e eng trabalham em **Jira/Confluence**.

---

## 3. Observabilidade e produto orientado a dados (fases posteriores)

| MCP | Para quê |
|-----|----------|
| **PostHog MCP** | Funis, feature flags, eventos — alinhar métricas ao que foi entregue. |
| **LaunchDarkly / Flipt / Unleash** (MCPs existentes em listas) | Feature flags na conversa com a IA — útil quando o Marketing OS tiver rollouts graduais. |

Ver artigo de referência: [Snyk — 7 MCP Servers for Product Managers](https://snyk.io/articles/7-mcp-servers-for-product-managers/).

---

## 4. Descobrir mais servidores

Repositórios curados no GitHub (bom para “explorar o que existe”):

- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) — site [mcpservers.org](https://mcpservers.org)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — diretório [glama.ai/mcp/servers](https://glama.ai/mcp/servers)
- [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) — categorizado
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — implementações de referência

---

## 5. Exemplo — Cursor (stdio via `mcp-remote`, Linear)

No Cursor: **Settings → MCP → Add Server**, ou editar JSON conforme a documentação atual.

Padrão frequentemente usado (Linear remoto):

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

Na primeira execução o fluxo tende a abrir **OAuth** no navegador. Detalhes atualizados: [Linear MCP docs](https://linear.app/docs/mcp).

---

## 6. GitHub MCP

Opções comuns:

- **Remote (GitHub hospedado):** seguir [README do repositório oficial](https://github.com/github/github-mcp-server) (instalação “Install in VS Code” / endpoint remoto).
- **Docker:** imagem `ghcr.io/github/github-mcp-server` (Docker obrigatório).

Tokens: uso de fine-grained PAT com escopos mínimos (repos, issues, workflows conforme necessidade).

---

## 7. Segurança

- Preferir **OAuth** ou **PAT com escopo mínimo**; não commitar segredos.
- Revisar periodicamente [MCPWatch](https://github.com/safedep/mcpwatch) ou práticas da sua org para servidores não oficiais.

---

## 8. Relação com este projeto (`marketing`)

- **Curto prazo:** GitHub MCP ajuda a **manter issues/tasks alinhadas ao código** deste monorepo.
- **Médio prazo:** ao expor **API do Marketing OS**, pode existir **MCP próprio** (ferramentas: listar posts, agendar, resumir métricas) — ver `PLANO-PRODUTO.md` fase “API & MCP”.

---

*Atualizado: 2026-04-18*
