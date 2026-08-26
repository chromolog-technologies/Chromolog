// ─── DragMarquee Component ───────────────────────────────────────────────────
// Infinite horizontal marquee with pointer dragging + momentum.
// IMPORTANT: pass children already duplicated once (item set × 2) so the track
// can wrap seamlessly at its halfway point — same contract as a CSS marquee.
// Auto-scrolls via rAF, pauses on hover, grab-cursor dragging with inertia,
// pauses when the tab is hidden. Reduced motion → static row, no auto-scroll.

import React, { useEffect, useRef, useState } from "react";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {React.ReactNode} props.children - one set of items; duplicated inside
 * @param {number} [props.speed=40] - auto-scroll speed in px/sec
 * @param {string} [props.className] - track wrapper classes (gap, padding…)
 * @param {boolean} [props.edgeFade=true] - fade content at both edges
 */
export default function DragMarquee({ children, speed = 40, className = "", edgeFade = true }) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const halfRef = useRef(0);
  const hoverRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, lastX: 0, lastT: 0, velocity: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);

    if (prefersReducedMotion) {
      return () => window.removeEventListener("resize", measure);
    }

    let raf = 0;
    let last = performance.now();
    let hidden = document.hidden;

    const apply = () => {
      const half = halfRef.current || 1;
      // Seamless wrap: keep offset in [-half, 0)
      let o = offsetRef.current % half;
      if (o > 0) o -= half;
      offsetRef.current = o;
      track.style.transform = `translate3d(${o}px, 0, 0)`;
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const d = dragRef.current;

      if (!hidden) {
        if (d.active) {
          // position driven by pointermove
        } else if (Math.abs(d.velocity) > 8) {
          // Momentum after release
          offsetRef.current += d.velocity * dt;
          d.velocity *= Math.pow(0.06, dt); // exponential friction
          apply();
        } else if (!hoverRef.current) {
          offsetRef.current -= speed * dt;
          apply();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      hidden = document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [speed]);

  // ── Pointer drag handlers ──────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (prefersReducedMotion) return;
    const d = dragRef.current;
    d.active = true;
    d.startX = e.clientX;
    d.startOffset = offsetRef.current;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.velocity = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active || !trackRef.current) return;
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dt = Math.max(now - d.lastT, 1) / 1000;
    d.velocity = dx / dt; // px/sec
    d.lastX = e.clientX;
    d.lastT = now;

    offsetRef.current = d.startOffset + (e.clientX - d.startX);
    const half = halfRef.current || 1;
    let o = offsetRef.current % half;
    if (o > 0) o -= half;
    offsetRef.current = o;
    // Recompute startX/startOffset after wrap so drag stays continuous
    d.startX = e.clientX;
    d.startOffset = o;
    trackRef.current.style.transform = `translate3d(${o}px, 0, 0)`;
  };

  const endDrag = () => {
    dragRef.current.active = false;
    setDragging(false);
  };

  return (
    <div
      className={`marquee-drag ${dragging ? "is-dragging" : ""} w-full overflow-hidden relative`}
      style={
        edgeFade
          ? {
              maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            }
          : undefined
      }
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div ref={trackRef} className={`flex items-center ${className}`} style={{ width: "max-content", willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
