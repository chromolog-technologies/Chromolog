// ─── CursorFollower — Enhanced Premium Cursor ────────────────────────────────
// Sharp inner dot + trailing ring + ambient glow
// Enhanced: mix-blend-mode difference on dot, larger ring expansion, smoother springs
// Cursor label: appears on elements with data-cursor-text attribute
// Desktop only — disabled on touch devices

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export default function CursorFollower() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInput, setIsInput] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Slightly more responsive spring for dot
  const dotSpring = { damping: 45, stiffness: 500, mass: 0.35 };
  // Smoother spring for trail ring
  const ringSpring = { damping: 28, stiffness: 350, mass: 0.45 };

  const trailX = useSpring(cursorX, ringSpring);
  const trailY = useSpring(cursorY, ringSpring);

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    const handleMouseOver = (e) => {
      const target = e.target;

      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("clickable") ||
        target.getAttribute("role") === "button";

      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("input") ||
        target.closest("textarea");

      // Check for cursor label
      const labelEl =
        target.closest("[data-cursor-text]") ||
        (target.getAttribute("data-cursor-text") ? target : null);
      const label = labelEl?.getAttribute("data-cursor-text") || "";
      setCursorLabel(label);

      setIsHovered(!!isClickable && !isInputField);
      setIsInput(!!isInputField);
    };

    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Sharp Inner Dot */}
      <motion.div
        style={{
          position: "fixed",
          left: cursorX,
          top: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "difference",
        }}
        animate={{
          width: isHovered ? 6 : isInput ? 2 : 8,
          height: isHovered ? 6 : isInput ? 18 : 8,
          backgroundColor: isHovered ? "#ffffff" : isInput ? "#ffffff" : "#f8fafc",
          borderRadius: isInput ? "2px" : "50%",
          scale: isHovered ? 0.7 : 1,
        }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {/* Trailing Soft Glowing Ring */}
      <motion.div
        style={{
          position: "fixed",
          left: trailX,
          top: trailY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 9999,
          borderRadius: "50%",
        }}
        animate={{
          width: isHovered ? 72 : isInput ? 32 : 30,
          height: isHovered ? 72 : isInput ? 32 : 30,
          backgroundColor: isHovered ? "rgba(0, 229, 255, 0.08)" : "rgba(79, 70, 229, 0.06)",
          border: isHovered
            ? "1.5px solid rgba(0, 229, 255, 0.5)"
            : "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: isHovered
            ? "0 0 24px rgba(0, 229, 255, 0.35), inset 0 0 12px rgba(0, 229, 255, 0.15)"
            : "0 0 12px rgba(79, 70, 229, 0.1)",
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />

      {/* Cursor Label */}
      <AnimatePresence>
        {cursorLabel && (
          <motion.div
            style={{
              position: "fixed",
              left: trailX,
              top: trailY,
              translateX: "-50%",
              translateY: "calc(-50% + 44px)",
              pointerEvents: "none",
              zIndex: 9998,
            }}
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-white font-heading whitespace-nowrap px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(79, 70, 229, 0.9)",
                boxShadow: "0 0 12px rgba(79, 70, 229, 0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              {cursorLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Large Follow Light */}
      <motion.div
        style={{
          position: "fixed",
          left: trailX,
          top: trailY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 9997,
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 229, 255, 0.035) 0%, rgba(79, 70, 229, 0.012) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
    </>
  );
}
