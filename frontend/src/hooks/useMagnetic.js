// ─── useMagnetic Hook ─────────────────────────────────────────────────────────
// Magnetic button effect: returns spring x/y values and event handlers.
// Attach ref to the element, spread eventHandlers onto it.

import { useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * @param {number} [strength=0.35] - magnetic pull intensity (0–1)
 * @returns {{ ref, x, y, eventHandlers }}
 */
export default function useMagnetic(strength = 0.35) {
  const ref = useRef(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { damping: 20, stiffness: 280, mass: 0.4 });
  const y = useSpring(rawY, { damping: 20, stiffness: 280, mass: 0.4 });

  const handleMouseMove = (e) => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch || !ref.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    rawX.set((e.clientX - centerX) * strength);
    rawY.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return {
    ref,
    x,
    y,
    eventHandlers: { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave },
  };
}
