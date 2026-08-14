# Spec 08 — Navegação em rail + submenu

Inspirado no padrão (print): **rail estreito de ícones à esquerda** (seções de
topo) + **painel de submenu à direita** com os itens da seção selecionada.

## Estrutura proposta (agrupar o que hoje é lista plana)
- **Início** → Dashboard.
- **Conteúdo** → Posts · Criar · Sugestões · Storyboard · Calendário · Biblioteca.
- **Marcas** → Marcas · (Conexões, Fontes ficam dentro da marca).
- **Time** → Time (personas) · Consumo (tokens, Spec 07).
- **Relatórios** → Concorrentes (Spec 01) · Mercado (Spec 03).
- **Config** → Config.

## Comportamento
- Rail (~64px): ícone + label curto por seção; seção ativa destacada.
- Submenu (~200px): título da seção + lista de sub-itens (com ícone), item ativo
  destacado; abre conforme a seção do rail escolhida (ou a rota atual).
- Colapsável: botão pra esconder o submenu e ficar só o rail.
- Rodapé do rail: usuário + tema + sair (como hoje).

## Implementação
- `app-nav.tsx` vira `SECTIONS` (seção → itens). Layout `(app)/layout.tsx` passa
  a ter duas colunas de nav (rail + submenu) antes do `<main>`.
- Estado da seção ativa derivado da rota (qual seção contém o pathname) +
  clique no rail troca a seção mostrada no submenu.
- Manter tudo theme-aware (tokens claro/escuro).

## Aceite
- Clicar numa seção do rail mostra os sub-itens à direita; navegar mantém a
  seção correta destacada; colapsar/expandir o submenu funciona.
