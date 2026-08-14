# Marketing Studio — Guia de uso

App: https://midiaplay.net · Login: itbooster.global@gmail.com

> Se aparecer "não autenticado" em qualquer tela, **saia e entre de novo**. Havia
> um bug (o botão "Sair" se auto-disparava e derrubava a sessão). Já corrigido —
> um único re-login resolve.

---

## 1. Os 3 jeitos de criar um post

Na tela **Criar** os três caminhos ficam explicados no topo:

1. **Manual** — você escreve a legenda e sobe a imagem (botão "+ imagem").
2. **Com auxílio da IA** — no formulário:
   - `✦ Gerar com IA` escreve a legenda no tom de voz da marca;
   - o campo **"Ou gerar a imagem com IA"**: você descreve a imagem, escolhe o
     modelo e clica **Gerar**. (Hoje a geração de imagem depende de crédito na
     Higgsfield — ver Status abaixo.)
3. **Sugestões do time** — o card "Sugestões do time →" leva pra tela **Sugestões**.

## 2. Fluxo de aprovação (vale pra todos os caminhos)

```
criar/aceitar  →  RASCUNHO  →  Aprovar  →  Publicar agora  (vai pro Instagram)
                                        →  Agendar          (publica no horário)
```

- **Salvar rascunho**: guarda sem publicar.
- **Agendar**: publica na data/hora que você escolher.
- **Auto-agendar**: encaixa no próximo horário fixo da marca (defina em Marcas →
  Horários fixos).
- **Publicar agora**: envia pro Instagram na hora.

Tudo aparece em **Posts**, onde você filtra por marca e por status e aprova/publica.

## 3. Sugestões do time (IA)

Tela **Sugestões** → escolha a marca → **Gerar sugestões**. O time de agentes
(3 analistas, cada um com um modelo e uma persona diferentes) lê as **notícias**
(feeds RSS) e os **concorrentes** (posts que mais engajaram) e propõe:

- **3 ideias a partir das notícias**
- **3 ideias a partir dos concorrentes**

Em cada card: **Aceitar e criar rascunho**. Depois é só aprovar em Posts.

**Gestor**: clique em **Ativar gestor** — ele revisa as ideias, escolhe as
melhores, sugere ajustes e dá um feedback. Botão **Refazer com o feedback** manda
o time reescrever.

As fontes (RSS e concorrentes) de cada marca ficam em **Marcas → (marca) →
Fontes de conteúdo**. Já vêm pré-configuradas; edite/adicione à vontade.

## 4. Piloto automático (opcional — em Config)

Ligue em **Config → Automação**:

- **Sugestões automáticas (8h)**: todo dia às 8h o time gera até 3 rascunhos por
  marca. Você abre Posts e só aprova. **Não publica nada sozinho.**
- **Gestor aprova e publica (9h)**: se às 9h você não aprovou, o gestor escolhe o
  melhor rascunho do dia **que já tenha imagem** e publica. Rascunhos sem imagem
  ficam esperando você.

Os posts criados pela automação aparecem em Posts com o selo **✦ time**.
Ambos os interruptores começam **desligados** — nada roda sem você ligar.

## 5. Conectar contas (Instagram / LinkedIn)

Em **Marcas → (marca) → Conexões**:

- **Conectar** (botão preto) abre o login da rede num popup/página (OAuth) e você
  escolhe a conta — sem copiar token.
- **ou colar token** — alternativa manual (cola o token e o ID direto).

Para o **Conectar (OAuth)** funcionar, o app no Meta/LinkedIn precisa autorizar a
URL de retorno (uma vez só):

- **Instagram/Facebook** → no app do Meta, em *Facebook Login → Settings*, incluir
  em **Valid OAuth Redirect URIs**:
  `https://midiaplay.net/api/connections/instagram/callback`
- **LinkedIn** → no app do LinkedIn, em *Auth → Authorized redirect URLs*:
  `https://midiaplay.net/api/connections/linkedin/callback`

Enquanto isso não estiver liberado, use **"ou colar token"** (funciona hoje).

> Hoje todas as marcas usam a conta **@itboosterglobal** (token único de env).
> Ao conectar cada produto ao seu próprio Instagram, ele passa a publicar na conta
> certa e a foto do card vira a foto real daquele perfil.

## 6. Publicar no Instagram — passo a passo

1. Login em midiaplay.net.
2. **Criar** → escolha a marca → monte o post (imagem + legenda) por um dos 3
   caminhos.
3. **Salvar rascunho** (ou já **Publicar agora**).
4. Em **Posts**, no rascunho: **Aprovar** → **Publicar** (ou **Agendar**).
5. Publicado, o post ganha o link **Ver** (abre no Instagram).

Requisito: a marca precisa de uma conta **Instagram Business** vinculada a uma
Página do Facebook (a @itboosterglobal já está).

## 7. Publicar no LinkedIn

- **Conectar a conta**: pronto (OAuth + "colar token"), falta só liberar a URL de
  retorno no app (seção 5).
- **Publicar de fato**: depende da LinkedIn aprovar o produto **Community
  Management API** no app (revisão deles). Enquanto não aprovarem, o LinkedIn
  publica retorna 403. Por isso a publicação no LinkedIn entra numa próxima etapa,
  após a aprovação.

---

## Status honesto de cada item

| Item | Status |
|---|---|
| Login / sessão | ✅ Corrigido. Re-logar uma vez. |
| Subir imagem / criar post | ✅ Funciona (depois do re-login). |
| Legenda com IA | ✅ Funciona (gateway UseTokia). |
| **Gerar imagem com IA** | ⚠️ Campo pronto, mas a Higgsfield exige crédito pago na API (o plano web é só MCP). Alternativa: subir imagem manual, ou gerar via MCP e mandar pra Biblioteca. |
| Sugestões do time (3+3) | ✅ Funciona e foi testado. |
| Gestor (revisar/escolher/feedback) | ✅ Funciona. |
| Automação 8h (rascunhos) | ✅ Testada — gerou 24 rascunhos reais. Ligar em Config. |
| Automação 9h (gestor publica) | ✅ Pronta; só publica rascunho **com imagem** (auto-publicar exige arte). |
| Foto de perfil no card | ✅ Puxada (botão "Atualizar fotos"). |
| Publicar no Instagram | ✅ Pipeline pronto; falta você aprovar o 1º post real. |
| Conectar IG/LinkedIn por clique | ⚙️ Precisa liberar a URL de retorno no Meta/LinkedIn (seção 5). "Colar token" já funciona. |
| **Publicar no LinkedIn** | ⛔ Bloqueado na aprovação do Community Management API pela LinkedIn. |
| Vídeo com voz (ElevenLabs) | ⏭️ v2 (montagem de vídeo não roda na nossa VPS). |
| Tendências do X/Twitter | ⏭️ Depende de API paga do X. |
