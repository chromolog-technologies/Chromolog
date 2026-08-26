// ─── ScrollProgress Component ─────────────────────────────────────────────────
// Fixed thin gradient bar at the very top of the viewport tracking page scroll.
// Hidden on prefers-reduced-motion.

import React from "react";
import { motion, useTransform } from "framer-motion";
import useScrollProgress from "../../hooks/useScrollProgress";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ScrollProgress() {
  const { progress } = useScrollProgress();
  const scaleX = useTransform(progress, [0, 1], [0, 1]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      aria-hidden="true"
    >
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX,
          background:
            "linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #00e5ff 100%)",
          boxShadow: "0 0 8px rgba(0, 229, 255, 0.6)",
        }}
      />
    </div>
  );
}
