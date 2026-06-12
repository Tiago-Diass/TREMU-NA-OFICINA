import React from 'react';

const ENTRIES = [
  { letter: 'A', desc: 'Punho fechado, polegar ao lado do indicador.' },
  { letter: 'B', desc: 'Quatro dedos unidos para cima, polegar dobrado sobre a palma.' },
  { letter: 'C', desc: 'Mão curvada em forma de C, dedos e polegar arqueados.' },
  { letter: 'D', desc: 'Indicador para cima, polegar toca nos restantes dedos dobrados.' },
  { letter: 'F', desc: 'Polegar e indicador em círculo; médio, anelar e mindinho esticados.' },
  { letter: 'I', desc: 'Punho fechado com o mindinho esticado para cima.' },
  { letter: 'L', desc: 'Polegar e indicador formam um L; restantes dedos fechados.' },
  { letter: 'O', desc: 'Todos os dedos curvados a tocar no polegar, criando um O.' },
  { letter: 'U', desc: 'Indicador e médio juntos e esticados para cima.' },
  { letter: 'V', desc: 'Indicador e médio esticados em V afastados.' },
  { letter: 'W', desc: 'Indicador, médio e anelar para cima; polegar segura o mindinho.' },
  { letter: 'Y', desc: 'Polegar e mindinho esticados; restantes dedos dobrados.' },
];

export default function AlphabetGuide({ onClose }) {
  return (
    <div className="guide-backdrop" onClick={onClose}>
      <div className="guide-sheet" onClick={e => e.stopPropagation()}>
        <div className="guide-header">
          <span>Gestos suportados</span>
          <button className="guide-close" onClick={onClose}>✕</button>
        </div>
        <p className="guide-note">Apenas sinais estáticos a uma mão. J e Z (com movimento) ficam para a próxima versão.</p>
        <div className="guide-grid">
          {ENTRIES.map(({ letter, desc }) => (
            <div key={letter} className="guide-item">
              <span className="guide-letter">{letter}</span>
              <span className="guide-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
