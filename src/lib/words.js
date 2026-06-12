// 4-letter pt-PT words restricted to letters supported by the classifier:
// A, B, C, D, F, I, L, O, U, V, W, Y.
// Each entry is a [word, hint] pair shown to the player.

export const WORDS = [
  ['BOLA', 'Brincamos com ela no recreio'],
  ['VILA', 'Mais pequena que uma cidade'],
  ['LUVA', 'Cobre as mãos no inverno'],
  ['VIDA', 'O contrário de morte'],
  ['CABO', 'Pode ser de telefone'],
  ['COVA', 'Buraco no chão'],
  ['FADO', 'Música tradicional portuguesa'],
  ['FILA', 'Espera-se aqui no supermercado'],
  ['BOCA', 'Por onde falamos e comemos'],
  ['VACA', 'Animal que dá leite'],
  ['FOCA', 'Mamífero aquático'],
  ['BICO', 'Tem o pássaro na cara'],
  ['LOBO', 'Animal selvagem do conto'],
  ['LULA', 'Molusco com tentáculos'],
  ['COCO', 'Fruto tropical com água dentro'],
  ['FACA', 'Corta a comida'],
  ['FAVA', 'Leguminosa verde'],
  ['BAIA', 'Entrada do mar para a costa'],
  ['DADO', 'Pequeno cubo de jogar'],
  ['DOCA', 'Onde os barcos atracam'],
  ['DIVA', 'Cantora de grande fama'],
  ['AULA', 'Acontece na escola'],
  ['ALFA', 'Primeira letra do alfabeto grego'],
  ['CACO', 'Pedaço de loiça partida'],
  ['CALA', 'Verbo: faz silêncio!'],
];

export function pickRandomWord(history = []) {
  const recent = new Set(history.slice(-6));
  const pool = WORDS.filter(([w]) => !recent.has(w));
  const list = pool.length ? pool : WORDS;
  return list[Math.floor(Math.random() * list.length)];
}
