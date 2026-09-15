# Reels IT Booster — 3 Reels 9:16 + 3 Posts Feed 1:1

> Spec de criativos pra Instagram Reels e Feed pra os 3 produtos IT Booster (UseTokia CHAT, UseTokia API, IT Booster Automação MPE). Formato UGC talking-head + split-screen + fullscreen system.

## Meta

**Objetivo**: 6 criativos publicáveis (3 vídeos 9:16 + 3 imagens 1:1) prontos pra rodar em Meta Ads Reels + Feed, substituindo os criativos anteriores que geraram leads desqualificados por falta de qualificação visual.

**Onde**: `marketing-studio/remotion/` (subprojeto isolado do Next.js). Renders finais em `marketing-studio/renders/`.

**Deadline**: iterativo. Primeiro post estático (feed) hoje pra validar design; depois 3 Reels em wave-2.

## Estrutura editorial de cada Reel (padrão lucasarrial + finscalebr/Gabriela Lima)

Duração-alvo: 22-28s. FPS: 30. Resolução: 1080x1920.

```
0-3s   HOOK           talking head fullscreen, statement forte
3-8s   SPLIT-A        50% topo = dor visual (celular, planilhas, notificações)
                      50% base = talking head continua
8-15s  FULLSCREEN     print do sistema/produto tomando tela toda + narração VO
15-22s SPLIT-B        50% topo = benefício/prova visual
                      50% base = talking head continua
22-28s CLOSE + CTA    close-up talking head + botão "Saiba mais" / código #IB
```

Legenda word-by-word Impact/Bebas Neue bold branca com contorno preto 8px, centralizada. Beat-sync nos cortes principais entre etapas.

## Distribuição das personas Higgsfield

| Reel | Produto | Persona | Vibe |
|---|---|---|---|
| Reel-01 | #IB01 UseTokia CHAT | **Karla** (executiva, blazer navy, cabelo ondulado) | autoridade elegante, "eu resolvi o problema das mil assinaturas" |
| Reel-02 | #IB02 UseTokia API | **Inael** (fundador, casual, camiseta) | autoridade tech, "sou dev, migrei minha stack em um sábado" |
| Reel-03 | #IB03 IT Booster Automação MPE | **Inael** (fundador IT Booster) | dono da marca falando com dono de negócio |

Voz: geração Higgsfield UGC talking (`ugc/talking_generated_character`) + áudio ElevenLabs sobreposto (já temos 3 tracks gerados em `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\`).

## Soundtrack

3 tracks stock royalty-free (Uppbeat / YouTube Audio Library):
- **Reel-01 (Tokia CHAT)**: lo-fi tech uplifting, 90-100 BPM, ambiente produtividade criativa
- **Reel-02 (Tokia API)**: minimal-punchy synth, 100-110 BPM, energia dev/build
- **Reel-03 (IT Booster MPE)**: drama-build cinematográfico, 85-95 BPM, "mudança de vida"

Beat-sync feito com `scripts/detect-beats.py` (librosa 1.0). Cortes de etapa (Hook→Split-A→Fullscreen→Split-B→Close) alinhados nos snares.

## Copy e narração (VO / caption sincronizada)

### Reel-01 UseTokia CHAT
- **Hook**: "Eu tava pagando 600 reais por mês em cinco assinaturas de IA."
- **Split-A dor**: (celular mostrando faturas ChatGPT R$100, Claude R$120, Gemini R$95, Perplexity R$105, Cursor R$180)
- **Fullscreen sistema**: preview UseTokia com dropdown modelos (GPT-5, Claude Opus, Gemini, Perplexity)
- **Split-B benefício**: "Uma assinatura de 89 reais me dá +100 IAs"
- **Close + CTA**: "UseTokia. Chama no zap #IB01."

### Reel-02 UseTokia API
- **Hook**: "Câmbio, spread, IOF, cartão gringo bloqueando. Fim."
- **Split-A dor**: (dashboard OpenAI + Anthropic + Google, valores em dólar)
- **Fullscreen sistema**: UseTokia API panel — 1 chave, dropdown com +100 modelos, NF-e destaque
- **Split-B benefício**: "1 chave, 100+ modelos, real com NF-e"
- **Close + CTA**: "UseTokia API. Migra num sábado. #IB02."

### Reel-03 IT Booster Automação MPE
- **Hook**: "Cliente mandou msg sábado. Ninguém viu."
- **Split-A dor**: (WhatsApp com msgs não respondidas, boletos vencidos, agenda vazia)
- **Fullscreen sistema**: painel automação IT Booster — agendamento, cobrança, atendimento
- **Split-B benefício**: "Automação sob medida. A partir de 5 mil, pra quem já tem faturamento."
- **Close + CTA**: "Fala com a IT Booster no zap. Diagnóstico gratuito. #IB03."

## Estrutura de posts feed 1:1 (1080x1080)

Cada post é uma composição estática renderizada como frame único (JPG). Feed feito pra "loop content" — mesmo criativo repostável e Meta Ads friendly.

### Feed-01 UseTokia CHAT
- Fundo: gradient escuro sutil (charcoal → dark)
- Persona Karla à esquerda (50%), tela do UseTokia à direita (50%) mostrando "+100 IAs"
- Texto grande topo: **"UMA ASSINATURA. +100 IAs."**
- Texto pequeno rodapé: `R$ 89/mês · NF-e · Suporte pt-BR`
- Logo IT Booster canto inferior direito

### Feed-02 UseTokia API
- Fundo: gradient azul-tech
- Persona Inael à esquerda (50%), painel API à direita (50%) — 1 chave visível
- Texto grande topo: **"1 CHAVE. +100 MODELOS. REAL."**
- Texto pequeno: `pay-as-you-go · NF-e · sem câmbio`
- Logo IT Booster

### Feed-03 IT Booster MPE
- Fundo: gradient warm (dourado sutil)
- Persona Inael + painel automação/dashboard à direita
- Texto grande topo: **"MAIS VENDAS. MENOS SUSTO."**
- Texto pequeno: `App sob medida · a partir de R$ 5 mil · Diagnóstico grátis`
- Logo IT Booster

## Paleta visual (theme-v2.ts)

```
Cores globais
  background:  #0A0A0A   (charcoal deep)
  fg-primary:  #FFFFFF
  fg-muted:    #B4B4B4
  accent-ib:   #39FF14   (verde signal IT Booster)
  accent-tokia:#7C3AED   (roxo Tokia - próximo do lilás Nubank)
  legenda-bg:  #000000cc (para caption bold com contorno)

Cores por produto
  ib01-tokia-chat: primary #7C3AED, glow #A855F7
  ib02-tokia-api : primary #06B6D4, glow #22D3EE
  ib03-itbooster : primary #39FF14, glow #FACC15

Fontes
  headings/caption: Bebas Neue (Impact-alike) 700
  body:             Inter 500/600
```

## Assets já disponíveis (input)

- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video1_tokia_chat.mp4` (rough Higgsfield)
- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video2_tokia_api.mp4`
- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video3_itbooster_mpe.mp4`
- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video1_tokia_chat.mp3` (voz Laila ElevenLabs)
- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video2_tokia_api.mp3` (voz Yuri)
- `C:\Users\inael-pc\AppData\Local\Temp\claude-criativos-sdr\video3_itbooster_mpe.mp3` (voz Gui Bruns)
- `C:\Users\inael-pc\Downloads\propaganda\*.jpeg` (referências finscalebr Gabriela Lima)

## Assets a produzir (Higgsfield MCP nesta sessão)

Por Reel:
- 1 talking head UGC ~28s do Persona (Karla ou Inael) usando `generate_video` com `ugc/talking_generated_character` — script narração em pt-BR
- 3 schematic UI cards (fullscreen scene do produto):
  - Reel-01: UseTokia CHAT dropdown modelos (Nano Banana Pro image)
  - Reel-02: UseTokia API panel com key (schematic api panel Remotion built-in)
  - Reel-03: dashboard IT Booster automação (schematic dashboard)

## Estrutura de código Remotion

```
remotion/
├── src/
│   ├── index.ts                            registerRoot
│   ├── Root.tsx                            registra 6 composições + carrega fontes
│   ├── theme-v2.ts                         constantes globais + por-produto
│   ├── anim/easings.ts                     easings compartilhados
│   ├── primitives/
│   │   ├── SplitScreen.tsx                 layout topo/base 50/50 vertical
│   │   ├── FullscreenScene.tsx             uma cena tomando 1080x1920
│   │   ├── TalkingHead.tsx                 wrapper de Video/Img c/ zoom/pan sutil
│   │   ├── BigCaption.tsx                  legenda Bebas bold word-by-word
│   │   ├── TypedText.tsx, MaskReveal.tsx, Cursor.tsx (standard)
│   │   └── LogoStamp.tsx                   logo IT Booster canto inferior
│   ├── scenes/
│   │   ├── ib01/{Hook,SplitA,Fullscreen,SplitB,Close}.tsx
│   │   ├── ib02/{Hook,SplitA,Fullscreen,SplitB,Close}.tsx
│   │   └── ib03/{Hook,SplitA,Fullscreen,SplitB,Close}.tsx
│   ├── masters/
│   │   ├── Reel01Master.tsx                composição de 22-28s IB01
│   │   ├── Reel02Master.tsx                IB02
│   │   ├── Reel03Master.tsx                IB03
│   │   ├── Feed01Master.tsx                composição estática IB01
│   │   ├── Feed02Master.tsx                IB02
│   │   └── Feed03Master.tsx                IB03
│   └── data/copy.ts                        strings de caption + narração
├── public/
│   ├── fonts/                              (fallback offline)
│   ├── logos/itbooster.svg
│   ├── talking/karla-ib01.mp4              gerado via Higgsfield MCP
│   ├── talking/inael-ib02.mp4
│   ├── talking/inael-ib03.mp4
│   ├── audio/ib01-vo.mp3                   ElevenLabs (já existe)
│   ├── audio/ib02-vo.mp3
│   ├── audio/ib03-vo.mp3
│   ├── audio/soundtrack-ib01.mp3           stock
│   ├── audio/soundtrack-ib02.mp3
│   └── audio/soundtrack-ib03.mp3
└── beats/
    ├── ib01.json                           librosa output
    ├── ib02.json
    └── ib03.json
```

## Composições registradas em Root.tsx

- Master vídeos: `Reel01-IB01`, `Reel02-IB02`, `Reel03-IB03` (1080x1920 @ 30fps)
- Master posts:  `Feed01-IB01`, `Feed02-IB02`, `Feed03-IB03` (1080x1080 @ 30fps, mas render de 1 frame)
- Debug per-scene: `Reel01-Hook`, `Reel01-SplitA`, ..., total 15 (5 cenas × 3 produtos)

## Aceites

- [ ] Cada Reel roda em 22-28s, corte principal em snare, sem tempo morto
- [ ] Talking head visível ≥60% da duração (não apagar por muito tempo com fullscreen)
- [ ] Caption legível em preview do celular (fonte ≥ 60px, contraste bg)
- [ ] Feed 1:1 legível em preview do IG grid (thumbnail)
- [ ] Nada de em-dash em caption (regra IT Booster)
- [ ] CTA com código #IB01/02/03 em todo Reel e Feed
- [ ] Persona reconhecível (rosto sempre nítido, cor natural)

## Pendências antes de codar cenas

- [ ] Aprovação da distribuição de personas (Karla × Inael × Inael)?
- [ ] Baixar 3 soundtracks stock e rodar `detect-beats.py`
- [ ] Gerar 3 talking heads via Higgsfield (`generate_video` UGC talking)
- [ ] Copiar áudios ElevenLabs pra `remotion/public/audio/`
- [ ] Aprovação do spec pelo Inael

## Riscos

- **Higgsfield UGC talking-generated pode ter sync labial ruim**: mitigação = mostrar rosto ~60% mas fazer cortes pra sistema/split-screen nos momentos de fala mais longa; reforçar caption bold sincronizada como âncora visual.
- **Beat-sync com soundtrack novo pode desalinhar VO ElevenLabs**: mitigação = 3 tracks separadas por reel + VO como stem independente (não mixado ao track), com ajuste de fade-in do soundtrack sob a fala.
- **Logo IT Booster não temos SVG oficial**: mitigação = criar wordmark simples "IT BOOSTER" bold em Bebas Neue como stamp.
