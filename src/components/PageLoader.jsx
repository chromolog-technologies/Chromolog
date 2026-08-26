// ─── PageLoader — Premium Cinematic Loader ───────────────────────────────────
// Neural network particles → logo glow → percentage counter → clip-away exit
// Max duration: 1.5 seconds (fast, premium feel)

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PageLoader({ onComplete }) {
  const canvasRef = useRef(null);
  const [percentage, setPercentage] = useState(0);
  const [phase, setPhase] = useState("particles"); // particles → glow → exit

  // ── Percentage Counter (0 → 100 over 1.2s) ──────────────────────────────
  useEffect(() => {
    const start = performance.now();
    const duration = 1200;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease out
      setPercentage(Math.round(eased * 100));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, []);

  // ── Neural Network Canvas ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Node count scaled to device
    const count = Math.min(window.innerWidth < 768 ? 36 : 56, 56);

    // Spawn nodes far away; they converge inward to form neural sphere
    const nodes = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 80 + Math.random() * 120;
      const targetX = cx + r * Math.cos(angle);
      const targetY = cy + r * Math.sin(angle);
      return {
        x: cx + (Math.random() - 0.5) * canvas.width * 0.85,
        y: cy + (Math.random() - 0.5) * canvas.height * 0.85,
        tx: targetX,
        ty: targetY,
        size: 1 + Math.random() * 2.5,
        alpha: 0,
        color:
          Math.random() > 0.55
            ? "#00e5ff"
            : Math.random() > 0.5
            ? "#4f46e5"
            : "#7c3aed",
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
      };
    });

    let frameId;
    const startTime = performance.now();
    const convergeDuration = 900; // ms — particles converge over 0.9s

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / convergeDuration, 1);
      const progress = easeOut(t);
      const oscillation = elapsed / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 110;
          if (dist < maxDist && a.alpha > 0.15) {
            const lineAlpha = a.alpha * (1 - dist / maxDist) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(79, 70, 229, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        n.alpha = Math.min(1, n.alpha + 0.02);

        // Converge toward target
        n.x = n.x + (n.tx - n.x) * (progress * 0.12 + 0.01);
        n.y = n.y + (n.ty - n.y) * (progress * 0.12 + 0.01);

        // Gentle float oscillation after convergence
        const floatX = Math.sin(oscillation * n.speed + n.phase) * (3 * progress);
        const floatY = Math.cos(oscillation * n.speed + n.phase + 1) * (2 * progress);

        ctx.beginPath();
        ctx.arc(n.x + floatX, n.y + floatY, n.size, 0, Math.PI * 2);
        ctx.fillStyle =
          n.color +
          Math.floor(n.alpha * 255)
            .toString(16)
            .padStart(2, "0");
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Orchestrate Exit ─────────────────────────────────────────────────────
  useEffect(() => {
    // After 800ms → glow phase
    const glowTimer = setTimeout(() => setPhase("glow"), 800);
    // After 1500ms → trigger completion
    const exitTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1500);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: "blur(12px)",
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "#050816" }}
    >
      {/* Ambient radial glow behind logo */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(0,229,255,0.06) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
        animate={
          phase === "glow"
            ? {
                opacity: [0.5, 1, 0.8],
                scale: [1, 1.25, 1.1],
              }
            : { opacity: 0.5, scale: 1 }
        }
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Neural particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-5 select-none">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
          animate={{
            scale: phase === "glow" ? [1, 1.08, 1] : 1,
            opacity: 1,
            filter: "blur(0px)",
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
            scale: phase === "glow"
              ? { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
              : { duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
            filter: { duration: 0.6, delay: 0.2 },
          }}
          className="relative"
        >
          {/* Logo glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={
              phase === "glow"
                ? {
                    boxShadow: [
                      "0 0 0px rgba(0, 229, 255, 0)",
                      "0 0 60px rgba(0, 229, 255, 0.5), 0 0 120px rgba(79, 70, 229, 0.3)",
                      "0 0 40px rgba(0, 229, 255, 0.3)",
                    ],
                  }
                : { boxShadow: "0 0 0px rgba(0, 229, 255, 0)" }
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transform: "scale(1.5)" }}
          />
          <BrandLogo className="w-16 h-16 md:w-20 md:h-20 object-contain relative drop-shadow-2xl" />
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="text-white font-heading font-extrabold text-xl tracking-wide">
            Chromolog
          </p>
          <p className="text-accent/70 font-body text-xs tracking-[0.3em] uppercase mt-0.5">
            Technologies
          </p>
        </motion.div>

        {/* Progress line + percentage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="flex flex-col items-center gap-2"
        >
          {/* Progress bar */}
          <div className="w-36 h-px bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #4f46e5, #06b6d4, #00e5ff)",
                width: `${percentage}%`,
                boxShadow: "0 0 8px rgba(0, 229, 255, 0.5)",
              }}
            />
          </div>

          {/* Percentage */}
          <p className="text-muted-text font-heading text-xs font-bold tracking-widest">
            {percentage}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
