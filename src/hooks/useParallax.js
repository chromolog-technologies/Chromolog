// ─── useParallax Hook ─────────────────────────────────────────────────────────
// Returns spring-smoothed x/y values based on mouse position.
// Desktop only — returns zeroes on touch devices.

import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * @param {number} [strength=0.04] - multiplier for parallax intensity
 * @returns {{ x: MotionValue, y: MotionValue }}
 */
export default function useParallax(strength = 0.04) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { damping: 32, stiffness: 200, mass: 0.5 });
  const y = useSpring(rawY, { damping: 32, stiffness: 200, mass: 0.5 });

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      rawX.set((e.clientX - centerX) * strength);
      rawY.set((e.clientY - centerY) * strength);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawX, rawY, strength]);

  return { x, y };
}
