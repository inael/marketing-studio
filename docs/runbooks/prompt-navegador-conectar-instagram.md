# Prompt pro agente de navegador — conectar Instagram ao Marketing Studio

Cole o bloco abaixo inteiro num agente com controle do Chrome (Claude in Chrome,
browser-harness, Comet…), já logado no Facebook/Meta com a conta que administra a
Business Manager da IT Booster.

O agente termina o trabalho **dentro do midiaplay.net**: ele mesmo cola o token no
formulário da marca. O token não passa pelo chat nem por arquivo.

---

## PROMPT (copiar daqui pra baixo)

Você vai conectar uma conta do Instagram ao painel Marketing Studio
(https://midiaplay.net), usando a API oficial da Meta. Trabalhe com calma, uma
etapa por vez, e me diga o que está vendo antes de clicar em algo destrutivo.

Contexto: a Meta renomeia menus com frequência. Se um rótulo que eu citar não
existir, procure o equivalente mais próximo e me diga qual você usou, em vez de
desistir.

### ETAPA 1 — Conferir os pré-requisitos da conta

Abra https://business.facebook.com/settings e confirme os três pontos abaixo.
Se qualquer um falhar, **pare e me relate** — sem eles o resto não funciona.

1. Em "Contas" → "Contas do Instagram": a conta do Instagram que queremos
   publicar aparece na lista, e é do tipo **Comercial** ou **Criador**
   (não Pessoal).
2. Em "Contas" → "Páginas": existe uma Página do Facebook, e essa Página está
   **vinculada** à conta do Instagram acima.
3. Ambas (Página e Instagram) estão dentro da Business Manager da IT Booster —
   não numa conta pessoal solta.

Me diga: o @ da conta do Instagram, o nome da Página e se os três pontos passaram.

### ETAPA 2 — Criar o usuário do sistema e gerar o token

Ainda em https://business.facebook.com/settings:

1. Vá em "Usuários" → "Usuários do sistema" (em inglês: Users → System users).
2. Se já existir um usuário do sistema chamado algo como "marketing-studio",
   **use esse** e pule a criação. Senão clique em "Adicionar", nomeie
   `marketing-studio` e dê o papel **Admin**.
3. Com o usuário selecionado, clique em "Adicionar ativos" / "Assign assets" e
   atribua:
   - a **Página** da Etapa 1, com **controle total** (Full control / Gerenciar);
   - a **conta do Instagram** da Etapa 1, com controle total.
4. Clique em "Gerar novo token" / "Generate new token".
   - App: escolha o app da IT Booster que estiver na lista. Se aparecer mais de
     um, me diga os nomes antes de escolher.
   - Expiração: **Nunca** (Never), se a opção existir.
   - Marque exatamente estas cinco permissões:
     `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
     `pages_read_engagement`, `business_management`.
5. Gere e **copie o token para a área de transferência**. Ele começa com `EAA`.

IMPORTANTE: não escreva o token na sua resposta, não salve em arquivo e não
mostre em texto. Mantenha só na área de transferência para colar na Etapa 4.
Se em algum momento você precisar reconferir, gere um token novo em vez de
tentar recuperar o antigo.

Se a opção "Usuários do sistema" não existir, ou a Meta exigir verificação da
empresa que ainda não foi feita: **pare e me avise** — nesse caso vamos pelo
botão "Conectar" do painel, que é outro caminho.

### ETAPA 3 — Descobrir o ID numérico do Instagram

Abra https://developers.facebook.com/tools/explorer

1. Em "Meta App", escolha o mesmo app da Etapa 2.
2. No campo de token (canto superior direito), **cole o token** que você gerou.
3. No campo da requisição, apague o que estiver lá e digite exatamente:
   `me/accounts?fields=name,instagram_business_account{id,username}`
4. Clique em "Submit".

Na resposta JSON, ache o objeto cujo `instagram_business_account.username` é o @
da Etapa 1. Anote o `instagram_business_account.id` — é um número longo, começa
com `1784…` ou parecido. **Esse número pode aparecer na sua resposta**, ele não é
segredo.

Se a resposta vier vazia (`"data": []`) ou sem `instagram_business_account`,
me relate o JSON exato (sem o token) — quer dizer que a Página e o Instagram não
estão vinculados como esperado.

### ETAPA 4 — Salvar no painel

Abra https://midiaplay.net/marcas

1. Se pedir login, me avise — eu faço o login e devolvo o controle pra você.
2. Clique na marca correspondente ao @ do Instagram que você conectou.
3. Role até o bloco **Instagram** do formulário.
4. Preencha:
   - **IG User ID**: o número da Etapa 3.
   - **Token de acesso**: cole o token da Etapa 2 (campo de senha, vai aparecer
     como bolinhas — é o esperado).
5. Salve o formulário.
6. Volte para a marca e clique em **Verificar** no card do Instagram.

O resultado esperado é aparecer `@<usuario>` em verde junto com a foto de perfil.

### ETAPA 5 — Confirmar

Abra https://midiaplay.net/dashboard e olhe o painel "Conexões por marca".

Me responda com:

- O @ do Instagram e o nome da Página.
- O `instagram_business_account.id` (o número).
- O nome do app da Meta que você usou.
- O que o botão "Verificar" mostrou (texto exato, verde ou vermelho).
- Se o selo **IG** daquela marca no dashboard ficou verde com "✓" ou seguiu
  cinza com "○".
- Qualquer rótulo de menu que estivesse diferente do que eu descrevi.

**Não inclua o token na resposta.**

## FIM DO PROMPT

---

## O que fazer com o retorno

- Selo verde → a marca está pronta pra publicar. Caminho no painel:
  Posts → etapa "1 · Falta a imagem" → abrir o post → Gerar imagem → Aprovar →
  Publicar agora.
- Selo cinza mesmo depois de salvar → o token foi salvo mas `resolveIg` não
  achou; conferir se o IG User ID foi colado no campo certo.
- "Verificar" em vermelho → o texto do erro vem direto da Graph API e diz o que
  faltou (permissão, vínculo de Página, conta não-Business).

## Por que o token não passa pelo chat

O agente cola direto no formulário da marca, que grava em `brands.ig_token`.
Um token de usuário do sistema não expira: se vazar, vale até ser revogado à mão
em business.facebook.com. Menos lugares por onde ele passa, melhor.
