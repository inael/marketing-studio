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

| Spec | Status | Verificação |
|---|---|---|
| 04 Tema light/dark | ✅ feito | build + revisão de cores hardcoded |
| 05 Dashboard | ✅ feito | build; queries agregadas |
| 02 Estúdio de legenda | ✅ feito (adaptar-por-rede: texto ok, publish LinkedIn bloqueado por review) | build |
| 01 Relatórios de concorrentes | ✅ feito | **dados reais verificados** (self @itboosterglobal + docusign) |
| 03 Mercado + insights | ✅ feito | build; reusa dados da 01 |
| 07 Consumo (tokens + custo US$ por funcionário) | ✅ feito | **coleta verificada** (gateway retorna usage+cost; grava/agrega) |
| Time (foto + organograma) | ✅ feito | build |
| 08 Navegação rail + submenu | ✅ feito | build |
| 06 Sugestões v2 (abas + 2 colunas + editar + hashtags) | ✅ feito | build |
| Criar em passos (wizard) | ✅ feito | build |
| Logo da marca (upload) | ✅ feito | build |

### Bloqueado por dependência externa (não implementável sem provisão)
- **Twitter/X e YouTube como fontes** (Spec 06): precisa de X API (paga) e
  YouTube Data API key. Abas já existem como "em breve".
- **Gerar imagem self-service no app** (Spec 06): API REST da Higgsfield zerada
  (403). Funciona via sessão Claude (MCP, ~1 crédito/img); self-service exige
  top-up na conta REST.
- **Publicar no LinkedIn** (adaptar-por-rede): app aguarda aprovação do
  Community Management API pela LinkedIn.
- **Conectar contas por OAuth**: liberar domínio/redirect no app do Meta.

Extras entregues fora das specs originais: preview de post do Instagram
realista (carrossel/reel), grade estilo IG, seleção em massa, logos das redes,
upload 413 corrigido, avatar/logo da marca em todo lugar.
