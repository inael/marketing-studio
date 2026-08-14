# Spec 02 — Estúdio de legenda IA

Inspirado no "Criar legenda - IA" do mLabs. Evolui o atual `✦ Gerar com IA` do Criar.

## Objetivo
Gerar legenda com controle de **tom de voz**, **template de pauta** e **tamanho**,
e **adaptar a mesma legenda pra cada rede** (LinkedIn ≠ Instagram ≠ X).

## Peças
1. **Tom de voz**: Direto, Casual, Persuasivo, Alegre, Amigável (chips).
2. **Templates de pauta** (preenchem o assunto): "Um post sobre…", "Aponte os
   benefícios de…", "O que fazer para…", "Explique como…", "Escreva razões para…".
3. **Tamanho**: Curta / Média / Longa.
4. **Adaptar por rede**: a partir da legenda base, gerar variações no estilo de
   cada rede selecionada (LinkedIn mais pro/《storytelling》, Instagram com emojis,
   X curto). Cada variação some no post da rede correspondente.

## Servidor / API
- `POST /api/ai/caption` (já existe) ganha `{ tom, template, assunto, tamanho }`
  e monta o system prompt com o tom da marca + esses parâmetros.
- Novo `POST /api/ai/adapt` `{ brand_id, legenda, redes: string[] }` →
  `{ variacoes: { rede, texto }[] }`. Uma chamada por rede (paralelo) no gateway.

## Dados
- Post por-rede: hoje `posts` é IG-cêntrico. Fase 1: guardar variações em
  `posts.legendas_por_rede jsonb` (default null) e usar a da rede no publish.
  (LinkedIn publish depende da Spec de LinkedIn/HeyGen — aqui só guarda o texto.)

## UI — no Criar
- Painel "Estúdio de legenda": tom (chips) + template (dropdown) + assunto
  (input) + tamanho (seg) → "Gerar".
- Depois da base pronta: botão "Adaptar para redes" (escolhe redes) → mostra
  as variações em abas por rede, editáveis.

## Aceite
- Gerar com tom "Persuasivo" + template "benefícios" muda visivelmente a copy.
- "Adaptar" produz textos distintos por rede, editáveis, salvos no post.

## Fora de escopo
- Publicar de fato no LinkedIn/X (depende das specs de conexão/HeyGen).
