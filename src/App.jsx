import React, { useState, useRef, useCallback } from "react";

import CameraView from "./components/CameraView.jsx";
import GamePanel from "./components/GamePanel.jsx";
import AlphabetGuide from "./components/AlphabetGuide.jsx";

import { pickRandomWord, scoreGuess } from "./lib/words.js";

const REQUIRED_FRAMES = 14;
const MAX_ATTEMPTS = 6;

function createRound(previousWords) {
  const [word, hint] = pickRandomWord(previousWords);

  return {
    answer: word,
    clue: hint,
    length: word.length
  };
}

function emptyGuess(length) {
  return new Array(length).fill('');
}

export default function App() {
  const usedWords = useRef([]);

  const [playing, setPlaying] = useState(false);

  const [round, setRound] = useState(() => createRound([]));

  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(() =>
    emptyGuess(round.length)
  );
  const [currentPos, setCurrentPos] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | won | lost

  const [points, setPoints] = useState(0);
  const [completedWords, setCompletedWords] = useState(0);

  const [lockKey, setLockKey] = useState(0);

  const [detection, setDetection] = useState({
    letter: null,
    confidence: 0,
    progress: 0
  });

  const [guideVisible, setGuideVisible] = useState(false);

  const attemptsLeft = MAX_ATTEMPTS - guesses.length;

  const loadNextWord = useCallback(() => {
    usedWords.current = [
      ...usedWords.current,
      round.answer
    ].slice(-20);

    const next = createRound(usedWords.current);

    setRound(next);
    setGuesses([]);
    setCurrentGuess(emptyGuess(next.length));
    setCurrentPos(0);
    setStatus("playing");
    setLockKey((value) => value + 1);
  }, [round]);

  const skipWord = useCallback(() => {
    loadNextWord();
  }, [loadNextWord]);

  const submitGuess = useCallback(
    (letters) => {
      const guessWord = letters.join("");
      const colors = scoreGuess(guessWord, round.answer);

      const greens = colors.filter((c) => c === "green").length;
      const yellows = colors.filter((c) => c === "yellow").length;

      setPoints((value) => value + greens * 10 + yellows * 3);

      setGuesses((prev) => [
        ...prev,
        { letters, colors }
      ]);

      const won = guessWord === round.answer;
      const attemptsUsed = guesses.length + 1;

      if (won) {
        setPoints((value) => value + 30);
        setCompletedWords((value) => value + 1);
        setStatus("won");
      } else if (attemptsUsed >= MAX_ATTEMPTS) {
        setStatus("lost");
      } else {
        setCurrentGuess(emptyGuess(round.length));
        setCurrentPos(0);
        setLockKey((value) => value + 1);
      }
    },
    [round, guesses]
  );

  const commitLetter = useCallback(
    (letter) => {
      if (status !== "playing") return;
      if (currentPos >= round.length) return;

      const next = [...currentGuess];
      next[currentPos] = letter;

      const nextPos = currentPos + 1;

      setCurrentGuess(next);
      setCurrentPos(nextPos);
      setLockKey((value) => value + 1);

      if (nextPos >= round.length) {
        submitGuess(next);
      }
    },
    [status, currentPos, currentGuess, round, submitGuess]
  );

  const undoLetter = useCallback(() => {
    if (status !== "playing") return;
    if (currentPos <= 0) return;

    const next = [...currentGuess];
    next[currentPos - 1] = '';

    setCurrentGuess(next);
    setCurrentPos((value) => value - 1);
    // Força a reiniciar o filtro de estabilidade da câmara,
    // para não voltar a "ler" de imediato a mesma letra errada.
    setLockKey((value) => value + 1);
  }, [status, currentPos, currentGuess]);

  const handleRecognition = useCallback(
    (result) => {
      setDetection(result);

      if (result.committed) {
        commitLetter(result.committed);
      }
    },
    [commitLetter]
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
            Adivinha a palavra secreta soletrando-a com a mão, à la Termo
          </p>

          <div className="splash-how">
            <div className="how-step">
              <span className="how-num">1</span>
              <span>A app escolhe uma palavra secreta de 4 letras</span>
            </div>

            <div className="how-step">
              <span className="how-num">2</span>
              <span>Soletra a tua tentativa, letra a letra, à câmara</span>
            </div>

            <div className="how-step">
              <span className="how-num">3</span>
              <span>
                Verde = letra e posição certas · Amarelo = letra certa,
                posição errada · Vermelho = letra não existe
              </span>
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
        holdFrames={REQUIRED_FRAMES}
        recognised={detection}
        onRecognition={handleRecognition}
        lockKey={lockKey}
        active={status === "playing"}
      />

      <GamePanel
        wordLength={round.length}
        maxAttempts={MAX_ATTEMPTS}
        guesses={guesses}
        currentGuess={currentGuess}
        currentPos={currentPos}
        status={status}
        secretWord={round.answer}
        hint={round.clue}
        recognised={detection}
        attemptsLeft={attemptsLeft}
        onUndo={undoLetter}
        canUndo={status === "playing" && currentPos > 0}
      />

      {guideVisible && (
        <AlphabetGuide
          onClose={() => setGuideVisible(false)}
        />
      )}

    </main>
  );
}