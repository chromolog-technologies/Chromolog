// ─── MagneticButton Component ────────────────────────────────────────────────
// Wraps any element and applies magnetic hover effect using useMagnetic hook.
// Desktop only — no effect on touch devices.

import React from "react";
import { motion } from "framer-motion";
import useMagnetic from "../../hooks/useMagnetic";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.strength=0.3] - magnetic pull intensity
 * @param {string} [props.className] - pass-through class
 * @param {function} [props.onClick]
 * @param {object} [props.rest] - any other props passed to the wrapper
 */
export default function MagneticButton({
  children,
  strength = 0.3,
  className = "",
  onClick,
  ...rest
}) {
  const { ref, x, y, eventHandlers } = useMagnetic(strength);

  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: "inline-flex" }}
      className={className}
      onClick={onClick}
      {...eventHandlers}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
