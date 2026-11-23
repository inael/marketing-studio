# Fluxos do back-end (B01–B50): detalhamento e estado na cópia

Estado: **feito** = implementado na cópia e testado no banco simulado | **aplicado** = implementado, sem teste de ponta a ponta (depende de serviço externo) | **existia** = já estava no projeto, revisado só por leitura | **falta** = não implementado.

| # | Fluxo | Estado | O que a opção recomendada pede | O que tem na cópia |
|---|---|---|---|---|
| B01 | Autenticação com Logto | existia | sessão em cookie httpOnly, estado (CSRF) e PKCE | SDK @logto/next/client já faz estado, PKCE e refresh; não reimplementado |
| B02 | Sessão expirada | aplicado | 401 guarda a tela, leva ao login e volta com o texto | `lib/sessao.ts`, rascunho da legenda por post, aviso de sessão renovada |
| B03 | Permissões por marca | feito | um utilitário `requireBrand` por rota; papel por marca | `server/permissoes.ts` + tabela `brand_members`; testado (gestor, analista, sem vínculo) |
| B04 | Criação sem duplicar | feito | chave de idempotência gerada ao abrir o formulário | coluna `idempotency_key`, busca antes de inserir; testado |
| B05 | Upload direto ao R2 | aplicado | URL assinada, envio direto, confirmação no servidor | `/api/media/presign` + `/api/media/confirmar`; formulário usa o fluxo |
| B06 | Validação de mídia | feito | lista completa de problemas por rede, com correção | `server/midia-regras.ts`; testado |
| B07 | Legenda por IA em partes | aplicado | resposta em partes, limite de 30 s, parcial vira rascunho | modo `stream` na rota de legenda; não testado com provedor real |
| B08 | Versão por rede | feito | versão por rede com o que mudou, original preservada | `lib/variantes.ts`; testado |
| B09 | Agendamento com fuso | feito | converter o horário local da marca para UTC; recusar passado e inexistente | `lib/fuso.ts`, `timezone` na marca; testado (São Paulo e Lisboa) |
| B10 | Estados do post | feito | um ponto de entrada; transição inválida não grava; log | `server/post-estado.ts`, `post_status_log`; testado |
| B11 | Job de publicação a cada 15 min | aplicado | lote pequeno, trava por post, nova tentativa com recuo | `server/publicacao-job.ts`, rota do cron reescrita; só a classificação foi testada |
| B12 | Publicar imagem no Instagram | existia | publicação de imagem via Graph API | `server/graph.ts` (`publishImages`); não revisado a fundo |
| B13 | Publicar carrossel | existia | carrossel via Graph API | `server/graph.ts`; não revisado a fundo |
| B14 | Publicar reel | existia | reel via Graph API | `server/graph.ts` (`publishReelPost`); não revisado a fundo |
| B15 | Publicar no LinkedIn | aplicado | publicar post da marca na página do LinkedIn | `server/linkedin.ts`, chamado depois do Instagram no job; texto apenas (imagem depende da API de assets) |
| B16 | Retry e recuo | feito | transitório volta com recuo 1/3/9 min; definitivo não repete | `classificarErro` e recuo no job; classificação testada |
| B17 | Publicação idempotente | aplicado | não repetir post já publicado; reaproveitar o container | guarda por `external_url`; reaproveitar container falta |
| B18 | Logs de publicação | existia | registro de cada tentativa | `logPublish` grava `publish_logs` |
| B19 | Início da conexão Instagram | existia | redireciona ao OAuth | `connections/instagram/start` |
| B20 | Callback do OAuth | existia | troca o código e grava a conta | `connections/instagram/callback` |
| B21 | Renovação do token de longa duração | aplicado | renovar o token antes de expirar | `server/token.ts` no job diário; aviso ao time se falhar; não testado com a Meta |
| B22 | Verificação de conexão | existia | confirma que a conta responde | `connections/verify` + botão "Testar conexão" (D24) |
| B23 | Planejamento matinal | existia | agenda o dia com as janelas da marca | `server/planner.ts` (`planMorning`) |
| B24 | Sugestões por fonte com cache | aplicado | cache por fonte para não buscar a cada abertura | `lib/cache.ts`; feeds RSS em cache de 15 min |
| B25 | Coletor do X | existia | serviço separado que coleta o X | `services/twitter-scraper` |
| B26 | Relatórios de concorrentes com cache | existia | cache do relatório | tabela `report_cache` (`server/reports.ts`) |
| B27 | Painel de mercado e insight | existia | insight sob demanda | `api/ai/insight` e cartões do mercado |
| B28 | Coleta de consumo de IA | existia | registrar tokens e custo | `server/usage.ts` (`logUsage`) |
| B29 | Piloto automático | existia | gera e agenda sozinho | `server/automation.ts` |
| B30 | Imagem no Higgsfield | existia | geração de imagem | `server/higgsfield.ts` |
| B31 | Vídeo no Higgsfield e acompanhamento | existia | geração de vídeo com status | `server/higgsfield.ts` |
| B32 | Créditos insuficientes | existia | recusar antes de gastar | tratamento no `higgsfield.ts`; não revisado a fundo |
| B33 | Cenas do storyboard | existia | gerar cenas | `api/ai/storyboard` |
| B34 | Render com Remotion | existia | renderizar criativos | pasta `remotion/` (fora do app) |
| B35 | Indexação da biblioteca | parcial | busca por marca, tipo e uso | página de busca (M33) e filtros da biblioteca; sem índice dedicado |
| B36 | Limpeza de mídia órfã | feito | remover envios não confirmados e falhas | `server/manutencao.ts`; testado |
| B37 | Configurações e segredos | existia | segredos que nunca voltam para a tela | `app_settings` write-only + cofre por marca (D40) |
| B38 | Troca de provedor de IA | aplicado | tentar o provedor de reserva uma vez | `getAiConfigReserva` na legenda: 5xx ou 429 no principal chama o outro uma vez |
| B39 | Notificações internas | aplicado | aviso gerado por falha, com motivo | tabela `notificacoes`; o job grava falhas definitivas e esgotadas; a central mostra em Pedem ação |
| B40 | Auditoria | aplicado | registrar quem alterou o quê | `auditar()` em marca, configurações e exclusão de post |
| B41 | Backup e restauração | aplicado | exportar e restaurar o banco | `scripts/backup.mjs` (pg_dump, envio ao R2) e `scripts/restore.mjs` (exige --confirmar); não executado (sem banco real) |
| B42 | Migrações | existia | aplicar as migrações em ordem | `scripts/migrate.mjs`; migrações 0002 a 0007 criadas aqui |
| B43 | Saúde do serviço | feito | banco e partes respondem | `/api/health`; testado |
| B44 | Deploy | existia | publicar e agendar jobs | `vercel.json` com crons; deploy é externo |
| B45 | Limite de requisições | aplicado | limitar IA e envio por usuário | `lib/limite.ts` em legenda e envio; não testado |
| B46 | Erros padronizados | aplicado | mesmo formato de erro | `lib/erro.ts` nas rotas de mídia |
| B47 | Cache do painel | aplicado | resumo em cache de 30 s, limpo ao mudar estado | `dashboardSummary` com cache |
| B48 | Concorrência entre jobs | feito | um job não pega o que outro já travou | trava por post no job (B11) |
| B49 | Conciliação de estado | aplicado | liberar travas vencidas | `server/manutencao.ts` (`conciliarEstado`) |
| B50 | Exclusão de post e mídia | aplicado | mídia só some se nenhum post a usa | `removeMedia` com checagem e remoção no R2 |

## Pendências reais
- B35: índice dedicado da biblioteca (hoje é busca e filtro).
- B12 a B14, B19, B20, B22, B23, B25 a B34 e B37: existem no projeto, mas só foram lidos; falta revisão e teste.
- B17: reaproveitar o container de mídia na Graph API (depende dos detalhes da API).
- B32: revisar o tratamento de créditos insuficientes.
- Todos os fluxos que tocam Meta, LinkedIn, R2, Higgsfield e provedores de IA precisam de credenciais reais para validar de ponta a ponta.
