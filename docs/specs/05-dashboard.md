# Spec 05 — Dashboard (home com infos importantes)

Inspirado no Dashboard do mLabs (status das contas conectadas + visão geral).
Vira a página inicial do app (hoje `/` redireciona/mostra pouco; a home logada
deve ser o Dashboard).

## Objetivo
Uma tela de abertura que responde "o que preciso ver/fazer agora" em todas as
marcas: pendências, conexões, agenda e números.

## Blocos
1. **Pendências de aprovação**: nº de rascunhos aguardando + atalho pra Posts
   filtrado em Rascunho. Destaque pros do time (origem=auto) do dia.
2. **Próximas publicações**: os próximos N posts `scheduled` (marca, data, tipo).
3. **Status das conexões** (estilo mLabs): grade por marca × rede (Instagram /
   LinkedIn) com "conectado / pendente" + link pra conectar. Reusa `resolveIg`
   e `linkedin_org_id`. Foto de perfil da marca no card.
4. **Números do estúdio**: total de marcas ativas, posts por status
   (rascunho/agendado/publicado), publicados na semana, excluídos.
5. **Sugestões do dia**: quantas sugestões salvas por marca + atalho.
6. **Automação**: estado (8h sugestões / 9h gestor) on/off + link pra Config.

## Servidor
- `src/server/dashboard.ts`: `dashboardSummary()` agrega em poucas queries:
  counts de posts por status (não deletados), próximos agendados, rascunhos
  pendentes por marca, sugestões por marca, conexões por marca, flags de
  automação (app_settings).

## UI — `/` (ou `/dashboard`) como home logada
- Cards no topo (números) + duas colunas: pendências/agenda à esquerda,
  conexões à direita. Tudo com atalhos.
- Nav: "Dashboard" como primeiro item (ícone), vira a rota inicial pós-login.

## Aceite
- Pós-login cai no Dashboard com números reais e atalhos que funcionam.
- Conexões refletem o estado real (IG/LinkedIn) por marca.

## Fora de escopo
- Gráficos de performance (isso é Relatórios / Spec 01/03).
