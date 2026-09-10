// ─── Hero — Cinematic Sequential Entry ───────────────────────────────────────
// Each element enters separately: badge → heading (word mask) → desc →
//   checkmarks (stagger) → buttons (magnetic) → cards (float in) → 3D scene
// Stack: CSS infinite marquee with momentum + pause on hover
// Mouse parallax on all hero layers

import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { Code2, Smartphone, Cloud, Compass, Brain, BarChart3 } from "lucide-react";
import { trackCTA } from "../utils/analytics";
import { trackCTAInterest } from "../utils/visitor";
import { easings } from "../motion/easings";

const ThreeScene = lazy(() => import("./ThreeScene"));

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Feature Cards Data ───────────────────────────────────────────────────────
const featureCards = [
  {
    icon: Code2,
    title: "Custom Software Development",
    description: "Bespoke systems built around your exact business workflows.",
  },
  {
    icon: Smartphone,
    title: "Web & Mobile Apps",
    description: "Fast web portals and Flutter apps for teams and customers.",
  },
  {
    icon: Cloud,
    title: "CRM, ERP & HRMS",
    description: "Replace Excel and WhatsApp chaos with connected software.",
  },
  {
    icon: Compass,
    title: "Website Development & Redesign",
    description: "SEO-ready websites that turn visitors into enquiries.",
  },
];



export default function Hero({ navigateToSection }) {
  const heroRef = useRef(null);
  const [renderThree, setRenderThree] = useState(false);

  useEffect(() => {
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const delay = isTouch ? 1200 : 400;
    const timer = setTimeout(() => setRenderThree(true), delay);
    return () => clearTimeout(timer);
  }, []);

  // Mouse parallax springs
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { damping: 36, stiffness: 180, mass: 0.6 });
  const parallaxY = useSpring(rawY, { damping: 36, stiffness: 180, mass: 0.6 });

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch || prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      rawX.set(x * 16);
      rawY.set(y * 12);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawX, rawY]);

  const handleStartProject = (e) => {
    e.preventDefault();
    trackCTA("hero_explore_services", "reference_hero");
    trackCTAInterest("Hero CTA: Explore Our Services");
    navigateToSection("services");
  };

  const handleSeeWork = (e) => {
    e.preventDefault();
    trackCTA("hero_view_our_work", "reference_hero");
    trackCTAInterest("Hero CTA: View Our Work");
    navigateToSection("projects");
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-between pt-28 pb-16 overflow-hidden bg-[#060818]"
      id="home"
    >
      {/* ── Background Glow Orbs & Grid ───────────────────────────────── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] pointer-events-none z-0" />

      <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] max-w-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none z-0 animate-orb-float" />
      <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] max-w-[550px] rounded-full bg-purple-600/20 blur-[130px] pointer-events-none z-0 animate-orb-float-slow" />
      <div className="absolute bottom-[20%] left-[30%] w-[35vw] h-[35vw] max-w-[500px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none z-0" />

      {/* ── Top Hero Content Container ────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-16">

        {/* Left Column: Copy & CTAs */}
        <div className="lg:col-span-7 flex flex-col text-left space-y-6 lg:pr-8">
          
          {/* Eyebrow tag */}
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easings.expo }}
            className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-purple-400 font-heading"
          >
            CUSTOM SOFTWARE COMPANY · KOCHI, KERALA
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: easings.expo }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.1] font-heading max-w-2xl"
          >
            Custom Software &amp;{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Digital Systems
            </span>{" "}
            for Growing Businesses
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: easings.expo }}
            className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-body font-normal"
          >
            Chromolog Technologies builds web applications, CRM, ERP, HRMS and business automation software for companies in Kerala, Dubai and beyond — replacing manual Excel and WhatsApp workflows with systems you own.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: easings.expo }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <motion.button
              onClick={handleStartProject}
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-full text-base font-heading font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-xl shadow-purple-600/30"
            >
              Explore Our Services
            </motion.button>

            <motion.button
              onClick={handleSeeWork}
              whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.12)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-full text-base font-heading font-semibold text-white bg-white/5 border border-white/20 transition-all duration-300 backdrop-blur-md"
            >
              View Our Work
            </motion.button>
          </motion.div>

        </div>

        {/* Right Column: 3D Scene Pedestal Graphics & Floating Overlay Cards */}
        <div className="lg:col-span-5 relative w-full aspect-square flex items-center justify-center min-h-[380px] md:min-h-[480px]">
          
          {/* 3D Particle Constellation Sphere Scene */}
          <motion.div
            className="w-full h-full absolute inset-0 z-10"
            style={{ x: parallaxX, y: parallaxY }}
          >
            {renderThree && (
              <Suspense fallback={<div className="w-full h-full rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />}>
                <ThreeScene />
              </Suspense>
            )}
          </motion.div>

          {/* Floating Card 1: AI Agent (Top Left) */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: easings.expo }}
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute top-2 -left-2 sm:-left-6 z-20 pointer-events-none select-none max-w-[210px]"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-[#0a0d1d]/85 border border-white/15 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold font-heading text-white">AI Agent</span>
                <div className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-body leading-tight">
                Cognitive OCR and workflow sync active.
              </p>
            </motion.div>
          </motion.div>

          {/* Floating Card 2: Cluster Uptime (Bottom Left) */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0, ease: easings.expo }}
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute bottom-2 -left-2 sm:-left-6 z-20 pointer-events-none select-none min-w-[170px]"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="bg-[#0a0d1d]/85 border border-white/15 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold font-heading text-white block">Cluster</span>
                <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">99.99% Uptime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating Card 3: ERP Analytics (Bottom Right) */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2, ease: easings.expo }}
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute bottom-2 -right-2 sm:-right-6 z-20 pointer-events-none select-none min-w-[200px]"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="bg-[#0a0d1d]/85 border border-white/15 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold font-heading text-white">ERP Analytics</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "84%" }}
                  transition={{ duration: 1.2, delay: 1.4, ease: easings.expo }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="text-slate-400">Performance</span>
                <span className="text-cyan-400 font-bold">98.4%</span>
              </div>
            </motion.div>
          </motion.div>

        </div>

      </div>

      {/* ── 4 Glassmorphism Feature Cards Grid ─────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 w-full z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1, ease: easings.expo }}
                className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-6 hover:border-cyan-400/60 hover:bg-white/[0.08] transition-all duration-300 shadow-[0_8px_32px_rgba(0,229,255,0.12)] group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2 leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm font-body text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

