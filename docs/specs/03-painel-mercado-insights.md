# Spec 03 — Painel de mercado + insights IA

Inspirado no "mLabs Insights / Análise de mercado". Depende da Spec 01 (dados).

## Objetivo
Mostrar o perfil da marca vs **média do mercado** (os concorrentes cadastrados
funcionam como proxy de mercado) em métricas-chave, com selo acima/abaixo e um
botão "Quero um insight" que a IA gera por métrica.

## Métricas (reusa AccountStats da Spec 01)
Para cada uma: valor do perfil, média do mercado (média dos concorrentes),
delta % (acima/abaixo), cor (verde/vermelho):
- Média de interação por post
- Nº de posts (frequência) no período
- Taxa de engajamento do perfil (%)
- Posts por semana (frequência)
- Seguidores (posição relativa)
- (Reels/Stories: "n/d" enquanto a API não fornecer)

## Servidor / API
- `market = deriveMarket(report)` — puro, sobre o payload da Spec 01 (sem nova
  chamada de API): calcula médias do mercado e deltas.
- `POST /api/ai/insight` `{ brand_id, metrica, valores }` → a IA devolve 2-3
  frases práticas ("como melhorar X") no tom de consultor. Usa o gateway.

## UI — aba "Mercado" dentro de `/relatorios`
- Cards por métrica (valor + "média do mercado: X" + selo ↑/↓ % + botão
  "Quero um insight" que expande o texto da IA).

## Aceite
- Cada card mostra perfil vs média e o delta correto.
- "Quero um insight" retorna recomendação específica da métrica.

## Fora de escopo
- Benchmark de mercado "real" (mLabs usa base própria) — aqui o mercado = os
  concorrentes cadastrados. Deixar claro na UI.
