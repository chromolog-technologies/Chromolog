// ─── ProductsCTA ─────────────────────────────────────────────────────────────
// Large premium call-to-action with aurora background and three routes to talk.

import React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, PlayCircle, FileText } from "lucide-react";
import Button from "../ui/Button";
import { easings } from "../../motion/easings";

export default function ProductsCTA({ onConsult, onDemo, onQuote }) {
  return (
    <div className="prodcta-banner">
      <div className="aurora-bg absolute inset-0 opacity-80" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" aria-hidden="true" />
      <div className="prodcta-orb prodcta-orb--1" aria-hidden="true" />
      <div className="prodcta-orb prodcta-orb--2" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: easings.expo }}
        className="relative z-10 text-center"
      >
        <span className="prodcta-eyebrow">Let's build together</span>
        <h2 className="prodcta-title">Ready to Build Your Next Digital Product?</h2>
        <p className="prodcta-sub">
          Whether you need a ready-made SaaS platform or a custom enterprise build, our team
          turns ambitious ideas into products that scale.
        </p>
        <div className="prodcta-actions">
          <Button variant="gradient" size="lg" icon={CalendarCheck} iconPosition="left" magnetic onClick={onConsult}>
            Schedule Consultation
          </Button>
          <Button variant="outline" size="lg" icon={PlayCircle} iconPosition="left" onClick={onDemo}>
            Book a Demo
          </Button>
          <Button variant="ghost" size="lg" icon={FileText} iconPosition="left" onClick={onQuote}>
            Get a Free Quote
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
