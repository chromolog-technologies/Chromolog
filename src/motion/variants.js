// ─── Chromolog Motion Variants ───────────────────────────────────────────────
// Reusable Framer Motion variant definitions for every animation pattern

import { easings } from "./easings";

// ── Fade + Slide Up ──────────────────────────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easings.smooth },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easings.decel },
  },
};

export const fadeUpFast = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

// ── Mask Reveal (word-by-word) ───────────────────────────────────────────────
export const maskReveal = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { duration: 0.9, ease: easings.expo },
  },
};

export const maskRevealFromBottom = {
  hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    opacity: 1,
    transition: { duration: 0.8, ease: easings.expo },
  },
};

// ── Scale Reveal ─────────────────────────────────────────────────────────────
export const scaleReveal = {
  hidden: { opacity: 0, scale: 0.88, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: easings.spring },
  },
};

// ── Stagger Container ─────────────────────────────────────────────────────────
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const staggerItemFast = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easings.snappy },
  },
};

// ── Slide In from Left / Right ───────────────────────────────────────────────
export const slideInLeft = {
  hidden: { opacity: 0, x: -48, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easings.expo },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 48, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easings.expo },
  },
};

// ── Card Hover ────────────────────────────────────────────────────────────────
export const cardHover = {
  rest: { y: 0, scale: 1, transition: { duration: 0.3, ease: easings.snappy } },
  hover: { y: -8, scale: 1.02, transition: { duration: 0.3, ease: easings.snappy } },
};

// ── Glow Pulse ────────────────────────────────────────────────────────────────
export const glowPulse = {
  rest: { boxShadow: "0 0 0px rgba(0, 229, 255, 0)" },
  hover: {
    boxShadow: "0 0 32px rgba(0, 229, 255, 0.25), 0 0 64px rgba(79, 70, 229, 0.15)",
    transition: { duration: 0.4, ease: easings.decel },
  },
};

// ── Page Transition ──────────────────────────────────────────────────────────
export const pageTransitionVariants = {
  initial: { opacity: 0, scale: 0.97, filter: "blur(8px)" },
  enter: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easings.expo },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(8px)",
    transition: { duration: 0.35, ease: easings.snappy },
  },
};

// ── Hero Word Entry ──────────────────────────────────────────────────────────
export const heroWordVariant = {
  hidden: { opacity: 0, y: 40, rotateX: -25, filter: "blur(8px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: easings.expo,
      delay: i * 0.06,
    },
  }),
};

// ── Timeline Card (alternate sides) ──────────────────────────────────────────
export const timelineCardLeft = {
  hidden: { opacity: 0, x: -42, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: easings.expo },
  },
};

export const timelineCardRight = {
  hidden: { opacity: 0, x: 42, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: easings.expo },
  },
};
