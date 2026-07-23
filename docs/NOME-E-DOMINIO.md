# Nome do produto e domínios — pesquisa de mercado (2026)

Este documento apoia a **decisão de marca e de repo GitHub** antes do registro final. **Não substitui** consulta a registrador (Registro.br, Namecheap, etc.) nem busca de marca no INPI.

---

## 1. O que o mercado já saturated

| Padrão / termo | Observação |
|----------------|------------|
| **“Command Center”** | Nome de *feature* em várias suites (SALESmanago, Adobe Marketo, Salesforce, agências “AI Command Centre”). Ruim como marca única — confunde SEO e posicionamento. |
| **“Martech” sozinho** | Palavra genérica do setor; no Brasil há agências e hubs ([Martechify](https://martechify.com.br/), M.Martech, “Conteúdo Martech”, etc.). Risco de confusão se o nome for só “Martech X”. |
| **“Marketing OS”** | Vários produtos usam “X OS” (ex.: conteúdo tipo “Instagram OS” como infoproduto). “Marketing OS” é descritivo, não distintivo; bom como slogan, fraco como marca registrável. |
| **Ferramentas Instagram-first** | Ex.: [Inrō](https://www.producthunt.com/products/inro) (DM/automação Instagram), etc. — nicho sobreposto parcialmente; diferenciar por **multi-canal + CRM + stack próprio**. |

**Conclusão:** vale uma marca **composta e própria** (evitar termos que gigantes já usam como nome de módulo).

---

## 2. Critérios para o nome (este projeto)

1. **Pronunciável** em PT-BR e razoável em EN (SaaS e docs).
2. **Domínio**: preferir `.com.br` (marca local) + espelho `.com` ou `.io` se planejar cliente internacional.
3. **Conexão opcional** com ecossistema **IT Booster / Toolpad** (subdomínio já existe: `*.toolpad.cloud`) — pode ser **fase 1 técnica** sem novo domínio pago.
4. **GitHub**: nome curto, sem espaços, `kebab-case` (ex.: `boost-deck`).
5. Evitar **travas**: palavras ultragenéricas (“marketing”, “social” sozinhas como marca).

---

## 3. Checagem DNS preliminar (não é “disponível para compra”)

Feita em **2026-04-18** com `Resolve-DnsName` (Windows): ausência de registro **A** sugere que **pode** estar livre, mas domínio pode existir sem A (uso futuro, proteção). Domínios **com DNS** presumem ocupação ou uso ativo.

| Domínio | Resultado rápido |
|---------|------------------|
| `boostflow.io` | Tem registro DNS (provável ocupado/uso) |
| `booststack.io` | Tem registro DNS |
| `pulsestack.io` | Tem registro DNS |
| `operativa.com.br` | Tem registro DNS (ocupado) |
| `boostdeck.io`, `campiq.com`, `campiq.com.br`, `boosthub.com.br`, `gravitar.io`, `toolpadlabs.com`, `pilarmkt.com.br`, etc. | Sem A no teste → **verificar no registrador** |

**Ação obrigatória:** no Registro.br ou seu registrador preferido, pesquisar cada candidato e o preço; opcionalmente INPI para classe de software/SaaS.

---

## 4. Candidatos recomendados (lista curta)

### A) **BoostDeck** (favorito técnico)

| | |
|--|--|
| **Significado** | “Boost” alinha mentalmente a **IT Booster**; “Deck” sugere **pauta/calendário/cartas** (conteúdo organizado). |
| **Repo sugerido** | `boost-deck` ou `boostdeck` |
| **Prós** | Distintivo; não é genérico em martech; bom para README e domínio curto. |
| **Contras** | Verificar homônimos internacionais (“boost deck” em jogos); validar `.com` e `.com.br`. |

### B) **CampIQ**

| | |
|--|--|
| **Significado** | Campanhas + “IQ” (inteligência / IA). |
| **Repo sugerido** | `campiq` |
| **Prós** | Curto; fácil de lembrar. |
| **Contras** | Leitura “Camp IQ” vs “Cam piq”; checar confusão fonética. |

### C) **Pilar** (só com segundo termo)

| | |
|--|--|
| **Exemplos** | PilarGrid, Pilarmkt — “pilar de conteúdo” é linguagem comum em marketing BR. |
| **Repo** | `pilar-grid`, etc. |
| **Contras** | “Pilar” sozinho é genérico; precisa composto. |

### D) Uso interno **sem marca nova** (rápido)

| | |
|--|--|
| **Opção** | Subdomínio `marketing.toolpad.cloud` ou `boostdeck.toolpad.cloud` + repo `marketing-os` ou `toolpad-marketing`. |
| **Prós** | Zero custo de domínio até validar MVP; coerente com infra já citada. |
| **Contras** | Menos “produto vendável” na fachada até existir domínio próprio. |

---

## 5. Recomendação para decidir agora

1. **Se a prioridade é velocidade de código:** criar o repositório como **`boost-deck`** (ou `campiq`) e domínio **depois** do registro confirmado.
2. **Se a prioridade é marca + landing pública:** registrar **BoostDeck** ou **CampIQ** em `.com.br` (e `.com` se disponível) **antes** de divulgar.
3. Evitar repo com nome definitivamente ruim (`marketing` no GitHub é termo demais); preferir nome **marca**.

**Proposta do autor do doc:** trabalhar o produto internamente como **BoostDeck**, repo **`boost-deck`**, e domínio **`boostdeck.com.br` + `boostdeck.io`** sujeito a confirmação no registrador.

---

## 6. Próximos passos

- [ ] Você confirma 1 nome da lista (ou variação).
- [ ] Pesquisa de disponibilidade no Registro.br / Namecheap.
- [ ] (Opcional) Escritório ou INPI para viabilidade de registro de marca.
- [ ] Criar repositório GitHub com o nome `kebab-case` escolhido.
- [ ] Atualizar `PLANO-PRODUTO.md` com nome comercial final.

---

*Atualizado: 2026-04-18*
