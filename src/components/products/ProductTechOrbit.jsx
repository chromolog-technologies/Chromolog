// ─── ProductTechOrbit ────────────────────────────────────────────────────────
// Interactive technology orbit: Chromolog logo at the center, technologies
// revolving on three rings. Hover a node → orbit pauses, node glows, and the
// side panel shows details. SVG-based (crisp, cheap), respects reduced motion.

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { TECH_STACK, ORBIT_RADIUS } from "../../data/products";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ProductTechOrbit() {
  const [selected, setSelected] = useState(TECH_STACK[0]);
  const [hovered, setHovered] = useState(null);
  const [angle, setAngle] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (prefersReduced) return undefined;
    let raf;
    const tick = () => {
      if (!pausedRef.current) setAngle((a) => (a + 0.0028) % (Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-12">
      {/* Orbit */}
      <div
        className="lg:col-span-6 flex justify-center select-none"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; setHovered(null); }}
      >
        <div className="orbit-stage">
          <svg viewBox="0 0 500 500" className="h-full w-full overflow-visible">
            {[95, 155, 215].map((r, idx) => (
              <circle key={idx} cx="250" cy="250" r={r} fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="3 7" />
            ))}

            {TECH_STACK.map((tech) => {
              const radius = ORBIT_RADIUS[tech.orbit];
              const siblings = TECH_STACK.filter((t) => t.orbit === tech.orbit);
              const base = (siblings.indexOf(tech) / siblings.length) * Math.PI * 2;
              const dir = tech.orbit % 2 === 0 ? -1 : 1;
              const a = base + angle * dir * (1 + tech.orbit * 0.12);
              const cx = 250 + radius * Math.cos(a);
              const cy = 250 + radius * Math.sin(a);
              const isHover = hovered?.id === tech.id;
              const isSel = selected?.id === tech.id;

              return (
                <g key={tech.id} className="cursor-pointer"
                  onClick={() => setSelected(tech)}
                  onMouseEnter={() => setHovered(tech)}
                >
                  {(isHover || isSel) && (
                    <circle cx={cx} cy={cy} r="27" fill="none" stroke={tech.color} strokeWidth="1.5" opacity="0.4" />
                  )}
                  <circle cx={cx} cy={cy} r="20"
                    fill={isSel ? tech.color : "rgba(10,15,29,0.96)"}
                    stroke={isHover || isSel ? tech.color : "rgba(255,255,255,0.1)"}
                    strokeWidth={isSel ? 0 : 1.5}
                    style={{ filter: isHover || isSel ? `drop-shadow(0 0 8px ${tech.color})` : "none" }}
                  />
                  <text x={cx} y={cy + 4} textAnchor="middle"
                    fill={isSel ? "#050816" : isHover ? tech.color : "rgba(255,255,255,0.78)"}
                    fontSize="9" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
                    {tech.abbr}
                  </text>
                  {isHover && (
                    <g>
                      <rect x={cx - 36} y={cy - 46} width="72" height="19" rx="9.5" fill={tech.color} />
                      <text x={cx} y={cy - 33} textAnchor="middle" fill="#050816" fontSize="8.5" fontWeight="800"
                        fontFamily="Space Grotesk, sans-serif">{tech.name}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Center brand */}
            <g>
              <circle cx="250" cy="250" r="42" fill="rgba(5,8,22,0.98)" stroke="rgba(0,229,255,0.4)" strokeWidth="2.5" />
              <circle cx="250" cy="250" r="35" fill="rgba(79,70,229,0.16)" />
              <text x="250" y="248" textAnchor="middle" fill="#00E5FF" fontSize="10.5" fontWeight="800"
                fontFamily="Space Grotesk, sans-serif" letterSpacing="0.06em">CHROMO</text>
              <text x="250" y="261" textAnchor="middle" fill="#00E5FF" fontSize="10.5" fontWeight="800"
                fontFamily="Space Grotesk, sans-serif" letterSpacing="0.06em">LOG</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="orbit-panel"
            style={{ "--c": selected.color }}
          >
            <div className="orbit-panel-head">
              <span className="orbit-panel-badge" style={{ color: selected.color, borderColor: `${selected.color}40`, background: `${selected.color}12` }}>
                {selected.abbr}
              </span>
              <div>
                <h3 className="orbit-panel-title">{selected.name}</h3>
                <span className="orbit-panel-kind">{selected.kind}</span>
              </div>
            </div>
            <p className="orbit-panel-desc">{selected.desc}</p>
            <div className="orbit-panel-pros">
              <span className="orbit-pros-head"><Sparkles className="h-3.5 w-3.5 text-accent" /> Why we use it</span>
              <div className="orbit-pros-grid">
                {selected.pros.map((p) => (
                  <div key={p} className="orbit-pro">
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: selected.color }} />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="orbit-hint">Hover a node to pause the orbit and inspect it.</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
