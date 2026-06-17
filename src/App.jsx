import React, { useState, useRef, useMemo, useCallback } from "react";

import CameraView from "./components/CameraView.jsx";
import GamePanel from "./components/GamePanel.jsx";
import AlphabetGuide from "./components/AlphabetGuide.jsx";

import { pickRandomWord } from "./lib/words.js";

const REQUIRED_FRAMES = 14;

function createChallenge(previousWords) {
  const [word, hint] = pickRandomWord(previousWords);

  return {
    answer: word,
    clue: hint,
    chars: [...word]
  };
}

export default function App() {
  const usedWords = useRef([]);

  const [playing, setPlaying] = useState(false);

  const [challenge, setChallenge] = useState(() =>
    createChallenge([])
  );

  const [currentChar, setCurrentChar] = useState(0);

  const [points, setPoints] = useState(0);

  const [completedWords, setCompletedWords] = useState(0);

  const [detection, setDetection] = useState({
    letter: null,
    confidence: 0,
    progress: 0
  });

  const [guideVisible, setGuideVisible] = useState(false);

  const targetLetter = useMemo(
    () => challenge.chars[currentChar],
    [challenge, currentChar]
  );

  const loadNextWord = useCallback(() => {
    usedWords.current = [
      ...usedWords.current,
      challenge.answer
    ].slice(-20);

    setChallenge(createChallenge(usedWords.current));
    setCurrentChar(0);
  }, [challenge]);

  const nextStep = useCallback(() => {
    const isLastLetter =
      currentChar >= challenge.chars.length - 1;

    if (!isLastLetter) {
      setCurrentChar((value) => value + 1);
      setPoints((value) => value + 10);
      return;
    }

    setPoints((value) => value + 25);
    setCompletedWords((value) => value + 1);

    loadNextWord();
  }, [currentChar, challenge, loadNextWord]);

  const skipWord = useCallback(() => {
    loadNextWord();
  }, [loadNextWord]);

  const handleRecognition = useCallback(
    (result) => {
      setDetection(result);

      if (
        result.committed &&
        result.committed === targetLetter
      ) {
        nextStep();
      }
    },
    [targetLetter, nextStep]
  );

  if (!playing) {
    return (
      <div className="splash">
        <div className="splash-inner">

          <div className="splash-logo">
            <span className="splash-g">TREMU</span>
            <span className="splash-rest">NA OFICINA</span>
          </div>

          <p className="splash-sub">
            Aprende o alfabeto da Língua Gestual Portuguesa jogando
          </p>

          <div className="splash-how">
            <div className="how-step">
              <span className="how-num">1</span>
              <span>Recebe uma palavra para completar</span>
            </div>

            <div className="how-step">
              <span className="how-num">2</span>
              <span>Mostra cada gesto à câmara</span>
            </div>

            <div className="how-step">
              <span className="how-num">3</span>
              <span>Espera pela confirmação da letra</span>
            </div>
          </div>

          <div className="splash-actions">
            <button
              className="btn-start"
              onClick={() => setPlaying(true)}
            >
              Iniciar
            </button>

            <button
              className="btn-guide"
              onClick={() => setGuideVisible(true)}
            >
              Guia LGP
            </button>
          </div>

          <p className="splash-note">
            Todo o processamento ocorre localmente no dispositivo
          </p>

        </div>

        {guideVisible && (
          <AlphabetGuide
            onClose={() => setGuideVisible(false)}
          />
        )}
      </div>
    );
  }

  return (
    <main className="game-shell">

      <header className="hud-top">

        <button
          className="hud-btn"
          onClick={() => setGuideVisible(true)}
        >
          ?
        </button>

        <div className="hud-score">
          <span className="hud-score-val">
            {points}
          </span>
          <span className="hud-score-label">
            pts
          </span>
        </div>

        <div className="hud-streak">
          {completedWords > 0 ? (
            Array.from({
              length: Math.min(completedWords, 5)
            }).map((_, index) => (
              <span
                key={index}
                className="hud-star"
              >
                ★
              </span>
            ))
          ) : (
            <span className="hud-streak-empty">
              0 palavras
            </span>
          )}
        </div>

        <button
          className="hud-btn"
          onClick={skipWord}
        >
          »
        </button>

      </header>

      <CameraView
        target={targetLetter}
        holdFrames={REQUIRED_FRAMES}
        recognised={detection}
        onRecognition={handleRecognition}
      />

      <GamePanel
        word={challenge.answer}
        hint={challenge.clue}
        letterIndex={currentChar}
        recognised={detection}
      />

      {guideVisible && (
        <AlphabetGuide
          onClose={() => setGuideVisible(false)}
        />
      )}

    </main>
  );
}