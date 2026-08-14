# Spec 04 — Tema light/dark (default: light)

O app hoje é dark-only (tokens em `globals.css` via `@theme`). Adicionar tema
claro e escuro, **default = claro (white)**, com alternância persistida.

## Estratégia
- Tokens de cor definidos como **CSS variables** no `:root` (paleta light) e
  sobrescritos em `:root[data-theme="dark"]` (paleta dark). O `@theme` do
  Tailwind v4 referencia essas variáveis (`--color-canvas: var(--canvas)` etc.),
  então as classes (`bg-canvas`, `text-ink`, `border-line`…) passam a trocar
  sozinhas conforme `data-theme`.
- `data-theme` fica no `<html>`. Default: sem atributo = light. Toggle grava
  `localStorage.theme` e seta `data-theme`. Script inline no `<head>` aplica
  antes da hidratação (evita flash).

## Paletas
- **Light (default)**: canvas #ffffff, panel #f7f7f8, panel2 #eeeef1,
  ink #17171a, dim #444, faint #8a8a90, line #e4e4e8, line2 #d0d0d6.
  Manter os semânticos (info/ok/warn/bad/info) com contraste em fundo claro.
- **Dark**: paleta atual (canvas #0b0b0c etc.).
- Cores de marca (cor_principal) não mudam.

## UI
- Toggle no rodapé da sidebar (sol/lua) ao lado do usuário.
- Client component pequeno `ThemeToggle` (lê/grava localStorage + seta atributo).

## Aceite
- 1º acesso abre no **claro**. Alternar troca tudo (sidebar, cards, inputs,
  preview) sem flash ao recarregar. Escolha persiste.
- Revisar telas com cor "hardcoded" (ex: bg-black/70 nos modais/preview) pra
  não quebrar no claro.

## Riscos
- Componentes com cores fixas (overlays, gradientes) — auditar e trocar por
  tokens/opacidades que funcionem nos dois temas.
