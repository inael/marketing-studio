# Marketing Studio

Orquestrador de conteúdo e agendamento social (Instagram + LinkedIn) para os produtos da IT Booster.

Cria, aprova, agenda e publica posts para 8 produtos (FreelanceGo, Darkemail, JetSend, SimplesZap, UseTokia, IT Booster, Recapitule, AssinaAgora), com interface gráfica de calendário, publicação via API oficial e geração de mídia via Higgsfield + templates editoriais por marca.

## Status

Em spec/brainstorm. Design fechado em `docs/superpowers/specs/2026-07-23-marketing-studio-design.md` (aguardando review antes do plano de implementação).

## Princípios de identidade

- **Editorial por marca:** cada produto usa seu brand kit real (cor/fonte/tom). Sem "cara de IA" genérica.
- **Elenco compartilhado:** personagens Higgsfield (Inael, Karla, Tata, Tarsila) como fio condutor da holding, usados com intenção (não stock).
- **Revisão humana** sempre antes de publicar.

## Stack

Next.js 15 + shadcn/ui + Supabase (self-hosted) + Inngest + worker Python (reusa `ig_graph.py`) + Higgsfield (MCP). Deploy Coolify em `marketing.itbooster.com.br`.

## Docs

- Spec de design: [docs/superpowers/specs/2026-07-23-marketing-studio-design.md](docs/superpowers/specs/2026-07-23-marketing-studio-design.md)
- PRD e planos anteriores: [docs/](docs/)
