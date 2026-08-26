// ─── Hero — Cinematic Sequential Entry ───────────────────────────────────────
// Each element enters separately: badge → heading (word mask) → desc →
//   checkmarks (stagger) → buttons (magnetic) → cards (float in) → 3D scene
// Stack: CSS infinite marquee with momentum + pause on hover
// Mouse parallax on all hero layers

import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight, Brain, Cpu, Cloud, Shield } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { trackCTA } from "../utils/analytics";
import { detectIndustry, trackCTAInterest, trackTechClick } from "../utils/visitor";
import { easings } from "../motion/easings";
import MagneticButton from "./motion/MagneticButton";
import DragMarquee from "./motion/DragMarquee";

const ThreeScene = lazy(() => import("./ThreeScene"));

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Text cycling words ───────────────────────────────────────────────────────
const cyclingWords = [
  "AI Software",
  "Enterprise ERPs",
  "Mobile Apps",
  "Cloud Architectures",
  "Business Workflows",
  "Next-Gen SaaS",
];

// ── Tech stack data (duplicated for seamless marquee loop) ───────────────────
const technologies = [
  { name: "Laravel", icon: "ri-bootstrap-fill", color: "#FF2D20" },
  { name: "Flutter", icon: "ri-flutter-fill", color: "#02569B" },
  { name: "React", icon: "ri-reactjs-fill", color: "#61DAFB" },
  { name: "Python", icon: "ri-code-fill", color: "#3776AB" },
  { name: "OpenAI", icon: "ri-brain-fill", color: "#10a37f" },
  { name: "Gemini", icon: "ri-shining-fill", color: "#7c3aed" },
  { name: "Docker", icon: "ri-instance-fill", color: "#2496ED" },
  { name: "AWS", icon: "ri-cloud-fill", color: "#FF9900" },
  { name: "PostgreSQL", icon: "ri-database-fill", color: "#336791" },
  { name: "Redis", icon: "ri-database-2-fill", color: "#DC382D" },
];

// Duplicate for seamless CSS loop
const marqueeItems = [...technologies, ...technologies];

// ── Personalization data ─────────────────────────────────────────────────────
const personalization = {
  healthcare: {
    badge: "Healthcare AI Systems",
    headline: "Healthcare Workflows",
    copy: "For clinical teams, Chromolog designs secure patient queues, hospital dashboards, biometric staff workflows, and offline-first healthcare apps.",
  },
  education: {
    badge: "Smart Campus ERP",
    headline: "Education Platforms",
    copy: "For schools and universities, Chromolog builds admissions, placements, fee workflows, AI resume scoring, and multi-persona campus dashboards.",
  },
  retail: {
    badge: "Retail POS Intelligence",
    headline: "Retail Operations",
    copy: "For retail teams, Chromolog engineers POS, inventory, billing, branch stock sync, and AI-ready sales analytics.",
  },
  hospitality: {
    badge: "Hospitality Automation",
    headline: "Dining Experiences",
    copy: "For restaurants and hospitality teams, Chromolog connects QR ordering, kitchen displays, billing, inventory, and real-time service flows.",
  },
  enterprise: {
    badge: "Enterprise AI Automation",
    headline: "Enterprise Workflows",
    copy: "For growing organizations, Chromolog builds HRMS, CRM, approval flows, dashboards, document intelligence, and AI automation pipelines.",
  },
};

// ── Word splitter utility ─────────────────────────────────────────────────────
function SplitWords({ text, className, baseDelay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={className} style={{ display: "inline" }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.28em" }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            initial={prefersReducedMotion ? {} : { y: "110%", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.65,
              delay: baseDelay + i * 0.055,
              ease: easings.expo,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ── Main Hero Component ──────────────────────────────────────────────────────
export default function Hero({ navigateToSection }) {
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef(null);
  const [industry, setIndustry] = useState(() => detectIndustry());
  const activePersonalization = personalization[industry];
  const [renderThree, setRenderThree] = useState(false);

  // Defer heavy 3D WebGL bundle until after initial LCP paint
  useEffect(() => {
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const delay = isTouch ? 1800 : 800;
    const timer = setTimeout(() => setRenderThree(true), delay);
    return () => clearTimeout(timer);
  }, []);

  // Mouse parallax raw values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { damping: 36, stiffness: 180, mass: 0.6 });
  const parallaxY = useSpring(rawY, { damping: 36, stiffness: 180, mass: 0.6 });

  // Word cycling
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % cyclingWords.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Visitor personalization
  useEffect(() => {
    const handleProfileChange = () => setIndustry(detectIndustry());
    window.addEventListener("chromolog:visitor-profile", handleProfileChange);
    return () => window.removeEventListener("chromolog:visitor-profile", handleProfileChange);
  }, []);

  // Mouse parallax (desktop only)
  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch || prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      rawX.set(x * 18);
      rawY.set(y * 14);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawX, rawY]);

  const handleStartProject = (e) => {
    e.preventDefault();
    trackCTA("hero_start_project", activePersonalization?.badge || "default");
    trackCTAInterest(`Hero CTA: ${activePersonalization?.badge || "default"}`);
    navigateToSection("contact");
  };

  const handleSeeWork = (e) => {
    e.preventDefault();
    trackCTA("hero_explore_solutions", activePersonalization?.badge || "default");
    trackCTAInterest(`Hero explore: ${activePersonalization?.badge || "default"}`);
    navigateToSection("projects");
  };

  // ── Animation variants ───────────────────────────────────────────────────
  const itemVariant = (delay = 0) => ({
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 24, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.65, delay, ease: easings.expo },
  });

  const cardEnterVariant = (delay = 0) => ({
    initial: prefersReducedMotion ? {} : { opacity: 0, scale: 0.8, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: easings.spring },
  });

  return (
    <>
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center items-center pt-24 pb-16 overflow-hidden bg-bg-dark"
        id="home"
      >
        {/* ── Animated Background Grid ─────────────────────────────────── */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0 animate-grid-drift" />

        {/* Aurora background orbs */}
        <motion.div
          className="absolute top-[-15%] left-[-15%] w-[55vw] h-[55vw] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 65%)",
            filter: "blur(60px)",
            x: useSpring(useMotionValue(0), { damping: 80, stiffness: 60 }),
          }}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[5%] right-[-10%] w-[45vw] h-[45vw] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.12, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ── Left: Text Content ──────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6 lg:pr-6">

            {/* 1. Eyebrow badge */}
            <motion.div
              {...itemVariant(0.1)}
              className="inline-flex"
            >
              <Badge variant="ai" className="px-4 py-1.5 text-xs font-semibold">
                {activePersonalization?.badge || "Digital Systems & Software Engineering Partner"}
              </Badge>
            </motion.div>

            {/* 2. Primary H1 Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-heading max-w-2xl">
                Custom Software &amp; Digital Systems for Growing Businesses
              </h1>
            </div>

            {/* 3. Description */}
            <motion.p
              {...itemVariant(0.42)}
              className="text-base sm:text-lg text-muted-text max-w-xl leading-relaxed font-body"
            >
              {activePersonalization?.copy ||
                "From website upgrades to custom web applications, CRM, HRMS, LMS and business software, Chromolog helps businesses replace manual processes and outdated technology."}
            </motion.p>

            {/* 4. Checkmarks stagger */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.52 } },
              }}
              className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 text-sm text-muted-text max-w-lg"
            >
              {[
                { label: "Replace Excel & WhatsApp Chaos", icon: Cpu },
                { label: "Website Upgrades & Web Apps", icon: Brain },
                { label: "100% Code & IP Ownership", icon: Shield },
                { label: "Kerala & Dubai Technical Team", icon: Cloud },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: prefersReducedMotion ? {} : { opacity: 0, x: -16 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: easings.smooth } },
                  }}
                  className="flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4 text-accent shrink-0" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* 5. CTA Buttons */}
            <motion.div
              {...itemVariant(0.72)}
              className="flex flex-wrap gap-4 pt-4"
            >
              <MagneticButton strength={0.28}>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleStartProject}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Get a Free Technology Consultation
                </Button>
              </MagneticButton>

              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2, ease: easings.snappy }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSeeWork}
                >
                  View Our Work
                </Button>
              </motion.div>
            </motion.div>

          </div>

          {/* ── Right: Three.js Scene + Floating Cards ──────────────────── */}
          <div className="lg:col-span-5 relative w-full aspect-square flex items-center justify-center min-h-[380px] md:min-h-[480px]">

            {/* Three.js Canvas — parallax shift */}
            <motion.div
              className="w-full h-full absolute inset-0 z-10"
              style={{ x: parallaxX, y: parallaxY }}
            >
              {renderThree && (
                <Suspense fallback={<div className="w-full h-full rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />}>
                  <ThreeScene />
                </Suspense>
              )}
            </motion.div>

            {/* Floating Card 1: AI Agent — top left */}
            <motion.div
              {...cardEnterVariant(0.9)}
              style={{ x: parallaxX, y: parallaxY }}
              className="absolute top-0 -left-6 z-20 pointer-events-none select-none max-w-[190px]"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Card variant="glass" className="p-4 border-white/[0.08] shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/20 text-accent">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-white">AI Agent</span>
                    <Badge variant="status" color="success" className="ml-auto text-[9px] px-2 py-0.5">Live</Badge>
                  </div>
                  <p className="text-[10px] text-muted-text font-body">Cognitive OCR and workflow sync active.</p>
                </Card>
              </motion.div>
            </motion.div>

            {/* Floating Card 2: ERP Analytics — bottom right */}
            <motion.div
              {...cardEnterVariant(1.05)}
              style={{
                x: useSpring(useMotionValue(0), { damping: 36, stiffness: 180 }),
                y: useSpring(useMotionValue(0), { damping: 36, stiffness: 180 }),
              }}
              className="absolute bottom-6 -right-4 z-20 pointer-events-none select-none max-w-[210px]"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Card variant="glass" className="p-4 border-white/[0.08] shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-secondary/20 text-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18M9 17V9m4 8V5m4 12v-5"/></svg>
                    </div>
                    <span className="text-xs font-semibold text-white">ERP Analytics</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "78%" }}
                        transition={{ duration: 1.2, delay: 1.2, ease: easings.expo }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-text">
                      <span>Performance</span>
                      <span className="text-accent font-bold">98.4%</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Floating Card 3: Cloud Cluster — bottom left */}
            <motion.div
              {...cardEnterVariant(1.2)}
              className="absolute bottom-6 -left-6 z-20 pointer-events-none select-none max-w-[180px]"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, -12, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Card variant="glass" className="p-4 border-white/[0.08] shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-glow/20 text-purple-glow">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Cluster</span>
                      <span className="text-[9px] text-success font-semibold">99.99% Uptime</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Tech Stack — Infinite Marquee ──────────────────────────────────── */}
      <section
        className="relative py-8 md:py-10 bg-bg-dark/50 border-y border-white/[0.06] overflow-hidden"
        aria-label="Trusted Technologies"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="text-sm font-heading font-semibold text-muted-text uppercase tracking-wider shrink-0 select-none whitespace-nowrap">
            Our Core Stack
          </div>

          {/* Infinite scrolling marquee — draggable with momentum */}
          <DragMarquee speed={44} className="gap-3 md:gap-4 py-2">
            {marqueeItems.map((tech, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => trackTechClick(tech.name)}
                className="core-stack-card flex shrink-0 items-center gap-2 px-4 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.025] text-muted-text hover:text-white-text hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 group"
                aria-label={`Technology: ${tech.name}`}
              >
                <i
                  className={`${tech.icon} text-lg transition-transform duration-300 group-hover:scale-110`}
                  style={{ color: tech.color }}
                />
                <span className="text-xs font-semibold font-heading tracking-wide whitespace-nowrap">
                  {tech.name}
                </span>
              </button>
            ))}
          </DragMarquee>
        </div>
      </section>
    </>
  );
}
