import React, { useCallback, useRef, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import GamePanel from './components/GamePanel.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';
import { pickRandomWord } from './lib/words.js';

const HOLD_FRAMES = 14; // Número de frames que o gesto tem de ser mantido para ser aceite (ajusta conforme necessário)

export default function App() {
  const [started, setStarted] = useState(false); // Estado para controlar se o jogo começou
  const [round, setRound] = useState(() => newRound([])); // Estado para a palavra atual, dica e letras
  const [letterIndex, setLetterIndex] = useState(0); // Estado para a letra atual dentro da palavra
  const [score, setScore] = useState(0); // Estado para a pontuação do jogador
  const [solved, setSolved] = useState(0); // Estado para contar quantas palavras foram resolvidas na sequência atual
  const [recognised, setRecognised] = useState({ letter: null, confidence: 0, progress: 0 }); // Estado para a letra reconhecida atualmente e sua confiança/progresso
  const [showGuide, setShowGuide] = useState(false); // Estado para controlar a visibilidade do guia de gestos
  const historyRef = useRef([]); // Ref para manter um histórico das palavras já usadas, evitando repetições

  // Função para iniciar uma nova rodada, escolhendo uma palavra aleatória que ainda não foi usada
  function newRound(history) {
    const [word, hint] = pickRandomWord(history);
    return { word, hint, letters: word.split('') };
  }

  // Função para avançar para a próxima letra ou palavra, atualizando a pontuação e o histórico
  const advance = useCallback(() => {
    if (letterIndex + 1 < round.letters.length) {
      setLetterIndex((i) => i + 1);
      setScore((s) => s + 10);
    } else {
      setScore((s) => s + 25);
      setSolved((s) => s + 1);
      historyRef.current = [...historyRef.current, round.word].slice(-20);
      setRound(newRound(historyRef.current));
      setLetterIndex(0);
    }
  }, [letterIndex, round]);

  // Função para saltar a palavra atual, adicionando-a ao histórico e iniciando uma nova rodada
  const skip = useCallback(() => {
    historyRef.current = [...historyRef.current, round.word].slice(-20);
    setRound(newRound(historyRef.current));
    setLetterIndex(0);
  }, [round]);

  // A letra alvo para o gesto atual é determinada pela letraIndex dentro da palavra da rodada
  const target = round.letters[letterIndex];

  // Função chamada quando a câmara reconhece um gesto, atualizando o estado de reconhecimento e avançando se o gesto estiver correto
  const onRecognition = useCallback((info) => {
    setRecognised(info);
    if (info.committed && info.committed === target) advance();
  }, [advance, target]);

  // Se o jogo ainda não começou, mostra a tela de início com instruções e opção para ver o guia de gestos
  if (!started) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-logo">
            <span className="splash-g">G</span>
            <span className="splash-rest">estos</span>
          </div>
          <p className="splash-sub">Aprende o alfabeto da Língua Gestual Portuguesa jogando</p>
          <div className="splash-how">
            <div className="how-step"><span className="how-num">1</span><span>Aparece uma palavra de 4 letras</span></div>
            <div className="how-step"><span className="how-num">2</span><span>Faz o gesto de cada letra à câmara</span></div>
            <div className="how-step"><span className="how-num">3</span><span>Mantém firme até a letra acender</span></div>
          </div>
          <div className="splash-actions">
            <button className="btn-start" onClick={() => setStarted(true)}>Começar a jogar</button>
            <button className="btn-guide" onClick={() => setShowGuide(true)}>Ver gestos LGP</button>
          </div>
          <p className="splash-note">Câmara usada só no teu dispositivo — nenhum dado é enviado</p>
        </div>
        {showGuide && <AlphabetGuide onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  return (
    <div className="game-shell">
      {/* HUD do topo */}
      <div className="hud-top">
        <button className="hud-btn" onClick={() => setShowGuide(true)} title="Ver gestos">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </button>
        <div className="hud-score">
          <span className="hud-score-val">{score}</span>
          <span className="hud-score-label">pts</span>
        </div>
        <div className="hud-streak">
          {Array.from({ length: Math.min(solved, 5) }).map((_, i) => (
            <span key={i} className="hud-star">★</span>
          ))}
          {solved === 0 && <span className="hud-streak-empty">0 palavras</span>}
        </div>
        <button className="hud-btn" onClick={skip} title="Saltar palavra">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      {/* Vista da câmara, onde o jogador faz os gestos e recebe feedback visual sobre o reconhecimento */}
      <CameraView
        target={target}
        holdFrames={HOLD_FRAMES}
        onRecognition={onRecognition}
        recognised={recognised}
      />

      {/* Painel inferior com a palavra, dica e letra atual, além do guia de gestos quando solicitado */}
      <GamePanel
        word={round.word}
        hint={round.hint}
        letterIndex={letterIndex}
        recognised={recognised}
      />

      {showGuide && <AlphabetGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
