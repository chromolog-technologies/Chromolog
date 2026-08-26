// ─── MouseParallax Component ─────────────────────────────────────────────────
// Declarative wrapper around useParallax: children drift subtly with the mouse.
// Desktop only (the hook returns zeroes on touch). Depth controls intensity;
// negative depth moves against the cursor for layered scenes.

import React from "react";
import { motion } from "framer-motion";
import useParallax from "../../hooks/useParallax";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.depth=0.04] - parallax multiplier; negative inverts
 * @param {string} [props.className]
 */
export default function MouseParallax({ children, depth = 0.04, className = "" }) {
  const { x, y } = useParallax(depth);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}
