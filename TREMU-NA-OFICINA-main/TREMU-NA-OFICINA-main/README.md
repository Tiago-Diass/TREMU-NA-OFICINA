# TREMU NA OFICINA

Jogo de inclusão social em **React + JavaScript** que ensina e treina o
alfabeto manual da **Língua Gestual Portuguesa (LGP)**. O utilizador vê uma
palavra de quatro letras e tem de a soletrar com a mão à frente da câmara.
O reconhecimento corre **inteiramente no navegador** — não há servidores nem
APIs externas a serem chamadas durante o jogo.

## Como funciona

1. O modelo de mãos da MediaPipe (`hand_landmarker.task`) corre via WebAssembly
   no browser e devolve 21 pontos de referência da mão por *frame*.
2. Um classificador geométrico próprio (`src/lib/lgpAlphabet.js`) avalia
   ângulos das articulações e distâncias relativas para identificar a letra.
3. A letra fica "presa" quando se mantém o gesto durante ~14 *frames* — só
   aí avança no jogo, para evitar falsos positivos.

## Letras suportadas

Apenas sinais **estáticos** a uma mão: `A B C D F I L O U V W Y`.
Letras com movimento (J, Z) ficam fora desta versão.

## Banco de palavras

Está em [`src/lib/words.js`](src/lib/words.js). São ~25 palavras pt-PT de
quatro letras, todas formadas apenas pelas letras suportadas acima.

## Como correr

```bash
npm install
npm run dev
```

Os scripts `predev` / `prebuild` descarregam automaticamente:

- o modelo MediaPipe `hand_landmarker.task` para `public/models/` (≈7 MB,
  descarregado uma única vez);
- a *runtime* WASM da `@mediapipe/tasks-vision` para `public/wasm/`.

Depois do primeiro arranque, **a aplicação funciona offline**.

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173) e autorizar o acesso à
câmara.

## Build de produção

```bash
npm run build
npm run preview
```

A pasta `dist/` resultante pode ser servida por qualquer *static host*.

## Estrutura

```
src/
  App.jsx                 estado global do jogo
  main.jsx                bootstrap React
  styles.css              tema escuro acessível
  components/
    CameraView.jsx        câmara + canvas + loop de inferência
    GamePanel.jsx         palavra-alvo, pontuação, progresso
    AlphabetGuide.jsx     modal com descrição das letras
  lib/
    handTracker.js        carrega o HandLandmarker e gere a câmara
    lgpAlphabet.js        classificador geométrico + filtro de estabilidade
    words.js              banco de palavras + amostragem
scripts/
  download-model.js       descarrega modelo + copia WASM para /public
```

## Notas

- O reconhecimento é heurístico (sem treino de ML adicional). Funciona para
  utilizadores principiantes que façam os sinais de forma clara, com luz
  razoável e fundo neutro.
- O sistema é deliberadamente *stand-alone*: nenhum estado do utilizador é
  enviado para fora do dispositivo.
