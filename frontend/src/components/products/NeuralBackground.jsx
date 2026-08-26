// ─── NeuralBackground ────────────────────────────────────────────────────────
// Lightweight <canvas> neural-network + floating-particle field for the Products
// hero. Pauses when offscreen (IntersectionObserver), caps DPR, throttles node
// count on mobile, and fully disables for prefers-reduced-motion.

import React, { useEffect, useRef } from "react";

export default function NeuralBackground({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let width = 0;
    let height = 0;
    let running = !prefersReduced;
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const palette = ["#00e5ff", "#4f46e5", "#7c3aed", "#06b6d4"];

    let nodes = [];

    const build = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isSmall = width < 768;
      const density = isSmall ? 34 : 64;
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
        c: palette[(Math.random() * palette.length) | 0],
      }));
    };

    const linkDist = 130;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Links first (behind nodes)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.5;
            ctx.strokeStyle = `rgba(79,110,229,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Mouse attraction highlight
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 160) {
          const alpha = (1 - md / 160) * 0.7;
          ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.shadowBlur = 8;
        ctx.shadowColor = n.c;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (raf || !running) return;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    build();
    // For reduced motion, render a single static frame.
    if (prefersReduced) {
      draw();
      stop();
    } else {
      start();
    }

    const onResize = () => {
      build();
    };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !prefersReduced;
        if (running) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
    />
  );
}
