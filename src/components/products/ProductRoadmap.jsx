// ─── ProductRoadmap ──────────────────────────────────────────────────────────
// Horizontal, scroll-revealed roadmap timeline across upcoming quarters.

import React from "react";
import { motion } from "framer-motion";
import { ROADMAP } from "../../data/products";
import { easings } from "../../motion/easings";

const TONE = {
  purple: "#7c3aed",
  secondary: "#06b6d4",
  success: "#22c55e",
  accent: "#00e5ff",
};

export default function ProductRoadmap() {
  return (
    <div className="roadmap-wrap">
      <div className="roadmap-line" aria-hidden="true" />
      <div className="roadmap-track">
        {ROADMAP.map((col, i) => {
          const c = TONE[col.tone] || "#00e5ff";
          return (
            <motion.div
              key={col.period}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: easings.expo }}
              className="roadmap-col"
              style={{ "--c": c }}
            >
              <div className="roadmap-node" />
              <span className="roadmap-period">{col.period}</span>
              <h3 className="roadmap-theme">{col.theme}</h3>
              <ul className="roadmap-items">
                {col.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
