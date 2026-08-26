// ─── Chromolog Motion Easings ────────────────────────────────────────────────
// Curated easing curves matching premium design systems (Framer, Linear, Vercel)

export const easings = {
  /** Smooth, natural feel. Default for most reveals. */
  smooth: [0.16, 1, 0.3, 1],

  /** Fast start, gentle landing. Great for hero entries. */
  expo: [0.19, 1, 0.22, 1],

  /** Snappy micro-interaction feel. Great for hover states. */
  snappy: [0.25, 0.46, 0.45, 0.94],

  /** Gentle spring feel — slight overshoot, then settle. */
  spring: [0.34, 1.56, 0.64, 1],

  /** Very precise, mechanical. Good for progress bars. */
  linear: [0, 0, 1, 1],

  /** Soft deceleration. Great for fades and blurs. */
  decel: [0, 0, 0.2, 1],

  /** Accelerate then brake hard. Good for reveals. */
  inOut: [0.4, 0, 0.2, 1],

  /** Dramatic entrance — quick burst then slow landing. */
  dramatic: [0.06, 0.97, 0.19, 0.99],
};

export default easings;
