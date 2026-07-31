# Encaminhar contato@<domínio do produto> → itbooster.global@gmail.com

Caixa central (decidido 2026-07-28): **itbooster.global@gmail.com**.
"Receber" e-mail não é o JetSend (só envia). Para receber, usamos **encaminhamento**.

## Grupos (a Hostinger só tem caixa em alguns domínios)

### Grupo A — SEM caixa de e-mail → ImprovMX (grátis, só troca MX)
Domínios: `freelancego.com.br`, `jetsend.com.br`, `usetokia.com`, `simpleszap.com`, `recapitule.com.br`.
- **Você (1x, ~1 min/domínio):** criar conta grátis em improvmx.com, adicionar cada domínio, e criar o alias
  `contato@dominio → itbooster.global@gmail.com` (ou catch-all `*`).
- **Eu (via API Hostinger):** setar os registros DNS de cada domínio:
  - MX: `mx1.improvmx.com` (prioridade 10) e `mx2.improvmx.com` (prioridade 20)
  - TXT SPF: `v=spf1 include:spf.improvmx.com ~all`
- Como não há e-mail hoje nesses domínios, trocar o MX **não quebra nada**.

### Grupo B — JÁ têm caixa Hostinger → NÃO trocar MX
Domínios: `itbooster.com.br`, `assinaagora.com.br`, `darkemail.school`.
- Trocar o MX aqui **quebraria** a caixa existente. Em vez disso: no painel de e-mail da Hostinger,
  criar **encaminhador** `contato@ → itbooster.global@gmail.com` (ou usar a caixa direto).
- ⚠️ `darkemail.school` está "não está funcionando" na Hostinger (precisa reconectar o domínio antes).

## STATUS 2026-07-31 — DNS aplicado (via API Hostinger, `tools/hostinger_dns.py`)
- MX ImprovMX (`10 mx1.improvmx.com`, `20 mx2.improvmx.com`) gravado na raiz dos 5 domínios do Grupo A. ✅
- SPF ImprovMX adicionado em freelancego / jetsend / simpleszap. usetokia e recapitule já tinham SPF do SES → não mexido (evitar SPF duplicado).
- **Falta só (Inael):** criar conta grátis no improvmx.com, adicionar os 5 domínios (a verificação é automática, o MX já está certo) e o alias `contato@ → itbooster.global@gmail.com`. Depois: enviar um e-mail de teste pra contato@freelancego.com.br e ver cair no Gmail.

## Ordem sugerida
1. Você confirma o método (ImprovMX) e cria a conta + aliases dos 5 domínios do Grupo A.
2. Eu rodo o script que seta MX+SPF nos 5 via API Hostinger (confirmo cada mudança).
3. ImprovMX valida (o MX já vai estar certo) e o encaminhamento começa a funcionar.
4. Grupo B: encaminhador no painel Hostinger (te guio); darkemail primeiro reconectar.

## Observação
Isso só **recebe**. Para **responder como** contato@dominio pelo Gmail (opcional, depois),
configura-se "Enviar e-mail como" no Gmail via SMTP (do JetSend ou de um SMTP do domínio).
