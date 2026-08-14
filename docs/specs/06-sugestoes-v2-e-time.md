# Spec 06 — Sugestões v2 (abas por fonte) + Time (foto + diagrama)

## Sugestões v2
- **Abas por fonte**: "Inspirado em notícias", "Inspirado em concorrentes",
  "Inspirado no Twitter/X", "Inspirado em vídeos do YouTube". Cada aba tem seu
  próprio botão **Gerar** — gera SÓ daquela fonte (pesquisa/processa aquela
  fonte), não tudo de uma vez.
- **Card em 2 colunas**: esquerda = a "postagem completa" (legenda/descrição +
  **hashtags**); direita = **preview** (InstagramPreview) onde, no lugar da
  imagem, aparece o **texto do prompt** (pra ter ideia do que será gerado).
- **Prompt de imagem em PORTUGUÊS** (feito no planner) pra dar pra ler/avaliar.
- **Editável**: duplo-clique no prompt da imagem pra editar; editar também a
  legenda e as hashtags inline. Persistir a edição na `suggestions`.
- **Ideias vêm com hashtags**: o analista passa a devolver `hashtags[]` por ideia
  (a sugestão é a postagem completa, notícia OU concorrente). Nova coluna
  `suggestions.hashtags text[]`; carregar pro post no "Aceitar".

### Fontes novas
- **Twitter/X**: precisa de API paga (X API v2) — cadastrar chave no vault +
  Config; buscar trends/tweets do nicho. Sem chave, aba mostra "configurar".
- **YouTube**: YouTube Data API v3 (chave grátis com cota) — buscar vídeos
  recentes do nicho/canais; usar título+descrição como sinal. Cadastrar
  `YOUTUBE_API_KEY` no vault + Config.

### Servidor
- `content_sources.kind` ganha 'twitter' e 'youtube' (handles/canais).
- `signals.ts`: `twitterSignals()` e `youtubeSignals()`.
- `/api/ai/suggest` aceita `fonte` ('noticia'|'concorrente'|'twitter'|'youtube')
  e gera só daquela; `planner.generateSuggestions(brand, cfg, {fonte, feedback})`.
- `suggestions`: + coluna `hashtags text[]`; actions de editar
  (updateSuggestion: legenda/hashtags/imagem_prompt).

## Time (personas)
- **Foto do gestor e analistas**: upload na edição da persona (coluna
  `personas.foto_url`; upload via /api/media → R2). Mostrar avatar no card.
- **Nome** já existe; garantir exibição.
- **Diagrama org**: na página Time, um organograma simples — gestor no topo,
  3 analistas abaixo com linhas ligando (reportam a ele).

## Gerar imagem a partir da sugestão
- Botão **por card**: "Gerar imagem" usa o `imagem_prompt` daquela sugestão.
- **Seleção + gerar em lote**: marcar várias e gerar as imagens de uma vez.
- ⚠️ Depende da MESMA carteira de imagem de antes: a API REST da Higgsfield está
  zerada (403) e a cota ilimitada é só web. Então, no app, o botão só funciona
  self-service com **top-up na API REST**; enquanto isso, a geração roda por
  **sessão Claude (MCP, 1 crédito/img)**. UI: o botão enfileira o pedido e a
  imagem entra quando gerada (via sessão ou, no futuro, API com créditos).

## Ordem sugerida
1. prompt em PT (feito).
2. hashtags nas sugestões (analista + coluna + UI + carry).
3. card 2 colunas + editar inline (legenda/hashtags/prompt).
4. abas + gerar por fonte (notícias/concorrentes primeiro; Twitter/YouTube depois
   das chaves).
5. Time: foto das personas + organograma.
