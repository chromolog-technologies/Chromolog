// ─── AIShowcase — GSAP Pinned Scroll Storytelling (Desktop) ─────────────────
// Desktop: section pins, each scroll step reveals next AI capability
// Mobile: normal vertical tab layout (unchanged)
// Central visual + tab text changes on scroll step

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageSquare, LineChart, FileText, Bot, Database, Zap, Sparkles, Check } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import { easings } from "../motion/easings";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const aiCapabilities = [
  {
    id: "agents",
    title: "Autonomous AI Agents",
    desc: "Self-executing digital workers that parse documents, email clients, and trigger database updates — with zero human intervention.",
    longDesc: "Deploy digital workers that execute multi-step operational tasks. Our agents process incoming inquiries, classify documents based on semantic content, retrieve contextual files, and populate ERP databases or HR platforms automatically with 99% accuracy.",
    icon: Bot,
    glow: "primary",
    features: ["Hands-Off Workflows", "99% Accuracy", "Granular Logging"],
    visual: "agents",
  },
  {
    id: "predictive",
    title: "Predictive Analytics",
    desc: "Custom machine learning models for risk scoring, trend forecasting, and competency analysis.",
    longDesc: "Stop guessing your business trends. We design custom ML pipelines that forecast customer behavior, score student competencies, optimize inventory stocking intervals, and surface key anomalies in transaction reports.",
    icon: LineChart,
    glow: "secondary",
    features: ["Placement Scoring", "Inventory Optimization", "Anomaly Alerts"],
    visual: "predictive",
  },
  {
    id: "nlp",
    title: "Cognitive NLP & RAG",
    desc: "Document intelligence to automatically read invoices, match resume criteria, and search knowledge vaults.",
    longDesc: "Read, extract, and categorize text data automatically. We integrate LLM APIs and local fine-tuned language models to extract complex metadata from raw PDFs, verify resumes against job requirements, and drive semantic search inside custom knowledge vaults.",
    icon: MessageSquare,
    glow: "accent",
    features: ["RAG Search Pipelines", "Invoice Parsing", "Resume Screening"],
    visual: "nlp",
  },
  {
    id: "vision",
    title: "Document Intelligence (OCR)",
    desc: "Neural network vision engines that pull structured keys out of unstructured files and images.",
    longDesc: "Transform raw images, scanned receipts, and medical reports into structured, actionable data. Our OCR pipelines handle layout analysis, metadata tagging, and seamless ERP integration.",
    icon: FileText,
    glow: "primary",
    features: ["Receipt Parsing", "Layout Analysis", "Metadata Tagging"],
    visual: "vision",
  },
];

// ── Visual for each capability ─────────────────────────────────────────────
function CapabilityVisual({ id }) {
  if (id === "agents") {
    return (
      <div className="flex items-center gap-4 text-xs font-semibold relative w-full justify-around flex-wrap">
        <div className="flex flex-col items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-muted-text text-[10px]">Inbound Email</span>
        </div>
        <div className="h-0.5 bg-white/[0.08] flex-1 min-w-[30px] relative overflow-hidden">
          <motion.div
            className="absolute top-0 bottom-0 left-0 w-3 bg-accent rounded-full"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-2xl shadow-lg shadow-primary/10">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-white flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-white text-[11px]">AI Agent</span>
        </div>
        <div className="h-0.5 bg-white/[0.08] flex-1 min-w-[30px] relative overflow-hidden">
          <motion.div
            className="absolute top-0 bottom-0 left-0 w-3 bg-accent rounded-full"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.75 }}
          />
        </div>
        <div className="flex flex-col items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <span className="text-muted-text text-[10px]">ERP Update</span>
        </div>
      </div>
    );
  }

  if (id === "predictive") {
    return (
      <div className="w-full space-y-4">
        <svg viewBox="0 0 300 110" className="w-full h-24 overflow-visible">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d="M 10 100 Q 75 80, 150 40 T 290 10"
            fill="none"
            stroke="url(#svg-glow-grad)"
            strokeWidth="3.5"
          />
          <defs>
            <linearGradient id="svg-glow-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#00e5ff" />
            </linearGradient>
          </defs>
          <circle cx="75" cy="80" r="4" className="fill-primary" />
          <circle cx="150" cy="40" r="4" className="fill-accent" />
          <circle cx="290" cy="10" r="4" className="fill-secondary" />
        </svg>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-text">Accuracy score</span>
          <span className="text-accent font-bold font-heading text-sm">98.4%</span>
        </div>
      </div>
    );
  }

  if (id === "nlp") {
    return (
      <div className="w-full space-y-2 max-w-[320px]">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-xs text-muted-text text-left max-w-[85%]">
          Parse Invoice invoice_9401.pdf
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: easings.expo }}
          className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-white text-left ml-auto max-w-[85%] space-y-1"
        >
          <div className="flex items-center gap-1.5 text-success">
            <Check className="w-3.5 h-3.5" />
            <span>Total extracted: <strong>₹48,500</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-success">
            <Check className="w-3.5 h-3.5" />
            <span>Vendor: <strong>SPATIUM Ernakulam</strong></span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (id === "vision") {
    return (
      <div className="w-full space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {["Receipt", "Medical Form", "Invoice"].map((label, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15, duration: 0.4, ease: easings.spring }}
              className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-1 p-2"
            >
              <FileText className="w-6 h-6 text-accent/60" />
              <span className="text-[8px] text-muted-text">{label}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-success font-semibold">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          OCR complete — 3 documents processed
        </div>
      </div>
    );
  }

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AIShowcase() {
  const [activeTab, setActiveTab] = useState("agents");
  const sectionRef = useRef(null);
  const pinRef = useRef(null);

  const activeCapability = aiCapabilities.find((c) => c.id === activeTab);

  // ── Auto-rotate capabilities tabs periodically if user is idle ───────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = aiCapabilities.findIndex((c) => c.id === prev);
        const nextIndex = (currentIndex + 1) % aiCapabilities.length;
        return aiCapabilities[nextIndex].id;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ai"
      className="relative bg-bg-dark overflow-hidden border-t border-white/[0.05] py-16 md:py-24"
    >
      {/* Background neural grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none z-0" />
      <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-secondary/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-purple-glow/4 blur-[100px] pointer-events-none rounded-full" />

      {/* ── Content area ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 w-full">

          {/* Section Head */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 28, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: easings.expo }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">AI & Intelligent Automation</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mt-2">
              Intelligent systems built to<br />
              <span className="gradient-text-primary">automate your operations.</span>
            </h2>
            <p className="text-muted-text text-base mt-4 max-w-xl mx-auto font-body">
              We build custom AI agents, predictive engines, and cognitive pipelines that turn raw data into decisions.
            </p>
          </motion.div>

          {/* Tab Split Experience */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-20">

            {/* Left Tab Buttons */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              {aiCapabilities.map((cap, i) => {
                const TabIcon = cap.icon;
                const isActive = cap.id === activeTab;
                return (
                  <motion.button
                    key={cap.id}
                    onClick={() => setActiveTab(cap.id)}
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: easings.expo }}
                    className={`relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-350 ${
                      isActive
                        ? "bg-white/[0.04] border-primary/45 shadow-xl shadow-primary/5"
                        : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.1]"
                    }`}
                  >
                    {/* Active pill indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="ai-active-indicator"
                        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
                        style={{ background: "linear-gradient(to bottom, #4f46e5, #00e5ff)" }}
                        transition={{ duration: 0.35, ease: easings.smooth }}
                      />
                    )}
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 transition-all duration-300 ${
                        isActive
                          ? "bg-primary/20 border-primary/30 text-accent"
                          : "bg-white/[0.02] border-white/[0.06] text-muted-text"
                      }`}
                    >
                      <TabIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-heading font-bold transition-colors ${isActive ? "text-white" : "text-white/70"}`}>
                        {cap.title}
                      </h3>
                      <p className="text-xs text-muted-text leading-relaxed font-body">{cap.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Right Visual Panel */}
            <div className="lg:col-span-7 flex items-stretch">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                  transition={{ duration: 0.38, ease: easings.snappy }}
                  className="w-full flex"
                >
                  <Card variant="glass" className="w-full p-8 flex flex-col justify-between border-white/[0.08] shadow-2xl backdrop-blur-xl">

                    {/* Interactive Visual */}
                    <div className="flex-1 flex items-center justify-center p-6 border border-white/[0.04] bg-[#050816]/60 rounded-xl mb-6 min-h-[180px] relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab + "-visual"}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.3, ease: easings.snappy }}
                          className="w-full"
                        >
                          <CapabilityVisual id={activeTab} />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Tab Copy */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab + "-copy"}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.32, ease: easings.snappy }}
                        className="space-y-4 text-left"
                      >
                        <h4 className="text-lg font-heading font-bold text-white">{activeCapability?.title}</h4>
                        <p className="text-sm text-muted-text leading-relaxed font-body">{activeCapability?.longDesc}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {activeCapability?.features.map((feat, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.06, duration: 0.3, ease: easings.spring }}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-white-text/80 font-heading tracking-wide uppercase bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg"
                            >
                              <Zap className="w-2.5 h-2.5 text-accent shrink-0" />
                              <span>{feat}</span>
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* ── AI Engine Grid ─────────────────────────────────────────────── */}
          <div className="border-t border-white/[0.08] pt-20">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easings.expo }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <h3 className="text-2xl font-heading font-bold text-white">Integrated AI Engine Library</h3>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiCapabilities.map((cap, i) => {
                const CapIcon = cap.icon;
                return (
                  <motion.div
                    key={cap.id}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 28, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.55, delay: i * 0.08, ease: easings.expo }}
                  >
                    <Card
                      variant="feature"
                      glow={true}
                      glowColor={cap.glow}
                      className="p-6 border-white/[0.06] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-4">
                        <motion.div
                          className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-accent"
                          whileHover={prefersReducedMotion ? {} : { rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.4, ease: easings.snappy }}
                        >
                          <CapIcon className="w-5 h-5" />
                        </motion.div>
                        <h4 className="text-base font-heading font-bold text-white">{cap.title}</h4>
                        <p className="text-xs text-muted-text leading-relaxed font-body">{cap.desc}</p>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-white/[0.04] mt-4">
                        {cap.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-white-text/80 font-heading tracking-wide uppercase">
                            <Zap className="w-3 h-3 text-accent shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>
    );
  }
