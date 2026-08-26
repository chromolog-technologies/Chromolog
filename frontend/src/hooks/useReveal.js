// ─── useReveal Hook ───────────────────────────────────────────────────────────
// IntersectionObserver-based hook that returns ref + inView state.
// Designed to be combined with Framer Motion whileInView or GSAP fromTo.

import { useRef, useState, useEffect } from "react";

/**
 * @param {object} options
 * @param {number} [options.threshold=0.15] - intersection threshold (0–1)
 * @param {string} [options.rootMargin="-10% 0px -10% 0px"] - root margin
 * @param {boolean} [options.once=true] - only trigger once
 */
export default function useReveal({
  threshold = 0.15,
  rootMargin = "-10% 0px -10% 0px",
  once = true,
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
