# contato@<domínio do produto> → itbooster.global@gmail.com

Caixa central: **itbooster.global@gmail.com**.

## DECISÃO (2026-07-31): usar NOSSA infra (Mailpit), não ImprovMX

O DarkEmail já recebe e-mail e **já encaminha pro Gmail** em produção. Vamos reusar essa engrenagem
em vez de um terceiro. (O MX ImprovMX que setei antes nos 5 domínios será **revertido**.)

### Como o recebimento funciona hoje (mapeado na VPS)
- Container **`email_receiver`** = **Mailpit** (`axllent/mailpit`), escutando **direto na porta 25** da
  internet (`0.0.0.0:25->1025`). É catch-all: recebe e-mail de qualquer domínio cujo MX aponte pra
  a VPS `72.61.135.214`. Não há Postfix/Haraka na frente.
- Mailpit dispara webhook → `POST /api/mailpit-webhook` (Vercel, projeto darkemail).
- O handler (`api/mailpit-webhook.js`):
  - endereço de temp-mail → guarda (Redis/Supabase) e mostra na UI;
  - **endereço reservado** (`SUPPORT_INBOUND_ADDRESSES`, hoje `support@`/`suporte@darkemail.school`)
    → **NÃO guarda**, **encaminha** pra `SUPPORT_EMAIL_TO` (default `itbooster.global@gmail.com`) +
    `SUPPORT_EMAIL_CC` (`suporte@itbooster.com.br`) via nosso `sendMail` (SES/JetSend), com
    **Reply-To = remetente original**.
- Defesa em profundidade: `api/emails.js` (linhas ~292-299) bloqueia **leitura** dos reservados.

## STATUS 2026-07-31 (tarde) — branch darkemail revisada + MERGEADA
A sessão Claude do projeto darkemail revisou minha branch, melhorou e **mergeou no master**
(`277b96d`; correções em `c615f42`):
- Env nova **`TEMPMAIL_DOMAINS`** protege o `darkemail.school` do forwarding (darkemail.school
  fica **fora** do nosso `contato@`, como recomendado).
- **502 em falha de forward** (sem perda silenciosa) + normalização de plus-tag.
- Ainda **inerte** sem as envs `CONTATO_*` → deploy seguro. Aguardando confirmação do deploy Vercel.
- `financeiro@darkemail.school` já pertence a um user externo real (não conflita com `contato@`).

**Decisão:** `darkemail.school` sai do nosso fluxo de `contato@` (tratado pelo time do darkemail).
Nosso escopo = domínios de produto SEM caixa própria. `contato@darkemail.school` fica pendente com eles.

**Ordem correta agora:** (1) deploy darkemail confirmado → (2) eu seto envs `CONTATO_DOMAINS` +
A record → (3) troco o MX. Nunca apontar MX antes do código estar no ar.

## Plano de implementação (ordem segura, sem quebrar o DarkEmail)

1. **A record** `inbound.itbooster.com.br → 72.61.135.214` (registro novo; não mexe em nada). Vira o
   host de MX.
2. **darkemail (código/env) ANTES do MX** — senão os `contato@` viram inbox público:
   - Adicionar os `contato@<domínio>` ao encaminhamento pro Gmail. Opção limpa: um ramo próprio no
     `mailpit-webhook.js` (assunto `[Contato <domínio>]`, sem CC de suporte, sem lógica de issue).
     Opção rápida: juntar na env `SUPPORT_INBOUND_ADDRESSES`.
   - **Bloquear reserva** dos localparts reservados na tela do DarkEmail (o cliente Pro escolhe alias
     `<nome>@darkemail.school`). Localizar o endpoint de reserva e barrar:
     `contato, suporte, support, admin, postmaster, no-reply, noreply, abuse, root, webmaster`.
     (Só afeta `darkemail.school`; os outros 7 domínios não têm reserva de alias por usuário.)
   - Deploy no Vercel + testar que um `contato@` de teste encaminha certo.
3. **Trocar o MX** dos domínios de produto: de ImprovMX → `inbound.itbooster.com.br` (via API Hostinger,
   `tools/hostinger_dns.py`). Domínios: freelancego.com.br, jetsend.com.br, usetokia.com, simpleszap.com,
   recapitule.com.br. (darkemail.school e assinaagora.com.br: ver Grupo B.)
4. **Testar:** enviar de fora pra `contato@freelancego.com.br` → cair em itbooster.global@gmail.com.
5. **Bônus / conserto:** o MX raiz de `darkemail.school` está na Hostinger (por isso `suporte@` não
   funciona). Reapontar pro Mailpit (`inbound.itbooster.com.br`) conserta o suporte E habilita
   `contato@darkemail.school`.

## Configuração manual no Gmail (itbooster.global@gmail.com) — opcional
- **Receber:** nada a fazer, o encaminhado chega. Dá pra criar **filtro/label por produto** (ex:
  assunto contém `[Contato jetsend]` → label "JetSend").
- **Responder como `contato@dominio`** (send-as): Gmail > Config > Contas e importação > "Enviar
  e-mail como" > adicionar `contato@dominio` com SMTP do JetSend/SES (host/porta/credenciais). Assim
  a resposta sai já como contato@ do produto. É opcional e manual.
- ⚠️ Um `@gmail.com` comum **não** pode ser o servidor de recebimento (MX) dos domínios; isso continua
  sendo o Mailpit. O Gmail só recebe o encaminhado e (opcional) envia-como.

## Reverter (se algo der errado)
- MX: `tools/hostinger_dns.py` regrava o valor anterior (hoje ImprovMX). Nada é destrutivo.
- darkemail: mudanças de env/código no Vercel têm rollback por deploy.
