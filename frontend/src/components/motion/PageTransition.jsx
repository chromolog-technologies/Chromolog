// ─── PageTransition Component ────────────────────────────────────────────────
// Wraps a page in the shared fade/scale/blur transition. Use inside an
// <AnimatePresence mode="wait"> keyed by the active page so exit/enter
// sequences run on every navigation. Reduced motion → plain div.

import React from "react";
import { motion } from "framer-motion";
import { pageTransitionVariants } from "../../motion/variants";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export default function PageTransition({ children, className = "" }) {
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={pageTransitionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
