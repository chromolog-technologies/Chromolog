// ─── Stagger Component ───────────────────────────────────────────────────────
// Wraps children in staggered motion.div wrappers.
// Each child enters sequentially with configurable delay.

import React from "react";
import { motion } from "framer-motion";
import { easings } from "../../motion/easings";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {React.ReactNode[]} props.children - array of elements to stagger
 * @param {number} [props.staggerDelay=0.08] - delay between each child (seconds)
 * @param {number} [props.initialDelay=0] - initial delay before first child
 * @param {number} [props.duration=0.65] - animation duration per child
 * @param {string} [props.className] - class for the wrapper
 * @param {"up"|"fade"|"scale"} [props.variant="up"] - animation type
 * @param {boolean} [props.once=true]
 */
export default function Stagger({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  duration = 0.65,
  className = "",
  variant = "up",
  once = true,
}) {
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const itemVariants = {
    up: {
      hidden: { opacity: 0, y: 28, filter: "blur(5px)" },
      visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration, ease: easings.smooth },
      },
    },
    fade: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration, ease: easings.decel },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.88 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration, ease: easings.spring },
      },
    },
  };

  const selectedItemVariant = itemVariants[variant] || itemVariants.up;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-6% 0px -6% 0px" }}
      variants={containerVariants}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div key={index} variants={selectedItemVariant}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
