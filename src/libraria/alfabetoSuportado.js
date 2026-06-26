const HAND = {
  WRIST: 0,

  T1: 1, T2: 2, T3: 3, T4: 4,

  I1: 5, I2: 6, I3: 7, I4: 8,

  M1: 9, M2: 10, M3: 11, M4: 12,

  R1: 13, R2: 14, R3: 15, R4: 16,

  P1: 17, P2: 18, P3: 19, P4: 20,
};

export const SUPPORTED_LETTERS = [
  'A', 'B', 'C', 'D', 'F', 'I',
  'L', 'M', 'N', 'O', 'U', 'V', 'W', 'Y'
];

const vec = (a, b) => [
  a.x - b.x,
  a.y - b.y,
  (a.z ?? 0) - (b.z ?? 0)
];

const norm = v => Math.sqrt(v.reduce((s, n) => s + n * n, 0));

const scalar = (a, b) =>
  a.reduce((s, n, i) => s + n * b[i], 0);

const gap = (a, b) => norm(vec(a, b));

const bend = (a, b, c) => {
  const u = vec(a, b);
  const v = vec(c, b);

  const cosine =
    scalar(u, v) /
    ((norm(u) * norm(v)) + 1e-9);

  return (
    Math.acos(
      Math.max(-1, Math.min(1, cosine))
    ) * 180
  ) / Math.PI;
};

const palmReference = points =>
  gap(points[HAND.WRIST], points[HAND.M1]) || 1e-6;

const fingerMetrics = points => ({
  thumb: bend(points[HAND.T2], points[HAND.T3], points[HAND.T4]),
  index: bend(points[HAND.I1], points[HAND.I2], points[HAND.I4]),
  middle: bend(points[HAND.M1], points[HAND.M2], points[HAND.M4]),
  ring: bend(points[HAND.R1], points[HAND.R2], points[HAND.R4]),
  pinky: bend(points[HAND.P1], points[HAND.P2], points[HAND.P4]),
});

const fingerState = metrics => ({
  thumb: metrics.thumb > 150,
  index: metrics.index > 160,
  middle: metrics.middle > 160,
  ring: metrics.ring > 160,
  pinky: metrics.pinky > 160,
});

const ratioMeasure = points => {
  const scale = palmReference(points);

  const pairs = [
    [HAND.I4, HAND.I1],
    [HAND.M4, HAND.M1],
    [HAND.R4, HAND.R1],
    [HAND.P4, HAND.P1],
  ];

  const total = pairs.reduce(
    (sum, [tip, root]) =>
      sum + gap(points[tip], points[root]) / scale,
    0
  );

  return total / pairs.length;
};

const match = (value, target, tolerance) =>
  Math.max(0, 1 - Math.abs(value - target) / tolerance);

const minimum = (value, threshold, margin) =>
  value >= threshold
    ? 1
    : Math.max(0, 1 - (threshold - value) / margin);

const maximum = (value, threshold, margin) =>
  value <= threshold
    ? 1
    : Math.max(0, 1 - (value - threshold) / margin);

function evaluateLetter(letter, points, open, metrics, ratio) {
  const scale = palmReference(points);

  const thumbIndex =
    gap(points[HAND.T4], points[HAND.I4]) / scale;

  const thumbMiddle =
    gap(points[HAND.T4], points[HAND.M1]) / scale;

  const spread =
    gap(points[HAND.I4], points[HAND.M4]) / scale;

  const thumbReach =
    gap(points[HAND.T4], points[HAND.I1]) / scale;

  // Quão perto está a ponta do polegar dos "nós" (MCP) dos outros dedos.
  // Útil para distinguir M e N: em ambas as letras a mão está fechada
  // (punho), mas o polegar fica encostado entre dedos diferentes.
  // N -> polegar entre o indicador e o médio (perto de thumbReach/thumbMiddle).
  // M -> polegar entre o anelar e o mindinho (perto de thumbRingKnuckle/thumbPinkyKnuckle).
  const thumbRingKnuckle =
    gap(points[HAND.T4], points[HAND.R1]) / scale;

  const thumbPinkyKnuckle =
    gap(points[HAND.T4], points[HAND.P1]) / scale;

  const thumbVector =
    vec(points[HAND.T4], points[HAND.T2]);

  const indexVector =
    vec(points[HAND.I4], points[HAND.I1]);

  const angle =
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          scalar(thumbVector, indexVector) /
            ((norm(thumbVector) * norm(indexVector)) + 1e-9)
        )
      )
    ) *
    180 /
    Math.PI;

  const rules = {
    B: [
      open.index && open.middle && open.ring && open.pinky ? 1 : 0,
      maximum(metrics.thumb, 150, 30)
    ],

    D: [
      open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      maximum(thumbReach, 0.7, 0.3)
    ],

    F: [
      open.middle && open.ring && open.pinky ? 1 : 0,
      maximum(thumbIndex, 0.35, 0.3)
    ],

    I: [
      open.pinky ? 1 : 0,
      !open.index && !open.middle && !open.ring ? 1 : 0
    ],

    L: [
      open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      minimum(thumbReach, 0.75, 0.35),
      match(angle, 90, 45)
    ],

    U: [
      open.index && open.middle && !open.ring && !open.pinky ? 1 : 0,
      maximum(spread, 0.4, 0.3)
    ],

    V: [
      open.index && open.middle && !open.ring && !open.pinky ? 1 : 0,
      minimum(spread, 0.55, 0.3)
    ],

    W: [
      open.index && open.middle && open.ring && !open.pinky ? 1 : 0,
      1
    ],

    Y: [
      open.thumb && open.pinky ? 1 : 0,
      !open.index && !open.middle && !open.ring ? 1 : 0
    ],

    O: [
      !open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      match(ratio, 0.65, 0.35),
      maximum(thumbIndex, 0.5, 0.3)
    ],

    C: [
      !open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      minimum(ratio, 0.85, 0.25),
      minimum(thumbIndex, 0.45, 0.3)
    ],

    A: [
      !open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      maximum(ratio, 0.55, 0.2),
      minimum(thumbMiddle, 0.6, 0.3)
    ],

    N: [
      !open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      // polegar encostado perto do indicador/médio (fechado "por dentro")
      maximum(thumbReach, 0.4, 0.25),
      // e claramente mais perto do indicador do que do mindinho
      minimum(thumbPinkyKnuckle - thumbReach, 0.12, 0.3)
    ],

    M: [
      !open.index && !open.middle && !open.ring && !open.pinky ? 1 : 0,
      // polegar encostado perto do anelar/mindinho
      maximum(thumbRingKnuckle, 0.4, 0.25),
      // e claramente mais perto do mindinho do que do indicador
      minimum(thumbReach - thumbPinkyKnuckle, 0.12, 0.3)
    ],
  };

  return rules[letter] || [0];
}

export function classify(points) {
  if (!points || points.length < 21) {
    return {
      letter: null,
      confidence: 0,
      ext: null
    };
  }

  const metrics = fingerMetrics(points);
  const ext = fingerState(metrics);
  const ratio = ratioMeasure(points);

  const result = SUPPORTED_LETTERS.reduce(
    (best, letter) => {
      const checks = evaluateLetter(
        letter,
        points,
        ext,
        metrics,
        ratio
      );

      const score =
        checks.reduce((a, b) => a + b, 0) /
        checks.length;

      return score > best.confidence
        ? { letter, confidence: score }
        : best;
    },
    { letter: null, confidence: 0 }
  );

  return {
    ...result,
    ext,
    ratio
  };
}

export function createStabilityFilter(
  { holdFrames = 12, minConf = 0.75 } = {}
) {
  let currentLetter = null;
  let frames = 0;
  let committedLetter = null;

  return {
    push(data) {
      const { letter, confidence } = data;

      if (!letter || confidence < minConf) {
        currentLetter = null;
        frames = 0;

        return {
          committed: null,
          candidate: letter,
          progress: 0
        };
      }

      frames =
        currentLetter === letter
          ? frames + 1
          : 1;

      currentLetter = letter;

      const progress =
        Math.min(frames / holdFrames, 1);

      if (
        frames >= holdFrames &&
        committedLetter !== letter
      ) {
        committedLetter = letter;

        return {
          committed: letter,
          candidate: letter,
          progress: 1
        };
      }

      return {
        committed: null,
        candidate: letter,
        progress
      };
    },

    reset() {
      currentLetter = null;
      frames = 0;
      committedLetter = null;
    },

    clearLock() {
      committedLetter = null;
    }
  };
}