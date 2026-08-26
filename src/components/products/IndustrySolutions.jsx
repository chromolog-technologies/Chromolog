// ─── IndustrySolutions ───────────────────────────────────────────────────────
// Breadth-at-a-glance grid of every industry we serve. Hover/focus expands the
// tile to reveal its headline solution. Complements the deep Enterprise explorer.

import React from "react";
import { motion } from "framer-motion";
import { INDUSTRIES } from "../../data/products";
import { easings } from "../../motion/easings";

export default function IndustrySolutions({ onSelect }) {
  return (
    <div className="ind-grid">
      {INDUSTRIES.map((ind, i) => (
        <motion.button
          key={ind.id}
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-6% 0px" }}
          transition={{ duration: 0.5, delay: (i % 5) * 0.05, ease: easings.expo }}
          onClick={() => onSelect?.(ind.id)}
          className="ind-tile group"
          style={{ "--c": ind.color }}
        >
          <span className="ind-tile-glow" aria-hidden="true" />
          <span className="ind-tile-icon">
            <i className={ind.icon} aria-hidden="true" />
          </span>
          <span className="ind-tile-name">{ind.name}</span>
          <span className="ind-tile-tag">{ind.tagline}</span>
          <span className="ind-tile-count">{ind.products.length} solutions</span>
        </motion.button>
      ))}
    </div>
  );
}
