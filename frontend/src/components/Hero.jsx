// ─── Hero — Cinematic Sequential Entry ───────────────────────────────────────
// Each element enters separately: badge → heading (word mask) → desc →
//   checkmarks (stagger) → buttons (magnetic) → cards (float in) → Galaxy scene
// Stack: CSS infinite marquee with momentum + pause on hover
// Mouse parallax on all hero layers

import React, { useState, useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { Code2, Smartphone, Cloud, Compass } from "lucide-react";
import { trackCTA } from "../utils/analytics";
import { trackCTAInterest } from "../utils/visitor";
import { easings } from "../motion/easings";
import GalaxyScene from "./GalaxyScene";

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
      className="relative min-h-screen flex flex-col justify-between pt-20 sm:pt-28 pb-8 sm:pb-16 overflow-hidden bg-[#060818]"
      id="home"
    >
      {/* ── Galaxy Canvas Background (Full Home Section Background) ───────── */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        {renderThree && <GalaxyScene />}
      </div>

      {/* ── Background Glow Orbs & Grid ───────────────────────────────── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-[1]" />

      <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] max-w-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none z-[1]" />
      <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] max-w-[550px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-[1]" />

      {/* ── Top Hero Content Container ────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center mb-8 sm:mb-16 pointer-events-none">

        {/* Left Column: Copy & CTAs */}
        <div className="lg:col-span-8 flex flex-col text-left space-y-3.5 sm:space-y-6 lg:pr-8">
          
          {/* Eyebrow tag */}
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easings.expo }}
            className="text-[10px] sm:text-sm font-semibold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-purple-400 font-heading"
          >
            CUSTOM SOFTWARE COMPANY · KOCHI, KERALA
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: easings.expo }}
            className="text-2xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.18] sm:leading-[1.1] font-heading max-w-2xl drop-shadow-md"
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
            className="text-xs sm:text-lg text-slate-300 max-w-xl leading-relaxed font-body font-normal drop-shadow"
          >
            Chromolog Technologies builds web applications, CRM, ERP, HRMS and business automation software for companies in Kerala, Dubai and beyond — replacing manual Excel and WhatsApp workflows with systems you own.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: easings.expo }}
            className="flex flex-row items-center gap-2.5 sm:gap-4 pt-1 sm:pt-4 pointer-events-auto"
          >
            <motion.button
              onClick={handleStartProject}
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 sm:flex-none text-center px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-base font-heading font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-xl shadow-purple-600/30"
            >
              Explore Our Services
            </motion.button>

            <motion.button
              onClick={handleSeeWork}
              whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.12)" }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 sm:flex-none text-center px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-base font-heading font-semibold text-white bg-white/5 border border-white/20 transition-all duration-300 backdrop-blur-md"
            >
              View Our Work
            </motion.button>
          </motion.div>

        </div>

      </div>

      {/* ── 4 Glassmorphism Feature Cards Grid ─────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full z-10 pointer-events-none">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1, ease: easings.expo }}
                className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-cyan-400/60 hover:bg-white/[0.08] transition-all duration-300 shadow-[0_8px_32px_rgba(0,229,255,0.12)] group pointer-events-auto cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2 sm:mb-5 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                  <Icon className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xs sm:text-lg font-heading font-bold text-white mb-1 leading-snug line-clamp-1 sm:line-clamp-none">
                  {card.title}
                </h3>
                <p className="text-[10px] sm:text-sm font-body text-slate-400 leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
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

