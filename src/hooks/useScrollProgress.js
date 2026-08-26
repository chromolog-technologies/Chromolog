// ─── useScrollProgress Hook ──────────────────────────────────────────────────
// Returns a 0–1 progress value tracking overall page scroll position.

import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * @returns {{ progress: MotionValue }} - spring-smoothed scroll progress 0–1
 */
export default function useScrollProgress() {
  const rawProgress = useMotionValue(0);
  const progress = useSpring(rawProgress, { damping: 40, stiffness: 300 });

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      rawProgress.set(scrollTop / docHeight);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, [rawProgress]);

  return { progress };
}
