# Bios (sem emoji) + contato + prompts p/ Chrome

Contato (mudança 2026-07-28): cada produto usa **contato@ do próprio domínio**, não o da IT Booster.
- Telefone/WhatsApp: **+55 61 99119-6730** (confirmar o número).
- Regra de bio: termina com **"Um produto IT Booster"** (menos a conta da própria IT Booster). Máx 150 caracteres, sem emoji.

### E-mail de contato por conta
| Conta | contato@ | Caixa na Hostinger? |
|---|---|---|
| @itboosterglobal | contato@itbooster.com.br | sim |
| @freelancego2026 | contato@freelancego.com.br | não → forwarding |
| @jetsend2026 | contato@jetsend.com.br | não → forwarding |
| @usetokia | contato@usetokia.com | não → forwarding |
| @simpleszap | contato@simpleszap.com | não → forwarding |
| @recapitule2026 | contato@recapitule.com.br | não → forwarding |
| @assinaagora | contato@assinaagora.com.br | sim |
| @dark.email | contato@darkemail.school | sim (mas "não está funcionando", corrigir) |

> "Receber" e-mail ≠ JetSend. JetSend só **envia** (SES). Para **receber** contato@ nos domínios sem caixa,
> o caminho é **encaminhamento (forwarding)** grátis (Cloudflare Email Routing ou ImprovMX) → cai numa
> caixa central. Precisa configurar DNS (MX + TXT) por domínio.

## Bios

| Conta (@) | Bio | Site |
|---|---|---|
| @itboosterglobal | Software sob medida, IA e automação que aceleram suas vendas. Brasília/DF. Fale com a gente. | itbooster.com.br |
| @freelancego2026 | Marketplace de freelancers do Brasil. IA no briefing e escrow via Pix. Taxa 5-8%. Um produto IT Booster. | freelancego.com.br |
| @jetsend2026 | E-mail transacional para desenvolvedores. API tipo Resend, em reais e com nota fiscal. Um produto IT Booster. | jetsend.com.br |
| @usetokia | Mais de 100 IAs numa conta só, em reais e com nota fiscal. ChatGPT, Claude, Gemini e mais. Um produto IT Booster. | usetokia.com |
| SimplesZap (@?) | WhatsApp para escalar sem virar caos. API, webhooks e automações, sem cobrança por mensagem. Um produto IT Booster. | simpleszap.com |
| Darkemail (@?) | E-mail temporário grátis em 1 clique. Sem spam na sua caixa real. Um produto IT Booster. | darkemail.school |
| AssinaAgora (@?) | Assinatura eletrônica com validade jurídica. Rápido, seguro e sem papel. Um produto IT Booster. | assinaagora.com |
| Recapitule (@?) | Sua reunião vira resumo e tarefas na hora. Meet, Zoom e Teams, sem bot na chamada. Um produto IT Booster. | recapitule.com.br |

## PROMPT p/ Chrome — aplicar bio (um por conta, no instagram.com)
Troque HANDLE, BIO e SITE conforme a tabela.
```
No instagram.com, logado na conta @HANDLE, abra "Editar perfil". No campo Bio, apague o conteúdo atual e cole exatamente: BIO. No campo Site/Website, cole: SITE. Salve e confirme que salvou. Não use emojis. Se aparecer opção de contato profissional na web, defina e-mail contato@itbooster.com.br; se não aparecer, me avise.
```
Exemplo preenchido (FreelanceGo):
```
No instagram.com, logado na conta @freelancego2026, abra "Editar perfil". No campo Bio, apague o conteúdo atual e cole exatamente: Marketplace de freelancers do Brasil. IA no briefing e escrow via Pix. Taxa 5-8%. Um produto IT Booster. No campo Site/Website, cole: freelancego.com.br. Salve e confirme.
```

## PROMPT p/ Chrome — adicionar as contas que faltam (Business Suite)
```
No Meta Business Suite do portfólio "It Booster Global" > Configurações do negócio.
1) Contas > "Contas do Instagram" > "Adicionar" > "Conectar sua conta do Instagram": conecte, uma por vez, os Instagrams que ainda não estão na lista (SimplesZap, Darkemail, AssinaAgora, Recapitule). Faça login em cada uma.
2) Contas > "Páginas": se não existir Página do "Recapitule", crie uma Página de empresa chamada Recapitule (categoria: Software) e adicione ao portfólio.
3) Para cada produto, abra a Página dele e vincule a conta de Instagram correspondente (Instagram vinculado).
Ao final, liste: quais Instagrams foram adicionados e quais ficaram vinculados a quais Páginas.
```

## Prompts preenchidos por conta (bio + site) — colar no Chrome, um por vez
Cada um precisa estar **logado naquela conta** no instagram.com.

**@freelancego2026**
```
No instagram.com logado na conta @freelancego2026, abra "Editar perfil". No campo Bio, apague o atual e cole exatamente: Marketplace de freelancers do Brasil. IA no briefing e escrow via Pix. Taxa 5-8%. Um produto IT Booster. No campo Site, cole: freelancego.com.br. Salve e confirme. Sem emojis.
```
**@jetsend2026**
```
No instagram.com logado na conta @jetsend2026, abra "Editar perfil". Bio (exata): E-mail transacional para desenvolvedores. API tipo Resend, em reais e com nota fiscal. Um produto IT Booster. Site: jetsend.com.br. Salve. Sem emojis.
```
**@usetokia**
```
No instagram.com logado na conta @usetokia, abra "Editar perfil". Bio (exata): Mais de 100 IAs numa conta só, em reais e com nota fiscal. ChatGPT, Claude, Gemini e mais. Um produto IT Booster. Site: usetokia.com. Salve. Sem emojis.
```
**@simpleszap**
```
No instagram.com logado na conta @simpleszap, abra "Editar perfil". Bio (exata): WhatsApp para escalar sem virar caos. API, webhooks e automações, sem cobrança por mensagem. Um produto IT Booster. Site: simpleszap.com. Salve. Sem emojis.
```
**@dark.email**
```
No instagram.com logado na conta @dark.email, abra "Editar perfil". Bio (exata): E-mail temporário grátis em 1 clique. Sem spam na sua caixa real. Um produto IT Booster. Site: darkemail.school. Salve. Sem emojis.
```
**@assinaagora**
```
No instagram.com logado na conta @assinaagora, abra "Editar perfil". Bio (exata): Assinatura eletrônica com validade jurídica. Rápido, seguro e sem papel. Um produto IT Booster. Site: assinaagora.com. Salve. Sem emojis.
```
**@recapitule2026**
```
No instagram.com logado na conta @recapitule2026, abra "Editar perfil". Bio (exata): Sua reunião vira resumo e tarefas na hora. Meet, Zoom e Teams, sem bot na chamada. Um produto IT Booster. Site: recapitule.com.br. Salve. Sem emojis.
```
**@itboosterglobal**
```
No instagram.com logado na conta @itboosterglobal, abra "Editar perfil". Bio (exata): Software sob medida, IA e automação que aceleram suas vendas. Brasília/DF. Fale com a gente. Site: itbooster.com.br. Salve. Sem emojis.
```

## Contato (botões) — pelo app, por conta
Editar perfil > Opções de contato > e-mail **contato@ do próprio domínio** (ver tabela acima) + telefone +55 61 99119-6730.
