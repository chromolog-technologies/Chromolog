// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Product lifecycle badge (Live, Featured, Enterprise, In Development, Concept,
// Coming Soon, Beta). Tone maps to the Chromolog color system.

import React from "react";
import { STATUS } from "../../data/products";

const TONES = {
  success: "bg-success/10 border-success/25 text-success",
  accent: "bg-accent/10 border-accent/25 text-accent",
  primary: "bg-primary/12 border-primary/30 text-[#a5b4fc]",
  secondary: "bg-secondary/10 border-secondary/25 text-secondary",
  purple: "bg-purple-glow/12 border-purple-glow/30 text-[#c4b5fd]",
  warning: "bg-warning/10 border-warning/25 text-warning",
  muted: "bg-white/[0.05] border-white/15 text-muted-text",
};

export default function StatusBadge({ status, className = "", pulse = true }) {
  const meta = STATUS[status] || STATUS.concept;
  const tone = TONES[meta.tone] || TONES.muted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-[0.08em] ${tone} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {meta.label}
    </span>
  );
}
