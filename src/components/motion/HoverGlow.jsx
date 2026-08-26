// ─── HoverGlow Component ─────────────────────────────────────────────────────
// Wraps any element with a cursor-tracking radial glow + optional border sheen.
// Pure CSS-variable driven (no re-renders on mousemove). Desktop only.
// Respects prefers-reduced-motion — glow stays static center on reduce.

import React, { useRef, useCallback } from "react";

const isTouch =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.color="rgba(0,229,255,0.14)"] - glow color
 * @param {number} [props.size=320] - glow diameter in px
 * @param {string} [props.className] - wrapper classes (should include rounded-*)
 * @param {string} [props.as="div"] - wrapper tag
 */
export default function HoverGlow({
  children,
  color = "rgba(0,229,255,0.14)",
  size = 320,
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--hg-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--hg-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={onMouseMove}
      className={`hover-glow-wrap ${className}`}
      style={{ "--hg-color": color, "--hg-size": `${size}px` }}
      {...rest}
    >
      <span className="hover-glow-layer" aria-hidden="true" />
      {children}
    </Tag>
  );
}
