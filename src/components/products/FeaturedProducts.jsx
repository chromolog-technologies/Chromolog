// ─── FeaturedProducts ────────────────────────────────────────────────────────
// Large premium showcase cards with gradient borders, spotlight glow, feature
// pills and a demo/detail CTA. First matching card is rendered as a wide
// "spotlight" hero card. Empty-state handled gracefully.

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, PlayCircle, SearchX } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { easings } from "../../motion/easings";

function ProductCard({ product, onOpen, featured = false }) {
  const [from, to] = product.gradient;
  const featureCount = featured ? 6 : 4;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.6, ease: easings.expo }}
      className={`prod-card group ${featured ? "prod-card--spotlight" : ""}`}
      style={{ "--from": from, "--to": to, "--accent": product.accent }}
    >
      {/* Gradient border + spotlight glow */}
      <span className="prod-card-border" aria-hidden="true" />
      <span className="prod-card-spot" aria-hidden="true" />

      <div className={`prod-card-inner ${featured ? "md:flex md:items-center md:gap-10" : ""}`}>
        <div className={featured ? "md:flex-1" : ""}>
          <div className="flex items-center justify-between gap-3">
            <span
              className="prod-card-icon"
              style={{ color: product.accent, background: `${product.accent}14`, borderColor: `${product.accent}30` }}
            >
              <i className={product.icon} aria-hidden="true" />
            </span>
            <StatusBadge status={product.status} />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span className="prod-card-cat">{product.category}</span>
          </div>
          <h3 className={`prod-card-title ${featured ? "md:text-3xl" : ""}`}>{product.name}</h3>
          <p className="prod-card-tagline">{product.tagline}</p>
          <p className="prod-card-desc">{product.description}</p>

          {/* Feature pills */}
          <div className="prod-card-features">
            {product.features.slice(0, featureCount).map((f) => (
              <span key={f} className="prod-feat-pill">{f}</span>
            ))}
            {product.features.length > featureCount && (
              <span className="prod-feat-pill prod-feat-pill--more">
                +{product.features.length - featureCount} more
              </span>
            )}
          </div>

          {/* Tech row */}
          <div className="prod-card-tech">
            {product.tech.map((t) => (
              <span key={t} className="prod-tech-chip">{t}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="prod-card-actions">
            <button className="prod-btn-primary" onClick={() => onOpen(product)}>
              View Details <ArrowUpRight className="h-4 w-4" />
            </button>
            {product.hasDemo && (
              <button className="prod-btn-ghost" onClick={() => onOpen(product)}>
                <PlayCircle className="h-4 w-4" /> Demo
              </button>
            )}
          </div>
        </div>

        {/* Spotlight card mock preview */}
        {featured && (
          <div className="mt-8 md:mt-0 md:w-[42%]">
            <div className="prod-spotlight-mock" style={{ "--accent": product.accent }}>
              <div className="prod-mock-bar">
                <span /> <span /> <span />
                <em>{product.name}</em>
              </div>
              <div className="prod-mock-body">
                {product.detail.featureGroups?.[0]?.items.slice(0, 4).map((it, i) => (
                  <div key={it} className="prod-mock-row" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="prod-mock-dot" />
                    <span className="prod-mock-line" style={{ width: `${70 - i * 8}%` }} />
                  </div>
                ))}
                <div className="prod-mock-chart">
                  {[42, 68, 55, 80, 62, 90, 74].map((h, i) => (
                    <span key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default function FeaturedProducts({ products, onOpen }) {
  if (!products.length) {
    return (
      <div className="prod-empty">
        <SearchX className="h-10 w-10 text-muted-text/50" />
        <p className="mt-4 font-heading text-lg font-bold text-white">No products match your filters</p>
        <p className="mt-1 text-sm text-muted-text">Try clearing a filter or searching a different term.</p>
      </div>
    );
  }

  const [first, ...rest] = products;

  return (
    <div className="space-y-8">
      <ProductCard product={first} onOpen={onOpen} featured />
      {rest.length > 0 && (
        <div className="grid gap-8 md:grid-cols-2">
          {rest.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
