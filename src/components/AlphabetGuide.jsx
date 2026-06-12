import React from 'react';

const SUPPORTED_SIGNS = [
  ['A', 'Punho fechado, polegar ao lado do indicador.'],
  ['B', 'Quatro dedos unidos para cima, polegar dobrado sobre a palma.'],
  ['C', 'Mão curvada em forma de C, dedos e polegar arqueados.'],
  ['D', 'Indicador para cima, polegar toca nos restantes dedos dobrados.'],
  ['F', 'Polegar e indicador em círculo; médio, anelar e mindinho esticados.'],
  ['I', 'Punho fechado com o mindinho esticado para cima.'],
  ['L', 'Polegar e indicador formam um L; restantes dedos fechados.'],
  ['O', 'Todos os dedos curvados a tocar no polegar, criando um O.'],
  ['U', 'Indicador e médio juntos e esticados para cima.'],
  ['V', 'Indicador e médio esticados em V afastados.'],
  ['W', 'Indicador, médio e anelar para cima; polegar segura o mindinho.'],
  ['Y', 'Polegar e mindinho esticados; restantes dedos dobrados.'],
];

function SignCard({ symbol, description }) {
  return (
    <article className="guide-item">
      <span className="guide-letter">{symbol}</span>
      <span className="guide-desc">{description}</span>
    </article>
  );
}

export default function AlphabetGuide({ onClose }) {
  const stop = (event) => event.stopPropagation();

  return (
    <div className="guide-backdrop" onClick={onClose}>
      <section className="guide-sheet" onClick={stop}>
        <header className="guide-header">
          <span>Gestos suportados</span>
          <button className="guide-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="guide-grid">
          {SUPPORTED_SIGNS.map(([symbol, description]) => (
            <SignCard
              key={symbol}
              symbol={symbol}
              description={description}
            />
          ))}
        </div>
      </section>
    </div>
  );
}