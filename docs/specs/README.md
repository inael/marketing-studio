# Specs — evolução Marketing Studio (inspirado no mLabs)

Implementação **uma por uma**, sequencial (features tocam nav/banco/CSS
compartilhados; agentes paralelos se conflitariam).

## Ordem
1. **[04] Tema light/dark** (default light) — bounded/visível, base pras demais.
2. **[05] Dashboard** — home com pendências, conexões, agenda e números.
3. **[01] Relatórios de concorrentes** — tabela seu perfil × concorrentes,
   melhores posts, dias/horários, hashtags, seguidores (dados já disponíveis).
4. **[03] Painel de mercado + insights IA** — perfil vs média do mercado +
   "quero um insight" (reusa os dados da 01).
5. **[02] Estúdio de legenda IA** — tom de voz + templates + tamanho + adaptar
   a legenda por rede.

Cada spec tem objetivo, fonte de dados, servidor, API, UI e critérios de aceite.
Status vai sendo marcado aqui conforme entrega.

| Spec | Status |
|---|---|
| 04 Tema light/dark | ✅ feito |
| 05 Dashboard | ✅ feito |
| 02 Estúdio de legenda | ✅ feito (adaptar-por-rede pendente) |
| 06 Sugestões v2 (abas + 2 colunas + editar + hashtags) | ✅ feito (Twitter/YouTube + gerar-imagem-por-card + Time foto/organograma pendentes) |
| 08 Navegação rail + submenu | ⬜ |
| 07 Relatório de consumo (tokens/funcionário) | ⬜ |
| 01 Relatórios de concorrentes | ⬜ |
| 03 Mercado + insights | ⬜ |

Extras entregues fora das specs originais: preview de post do Instagram
realista (carrossel/reel), grade estilo IG, seleção em massa + logos nas redes/
marcas, upload 413 corrigido, avatar/logo da marca.
