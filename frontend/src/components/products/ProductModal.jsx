// ─── ProductModal ────────────────────────────────────────────────────────────
// Premium product detail modal. Sections: Overview, Problem Solved, Target
// Audience, Features, Technology Stack, Screenshots (mock), Architecture,
// Future Roadmap + Demo CTA. Focus-trapped, scroll-locked, Escape to close.

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowUpRight, Target, Users, Layers, Cpu, GitBranch, Rocket, Sparkles, PlayCircle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { easings } from "../../motion/easings";

function Section({ icon: Icon, title, accent, children }) {
  return (
    <div className="pm-section">
      <h4 className="pm-section-head">
        <Icon className="h-4 w-4" style={{ color: accent }} />
        {title}
      </h4>
      {children}
    </div>
  );
}

export default function ProductModal({ product, onClose, onDemo }) {
  const panelRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  useEffect(() => {
    if (!product) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog
    const t = setTimeout(() => panelRef.current?.focus(), 40);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <div className="pm-overlay-wrap" role="dialog" aria-modal="true" aria-labelledby="pm-title">
          <motion.div
            className="pm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="pm-panel"
            style={{ "--accent": product.accent, "--from": product.gradient[0], "--to": product.gradient[1] }}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.4, ease: easings.expo }}
          >
            {/* Header banner */}
            <div className="pm-banner">
              <span className="pm-banner-glow" aria-hidden="true" />
              <button className="pm-close" onClick={onClose} aria-label="Close details">
                <X className="h-5 w-5" />
              </button>
              <div className="pm-banner-inner">
                <span className="pm-banner-icon">
                  <i className={product.icon} aria-hidden="true" />
                </span>
                <div className="pm-banner-meta">
                  <div className="pm-banner-badges">
                    <span className="pm-cat">{product.category}</span>
                    <StatusBadge status={product.status} />
                  </div>
                  <h3 id="pm-title" className="pm-title">{product.name}</h3>
                  <p className="pm-tagline">{product.tagline}</p>
                </div>
              </div>
            </div>

            <div className="pm-body">
              <Section icon={Sparkles} title="Overview" accent={product.accent}>
                <p className="pm-text">{product.detail.overview}</p>
              </Section>

              <div className="pm-two-col">
                <Section icon={Target} title="Problem Solved" accent={product.accent}>
                  <p className="pm-text">{product.detail.problem}</p>
                </Section>
                <Section icon={Users} title="Target Audience" accent={product.accent}>
                  <div className="pm-chip-wrap">
                    {product.detail.audience.map((a) => (
                      <span key={a} className="pm-chip">{a}</span>
                    ))}
                  </div>
                </Section>
              </div>

              <Section icon={Layers} title="Features" accent={product.accent}>
                <div className="pm-feature-groups">
                  {product.detail.featureGroups.map((g) => (
                    <div key={g.title} className="pm-feature-group">
                      <span className="pm-fg-head">{g.title}</span>
                      <ul className="pm-fg-list">
                        {g.items.map((it) => (
                          <li key={it}><span className="pm-fg-dot" style={{ background: product.accent }} />{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>

              <div className="pm-two-col">
                <Section icon={Cpu} title="Technology Stack" accent={product.accent}>
                  <div className="pm-chip-wrap">
                    {product.tech.map((t) => (
                      <span key={t} className="pm-tech">{t}</span>
                    ))}
                  </div>
                </Section>
                <Section icon={Rocket} title="Future Roadmap" accent={product.accent}>
                  <ul className="pm-roadmap-list">
                    {product.detail.roadmap.map((r) => (
                      <li key={r}><ArrowUpRight className="h-3.5 w-3.5 shrink-0" style={{ color: product.accent }} />{r}</li>
                    ))}
                  </ul>
                </Section>
              </div>

              {/* Screenshots (mock) */}
              <Section icon={PlayCircle} title="Screenshots" accent={product.accent}>
                <div className="pm-shots">
                  {[0, 1, 2].map((n) => (
                    <div key={n} className="pm-shot" style={{ "--accent": product.accent }}>
                      <div className="pm-shot-bar"><span /><span /><span /></div>
                      <div className="pm-shot-body">
                        <div className="pm-shot-line" style={{ width: "60%" }} />
                        <div className="pm-shot-line" style={{ width: "85%" }} />
                        <div className="pm-shot-grid">
                          {[0, 1, 2, 3].map((k) => <span key={k} />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={GitBranch} title="Architecture" accent={product.accent}>
                <ul className="pm-arch-list">
                  {product.detail.architecture.map((a) => (
                    <li key={a}><span className="pm-arch-node" style={{ background: product.accent }} />{a}</li>
                  ))}
                </ul>
              </Section>

              {/* Footer CTA */}
              <div className="pm-footer">
                <div>
                  <strong>Interested in {product.name}?</strong>
                  <p>Get a walkthrough tailored to your business.</p>
                </div>
                <div className="pm-footer-actions">
                  <button className="pm-demo-btn" onClick={() => onDemo?.(product)}>
                    <PlayCircle className="h-4 w-4" /> {product.hasDemo ? "Request Demo" : "Talk to Us"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
