import React, { useState } from 'react';

export default function GamePanel({
  wordLength,
  maxAttempts,
  guesses,
  currentGuess,
  currentPos,
  status,
  secretWord,
  hint,
  recognised,
  attemptsLeft,
  onNext,
  onUndo,
  canUndo
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);
  const progress = recognised?.progress || 0;
  const liveLetter = recognised?.candidate;

  const pastGuesses = guesses.slice(0, -1);
  const lastGuess = guesses[guesses.length - 1];

  // Por defeito só mostramos no máximo 2 linhas: a última tentativa
  // (se existir) + a tentativa atual. As tentativas mais antigas só
  // aparecem se o botão "ver tentativas anteriores" estiver ativo.
  const rows = [];

  if (historyOpen) {
    pastGuesses.forEach((g) => rows.push({ type: 'done', ...g }));
  }

  if (lastGuess) {
    rows.push({ type: 'done', ...lastGuess });
  }

  if (status === 'playing') {
    rows.push({ type: 'active', letters: currentGuess });
  }

  return (
    <div className="bottom-panel">
      {pastGuesses.length > 0 && (
        <button
          className="history-toggle"
          onClick={() => setHistoryOpen((o) => !o)}
        >
          {historyOpen
            ? '▲ esconder tentativas anteriores'
            : `▼ ver tentativas anteriores (${pastGuesses.length})`}
        </button>
      )}

      {/* Tabuleiro estilo Termo */}
      <div className="board">
        {rows.map((row, ri) => (
          <div className="tiles-row" key={ri}>
            {Array.from({ length: wordLength }).map((_, ci) => {
              let cls = 'tile';
              let content = '';
              let showProgress = false;

              if (row.type === 'done') {
                cls += ` tile-${row.colors[ci]}`;
                content = row.letters[ci];
              } else if (row.type === 'active') {
                const filled = ci < currentPos;
                const isCurrent = ci === currentPos;

                if (filled) {
                  cls += ' tile-filled';
                  content = row.letters[ci];
                } else if (isCurrent) {
                  cls += ' tile-active';
                  content = liveLetter || '';
                  showProgress = true;
                } else {
                  cls += ' tile-wait';
                }
              } else {
                cls += ' tile-empty';
              }

              return (
                <div key={ci} className={cls}>
                  {content}
                  {showProgress && progress > 0 && (
                    <div
                      className="tile-progress"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {status === 'playing' && (
        <div className="attempts-row">
          <p className="attempts-left">
            {attemptsLeft} {attemptsLeft === 1 ? 'tentativa' : 'tentativas'} restantes
          </p>

          <button
            type="button"
            className="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Apagar a última letra lida"
          >
            ⌫ apagar letra
          </button>
        </div>
      )}

      {status !== 'playing' && (
        <div className={`round-result ${status === 'won' ? 'is-win' : 'is-lose'}`}>
          <p className="round-result-msg">
            {status === 'won'
              ? 'Acertaste! 🎉'
              : <>A palavra era <strong>{secretWord}</strong></>}
          </p>
          <button className="btn-next" onClick={onNext}>
            Próxima palavra »
          </button>
        </div>
      )}

      <div className="panel-toggles">
        {/* Pista colapsável */}
        <button className="hint-toggle" onClick={() => setHintOpen((o) => !o)}>
          {hintOpen ? '▲ esconder pista' : '▼ ver pista'}
        </button>

        {/* Revelar a resposta */}
        {status === 'playing' && (
          <button className="answer-toggle" onClick={() => setAnswerOpen((o) => !o)}>
            {answerOpen ? '▲ esconder resposta' : '👁 ver resposta'}
          </button>
        )}
      </div>

      {hintOpen && (
        <div className="hint-box">{hint}</div>
      )}

      {answerOpen && status === 'playing' && (
        <div className="answer-box">{secretWord}</div>
      )}
    </div>
  );
}