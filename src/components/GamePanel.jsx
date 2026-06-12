import React, { useState } from 'react';

export default function GamePanel({ word, hint, letterIndex, recognised }) {
  const [hintOpen, setHintOpen] = useState(false);
  const letters = word.split('');
  const progress = recognised?.progress || 0;

  return (
    <div className="bottom-panel">
      {/* Tiles das letras */}
      <div className="tiles-row">
        {letters.map((l, i) => {
          const done = i < letterIndex;
          const active = i === letterIndex;
          let cls = 'tile';
          if (done) cls += ' tile-done';
          else if (active) cls += ' tile-active';
          else cls += ' tile-wait';
          return (
            <div key={i} className={cls}>
              {done ? l : active ? l : '?'}
              {active && progress > 0 && (
                <div className="tile-progress" style={{ width: `${Math.round(progress * 100)}%` }} />
              )}
              {done && <span className="tile-check">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Pista colapsável */}
      <button className="hint-toggle" onClick={() => setHintOpen(o => !o)}>
        {hintOpen ? '▲ esconder pista' : '▼ ver pista'}
      </button>
      {hintOpen && (
        <div className="hint-box">{hint}</div>
      )}
    </div>
  );
}
