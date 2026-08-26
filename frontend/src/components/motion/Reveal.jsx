// ─── Reveal Component ─────────────────────────────────────────────────────────
// Scroll-triggered reveal wrapper: mask + blur + slide effect.
// Respects prefers-reduced-motion — falls back to simple fade.

import React from "react";
import { motion } from "framer-motion";
import { easings } from "../../motion/easings";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.delay=0] - delay in seconds
 * @param {number} [props.duration=0.7] - animation duration
 * @param {"up"|"left"|"right"|"fade"|"scale"|"mask"} [props.variant="up"] - reveal style
 * @param {string} [props.className] - additional class names
 * @param {boolean} [props.once=true] - only animate once
 * @param {string} [props.as="div"] - element tag
 */
export default function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  variant = "up",
  className = "",
  once = true,
  as = "div",
}) {
  const MotionTag = motion[as] || motion.div;

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const variants = {
    up: {
      hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)" },
    },
    left: {
      hidden: { opacity: 0, x: -40, filter: "blur(5px)" },
      visible: { opacity: 1, x: 0, filter: "blur(0px)" },
    },
    right: {
      hidden: { opacity: 0, x: 40, filter: "blur(5px)" },
      visible: { opacity: 1, x: 0, filter: "blur(0px)" },
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9, filter: "blur(8px)" },
      visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
    },
    mask: {
      hidden: { clipPath: "inset(0 100% 0 0)", opacity: 1 },
      visible: { clipPath: "inset(0 0% 0 0)", opacity: 1 },
    },
  };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-8% 0px -8% 0px" }}
      variants={variants[variant] || variants.up}
      transition={{ duration, delay, ease: easings.expo }}
    >
      {children}
    </MotionTag>
  );
}
