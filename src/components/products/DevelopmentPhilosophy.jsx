// ─── DevelopmentPhilosophy ───────────────────────────────────────────────────
// Six principles that define how Chromolog builds products.

import React from "react";
import { motion } from "framer-motion";
import { PHILOSOPHY } from "../../data/products";
import { easings } from "../../motion/easings";

export default function DevelopmentPhilosophy() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {PHILOSOPHY.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 24, filter: "blur(5px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-6% 0px" }}
          transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: easings.expo }}
          className="phil-card group"
        >
          <span className="phil-num">{String(i + 1).padStart(2, "0")}</span>
          <span className="phil-icon">
            <i className={p.icon} aria-hidden="true" />
          </span>
          <h3 className="phil-title">{p.title}</h3>
          <p className="phil-desc">{p.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}
