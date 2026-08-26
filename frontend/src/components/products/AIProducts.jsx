// ─── AIProducts ──────────────────────────────────────────────────────────────
// AI showcase grid. Each card has an animated gradient icon, business use cases,
// technology chips and benefits. Flip-up reveal of details on hover/focus.

import React from "react";
import { motion } from "framer-motion";
import { Cpu, CheckCircle2 } from "lucide-react";
import { AI_PRODUCTS } from "../../data/products";
import { easings } from "../../motion/easings";

export default function AIProducts() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {AI_PRODUCTS.map((p, i) => {
        const [from, to] = p.gradient;
        return (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-6% 0px" }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: easings.expo }}
            className="ai-card group"
            style={{ "--from": from, "--to": to }}
            tabIndex={0}
          >
            <span className="ai-card-border" aria-hidden="true" />
            <div className="ai-card-icon" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
              <i className={p.icon} aria-hidden="true" />
            </div>

            <h3 className="ai-card-title">{p.name}</h3>
            <p className="ai-card-desc">{p.desc}</p>

            <div className="ai-card-tech">
              {p.tech.map((t) => (
                <span key={t} className="ai-tech-chip"><Cpu className="h-3 w-3" />{t}</span>
              ))}
            </div>

            {/* Reveal drawer */}
            <div className="ai-card-reveal">
              <div className="ai-reveal-block">
                <span className="ai-reveal-head">Use cases</span>
                <div className="ai-reveal-tags">
                  {p.useCases.map((u) => (
                    <span key={u} className="ai-use-tag">{u}</span>
                  ))}
                </div>
              </div>
              <div className="ai-reveal-block">
                <span className="ai-reveal-head">Benefits</span>
                <ul className="ai-benefit-list">
                  {p.benefits.map((b) => (
                    <li key={b}><CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
