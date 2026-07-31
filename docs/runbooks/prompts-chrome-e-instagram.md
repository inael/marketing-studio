# Prompts p/ Claude no Chrome (Meta Business) + passo a passo Instagram celular

Contexto: conectar os Instagrams dos produtos IT Booster à API oficial da Meta.
Business Manager: **It Booster Global** (business.facebook.com). App Meta da IT Booster (ID começa com `839701`).

---

## PROMPTS PARA O CLAUDE NO CHROME
Abra business.facebook.com logado na conta que administra o **It Booster Global** e cole um prompt por vez.

### Prompt 1 — Gerar token do piloto (@itboosterglobal) [RODAR AGORA]
```
Você está no Meta Business Suite da empresa "It Booster Global". Objetivo: criar um Usuário do Sistema e gerar um token de acesso para publicar no Instagram @itboosterglobal via API oficial.

Passos:
1. Abra Configurações do negócio (Business Settings).
2. Menu "Usuários" > "Usuários do sistema" > botão "Adicionar". Nome: marketing-studio-publisher. Função: Administrador. Criar.
3. No usuário criado, clique "Adicionar ativos". Aba Páginas: selecione a Página "It Booster Global" com Controle total. Aba Instagram: selecione "@itboosterglobal" com Controle total. Salvar.
4. Clique "Gerar novo token". Selecione o app Meta da IT Booster (o ID começa com 839701, NÃO é o app do LinkedIn).
5. Marque as permissões: instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement, business_management. Gerar token.
6. COPIE o token inteiro (ele só aparece uma vez) e cole na sua resposta. Me diga também o nome exato da Página e do @ atribuídos.
```

### Prompt 2 — Apagar o portfólio redundante "DarkEmail"
```
No seletor de portfólios do Meta Business Suite, selecione o portfólio "DarkEmail" (o que tem 0 ativos, NÃO o "It Booster Global"). Vá em Configurações do negócio > Informações da empresa > role até o fim > "Excluir permanentemente esta empresa". Confirme. Me avise se pedir período de espera de 30 dias.
```

### Prompt 3 — Trazer os Instagrams dos produtos pro guarda-chuva (rollout)
```
No portfólio "It Booster Global" > Configurações do negócio > Contas > "Contas do Instagram" > botão "Adicionar" > "Conectar sua conta do Instagram". Faça login na conta de Instagram do produto que eu indicar (uma por vez). Depois, vá em Contas > Páginas, abra a Página desse produto, e em "Contas vinculadas / Instagram" vincule esse Instagram à Página. Repita para cada produto. Liste quais Instagrams ficaram vinculados a quais Páginas ao final.
```

### Prompt 4 — Limpeza de Páginas (rollout)
```
No portfólio "It Booster Global": (a) renomeie a Página "SimplesMail" para "JetSend" (produto foi renomeado). (b) Verifique se existe Página do "Recapitule"; se não existir, crie uma Página de empresa chamada Recapitule. Me confirme o que fez.
```

---

## PASSO A PASSO NO INSTAGRAM DO CELULAR
Necessário só para as contas de produto que ainda são **pessoais** ou não estão vinculadas a uma Página. (O @itboosterglobal já está ok, não precisa.)

Para cada conta de produto, no app do Instagram logado nela:
1. Perfil > menu ☰ (canto superior direito) > **Configurações e privacidade**.
2. **Tipo de conta e ferramentas** > **Mudar para conta profissional** > escolher **Empresa** > selecionar categoria > concluir.
3. Ainda em Tipo de conta e ferramentas (ou no aviso que aparece) > **Conectar ou criar Página do Facebook** > conectar à **Página do produto** que já está no Business (AssinaAgora, UseTokia, FreelanceGo, JetSend/SimplesMail, SimplesZap, Darkemail). Se não houver Página, criar.
4. Pronto: conta Comercial + vinculada à Página. A partir daí a API alcança.

> Dica: fazer isso logado em cada conta de produto (trocar de conta no seletor do Instagram).
