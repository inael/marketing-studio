# Spec 07 — Relatório de consumo (tokens por funcionário)

Quanto cada funcionário (persona) gasta de tokens gerando legenda, sugestão,
descrição, e quantos créditos/imagens foram geradas.

## Coletar primeiro (sem coleta não há relatório)
Tabela `usage_events`:
```
id uuid pk default gen_random_uuid()
persona text            -- nome do analista/gestor, ou null (uso manual)
tipo text               -- 'sugestao' | 'legenda' | 'gestao' | 'imagem' | 'descricao'
model text
brand_id uuid null
prompt_tokens int default 0
completion_tokens int default 0
total_tokens int default 0
credits numeric default 0   -- imagens (Higgsfield): ~1 credito/img
created_at timestamptz default now()
```

## Instrumentação
O gateway OpenAI-compatível devolve `usage {prompt_tokens, completion_tokens,
total_tokens}` — capturar em cada chamada:
- **planner.callAnalyst** → 1 evento por analista (persona=a.nome, tipo='sugestao').
- **/api/ai/caption** → tipo='legenda' (persona=null = manual, ou a marca).
- **/api/ai/manager** → tipo='gestao' (persona=gestor).
- **imagem** (via sessão MCP / futura API): logar 1 evento tipo='imagem',
  credits=custo (FLUX.2 Pro 1K = 1). Enquanto for via sessão, `tools/log_image_usage.mjs`.

`server/usage.ts`: `logUsage(row)` (best-effort, nunca quebra a request) +
`usageReport({days})`.

## Relatório — página /consumo (nova, no menu)
- Cards de total: tokens totais, por tipo, nº de imagens/creditos, período.
- **Ranking por funcionário**: tabela persona × (sugestões, legendas, gestão,
  imagens, tokens totais, créditos). Ordenar por tokens.
- Filtro de período (7/30/90 dias) e por marca.
- (Opcional) custo estimado em R$/US$ por 1k tokens configurável em Config.

## Aceite
- Ao gerar sugestões, aparecem eventos por analista com tokens reais.
- /consumo mostra o ranking por funcionário e os totais do período.

## Notas
- Imagens só são geradas via sessão hoje (API REST zerada) → o consumo de
  imagem entra por log manual/estimado até o top-up. Deixar claro na tela.
