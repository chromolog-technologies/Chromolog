// ─── EnterpriseSolutions ─────────────────────────────────────────────────────
// Industry explorer: pick an industry from the rail, panel expands to reveal
// products, technologies, business benefits and a case study. Animated with
// framer-motion; keyboard accessible.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, TrendingUp } from "lucide-react";
import { INDUSTRIES } from "../../data/products";
import { easings } from "../../motion/easings";

export default function EnterpriseSolutions() {
  const [active, setActive] = useState(INDUSTRIES[0].id);
  const industry = INDUSTRIES.find((i) => i.id === active) || INDUSTRIES[0];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Industry rail */}
      <div className="lg:col-span-4">
        <div className="ent-rail" role="tablist" aria-label="Industries">
          {INDUSTRIES.map((ind) => {
            const isActive = ind.id === active;
            return (
              <button
                key={ind.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(ind.id)}
                className={`ent-rail-item ${isActive ? "is-active" : ""}`}
                style={{ "--c": ind.color }}
              >
                <span className="ent-rail-icon">
                  <i className={ind.icon} aria-hidden="true" />
                </span>
                <span className="ent-rail-label">{ind.name}</span>
                <ArrowRight className={`ent-rail-arrow ${isActive ? "is-active" : ""}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={industry.id}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: easings.expo }}
            className="ent-panel"
            style={{ "--c": industry.color }}
          >
            <span className="ent-panel-glow" aria-hidden="true" />
            <div className="ent-panel-head">
              <span className="ent-panel-icon">
                <i className={industry.icon} aria-hidden="true" />
              </span>
              <div>
                <h3 className="ent-panel-title">{industry.name}</h3>
                <p className="ent-panel-tagline">{industry.tagline}</p>
              </div>
            </div>

            <div className="ent-panel-grid">
              <div className="ent-block">
                <h4 className="ent-block-head">Products</h4>
                <ul className="ent-list">
                  {industry.products.map((p) => (
                    <li key={p}><span className="ent-bullet" />{p}</li>
                  ))}
                </ul>
              </div>

              <div className="ent-block">
                <h4 className="ent-block-head">Technologies</h4>
                <div className="ent-tech-wrap">
                  {industry.technologies.map((t) => (
                    <span key={t} className="ent-tech">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ent-block">
              <h4 className="ent-block-head">Business Benefits</h4>
              <div className="ent-benefit-grid">
                {industry.benefits.map((b) => (
                  <div key={b} className="ent-benefit">
                    <Check className="h-4 w-4 shrink-0" style={{ color: industry.color }} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ent-case">
              <TrendingUp className="h-5 w-5 shrink-0" style={{ color: industry.color }} />
              <div>
                <div className="ent-case-top">
                  <strong>{industry.caseStudy.title}</strong>
                  <span className="ent-case-metric" style={{ color: industry.color }}>
                    {industry.caseStudy.metric}
                  </span>
                </div>
                <p>{industry.caseStudy.desc}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
