import React from 'react';

export default function GamePanel({
  word, hint, letterIndex, score, solved, recognised, onSkip, onGuide,
}) {
  const letters = word.split('');
  const target = letters[letterIndex];
  const candidate = recognised?.candidate;
  const progress = recognised?.progress || 0;
  const matches = candidate && candidate === target;

  return (
    <section className="panel">
      <div className="scoreboard">
        <div>
          <span className="label">Pontuação</span>
          <span className="value">{score}</span>
        </div>
        <div>
          <span className="label">Palavras</span>
          <span className="value">{solved}</span>
        </div>
      </div>

      <div>
        <div className="word-section-label" style={{ marginBottom: 10 }}>Palavra atual</div>
        <div className="word-row">
          {letters.map((l, i) => {
            const done = i < letterIndex;
            const active = i === letterIndex;
            const waiting = i > letterIndex;
            let cls = 'letter-tile';
            if (done) cls += ' done';
            else if (active) cls += ' active';
            else if (waiting) cls += ' waiting';
            return (
              <div key={i} className={cls}>
                <span className="letter">{done ? l : active ? l : '·'}</span>
                {active && progress > 0 && (
                  <div className="progress" style={{ width: `${Math.round(progress * 100)}%` }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="hint-text">Dica: <em>{hint}</em></p>

      <div className="recognised">
        <div className="recognised-row">
          <div className="recognised-cell">
            <span className="rec-label">Letra alvo</span>
            <span className="big-letter target-letter">{target}</span>
          </div>
          <div className="recognised-cell">
            <span className="rec-label">Detetado</span>
            <span className={`big-letter detected${matches ? ' ok' : ''}`}>
              {candidate || '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="ghost" onClick={onSkip}>Saltar palavra</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
