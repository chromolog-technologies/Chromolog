// ─── ComingSoon ──────────────────────────────────────────────────────────────
// Future roadmap products. Each tile shows a status badge, estimated release,
// category and a short description. Subtle "in the lab" shimmer treatment.

import React from "react";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { COMING_SOON } from "../../data/products";
import { easings } from "../../motion/easings";

export default function ComingSoon() {
  return (
    <div className="soon-grid">
      {COMING_SOON.map((p, i) => (
        <motion.article
          key={p.id}
          initial={{ opacity: 0, y: 24, filter: "blur(5px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-6% 0px" }}
          transition={{ duration: 0.5, delay: (i % 5) * 0.05, ease: easings.expo }}
          className="soon-card group"
        >
          <span className="soon-shimmer" aria-hidden="true" />
          <div className="soon-top">
            <span className="soon-icon">
              <i className={p.icon} aria-hidden="true" />
            </span>
            <StatusBadge status={p.status} />
          </div>
          <span className="soon-cat">{p.category}</span>
          <h3 className="soon-title">{p.name}</h3>
          <p className="soon-desc">{p.desc}</p>
          <div className="soon-release">
            <CalendarClock className="h-3.5 w-3.5 text-accent" />
            <span>Est. {p.release}</span>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
