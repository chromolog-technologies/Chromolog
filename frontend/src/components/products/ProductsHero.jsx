// ─── ProductsHero ────────────────────────────────────────────────────────────
// Immersive hero: neural-network canvas + aurora/gradient-mesh + floating glass
// product chips. Headline enters word-by-word; two premium CTAs.

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import NeuralBackground from "./NeuralBackground";
import { easings } from "../../motion/easings";
import { heroWordVariant } from "../../motion/variants";

const HEADLINE = ["Building", "Products", "That", "Shape", "The", "Future"];

const FLOATERS = [
  { label: "AI Resume Analyzer", icon: "ri-file-user-line", pos: "top-[18%] left-[6%]", delay: 0, color: "#00e5ff" },
  { label: "Alphagrew ERP", icon: "ri-graduation-cap-line", pos: "top-[30%] right-[7%]", delay: 0.6, color: "#4f46e5" },
  { label: "HumaNode HRMS", icon: "ri-team-line", pos: "bottom-[24%] left-[9%]", delay: 1.2, color: "#06b6d4" },
  { label: "AI CRM", icon: "ri-customer-service-2-line", pos: "bottom-[30%] right-[8%]", delay: 1.8, color: "#7c3aed" },
];

const STATS = [
  { value: "16+", label: "Products & Platforms" },
  { value: "9", label: "Industries Served" },
  { value: "13", label: "Core Technologies" },
  { value: "AI-First", label: "Engineering DNA" },
];

export default function ProductsHero({ onExplore, onDemo }) {
  return (
    <section
      id="products-hero"
      className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28"
    >
      {/* Layered animated background */}
      <div className="absolute inset-0 z-0">
        <NeuralBackground />
        <div className="absolute inset-0 aurora-bg opacity-70" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] animate-grid-drift" />
        {/* Gradient mesh orbs */}
        <div className="absolute top-[-15%] left-[10%] h-[42vw] w-[42vw] rounded-full bg-primary/15 blur-[130px] animate-orb-float" />
        <div className="absolute bottom-[-20%] right-[8%] h-[38vw] w-[38vw] rounded-full bg-purple-glow/12 blur-[120px] animate-orb-float-slow" />
        <div className="absolute top-[30%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-accent/8 blur-[110px]" />
        {/* Vignette + fade to page */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/40 via-transparent to-bg-dark" />
      </div>

      {/* Floating glass product chips (desktop) */}
      {FLOATERS.map((f) => (
        <motion.div
          key={f.label}
          className={`absolute z-10 hidden lg:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl ${f.pos}`}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -12, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 0.6 + f.delay * 0.15 },
            scale: { duration: 0.8, delay: 0.6 + f.delay * 0.15 },
            y: { duration: 6 + f.delay, repeat: Infinity, ease: "easeInOut", delay: f.delay },
          }}
          style={{ boxShadow: `0 10px 40px ${f.color}22` }}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-lg"
            style={{ color: f.color, background: `${f.color}18`, border: `1px solid ${f.color}33` }}
          >
            <i className={f.icon} />
          </span>
          <span className="font-heading text-xs font-bold text-white/90">{f.label}</span>
        </motion.div>
      ))}

      <div className="relative z-20 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easings.expo }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            The Chromolog Product Ecosystem
          </span>
        </motion.div>

        <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
          <span className="sr-only">Building Products That Shape The Future</span>
          <span aria-hidden="true" className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1">
            {HEADLINE.map((word, i) => (
              <motion.span
                key={word + i}
                custom={i}
                variants={heroWordVariant}
                initial="hidden"
                animate="visible"
                className={i === 5 || i === 1 ? "hero-gradient-text" : ""}
                style={{ display: "inline-block", transformStyle: "preserve-3d" }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: easings.expo }}
          className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-text sm:text-lg"
        >
          From AI-powered platforms to enterprise software and SaaS products, we build
          digital solutions designed to scale businesses worldwide.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: easings.expo }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Button variant="gradient" size="lg" icon={ArrowRight} magnetic onClick={onExplore}>
            Explore Products
          </Button>
          <Button variant="outline" size="lg" icon={PlayCircle} iconPosition="left" onClick={onDemo}>
            Request Demo
          </Button>
        </motion.div>

        {/* Stat row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.8 } } }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-5 backdrop-blur-md"
            >
              <div className="hero-gradient-text font-heading text-2xl font-extrabold sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-muted-text">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
