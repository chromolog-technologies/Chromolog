import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  Cpu,
  Globe2,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import Badge from "./ui/Badge";

const showcaseCards = [
  {
    id: "01",
    tag: "3D & WebGL Architecture",
    title: "Scroll-Driven Spatial Experiences",
    subtitle: "Immersive WebGL & 3D Interactive Render Engine",
    description:
      "Transform flat web interfaces into cinematic 3D environments. We harness Three.js, WebGL shaders, and high-fps particle clusters to tell compelling brand stories as users scroll.",
    icon: Sparkles,
    metrics: "60 FPS • Real-time Shaders",
    gradient: "from-cyan-500/20 via-blue-600/20 to-purple-600/30",
    accentColor: "#00e5ff",
    highlights: ["Shader Physics", "GPU Acceleration", "Zero Latency"],
  },
  {
    id: "02",
    tag: "Glassmorphism UI System",
    title: "Luminous Multi-Tiered Interfaces",
    subtitle: "Modern Frosted Glass & Dynamic Gradient Framework",
    description:
      "Ultra-sleek, tactile UI components with layered frosted glass refractions, vibrant ambient glows, and responsive micro-interactions engineered for maximum visual impact.",
    icon: Layers,
    metrics: "100% Responsive • Blur 24px",
    gradient: "from-blue-600/20 via-indigo-600/20 to-purple-500/30",
    accentColor: "#38bdf8",
    highlights: ["Backdrop Blurs", "Neon LED Traces", "Smooth Physics"],
  },
  {
    id: "03",
    tag: "Cognitive AI Pipelines",
    title: "Autonomous Enterprise Intelligence",
    subtitle: "Neural Agents & Real-time Predictive Modeling",
    description:
      "Deploy self-executing digital agents and RAG document intelligence pipelines that automate high-friction workflows, parse unstructured data, and scale your operations 24/7.",
    icon: Cpu,
    metrics: "99.4% Accuracy • Instant RAG",
    gradient: "from-purple-600/20 via-fuchsia-600/20 to-pink-500/30",
    accentColor: "#c084fc",
    highlights: ["Self-Operating", "Sub-second RAG", "Audit Compliance"],
  },
  {
    id: "04",
    tag: "Cinematic Parallax Storytelling",
    title: "Seamless Visual Transitions",
    subtitle: "Inspired by World-Class Product Showcases",
    description:
      "Capture audience attention through pin-scrolled narrative sequences, dynamic depth layering, scale morphing, and fluid scroll-triggered animation timelines.",
    icon: Globe2,
    metrics: "Cinematic Motion • Smooth Lenis",
    gradient: "from-cyan-500/20 via-teal-500/20 to-blue-600/30",
    accentColor: "#34d399",
    highlights: ["Pinned Viewports", "Scale Morphing", "Parallax Depth"],
  },
];

export default function HorizontalScrollShowcase({ navigateToSection }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  const scrollToCard = (index) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.children[index]?.offsetWidth || 500;
    container.scrollTo({
      left: index * (cardWidth + 24),
      behavior: "smooth",
    });
  };

  const handlePrev = () => {
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : showcaseCards.length - 1;
    setActiveIndex(nextIdx);
    scrollToCard(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex < showcaseCards.length - 1 ? activeIndex + 1 : 0;
    setActiveIndex(nextIdx);
    scrollToCard(nextIdx);
  };

  // Auto-scroll slideshow timer (pauses on mouse hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeIndex, isPaused]);

  return (
    <section
      id="showcase-experience"
      className="relative bg-[#060818] py-16 md:py-24 border-t border-white/10 overflow-hidden"
    >
      {/* Background Glow Orbs */}
      <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 space-y-10">
        
        {/* Section Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="px-3 py-1 text-xs">
                Interactive 3D &amp; Storytelling
              </Badge>
              <span className="text-xs font-heading font-semibold text-cyan-400 tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Auto-Scrolling Capabilities Showcase
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Cinematic WebGL &amp; <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                Glassmorphism Showcase
              </span>
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-md">
              <button
                onClick={handlePrev}
                aria-label="Previous capability"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 border border-white/10 text-white flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next capability"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 border border-white/10 text-white flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Indicator Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {showcaseCards.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveIndex(i);
                    scrollToCard(i);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeIndex === i
                      ? "w-8 bg-gradient-to-r from-cyan-400 to-purple-400"
                      : "w-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Card Carousel Track (Auto-scrolls, pauses on hover) */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none py-4 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {showcaseCards.map((card, idx) => {
            const Icon = card.icon;
            const isActive = activeIndex === idx;
            return (
              <motion.div
                key={card.id}
                onClick={() => setActiveIndex(idx)}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className={`snap-center w-[88vw] sm:w-[500px] md:w-[560px] shrink-0 rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl bg-white/[0.04] border transition-all duration-500 cursor-pointer shadow-2xl ${
                  isActive
                    ? "border-cyan-400/70 bg-white/[0.08] shadow-[0_12px_40px_rgba(0,229,255,0.2)]"
                    : "border-white/15 hover:border-white/30"
                }`}
              >
                {/* Background Card Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none`}
                />

                {/* Card Top Row */}
                <div className="relative z-10 flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-extrabold font-heading px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white"
                      style={{ borderColor: `${card.accentColor}50` }}
                    >
                      {card.id}
                    </span>
                    <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-300">
                      {card.tag}
                    </span>
                  </div>
                  <span className="text-xs font-heading font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    {card.metrics}
                  </span>
                </div>

                {/* Card Title & Icon */}
                <div className="relative z-10 flex items-start gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 bg-white/10 shadow-lg"
                    style={{ color: card.accentColor }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold font-heading text-white leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs font-heading font-medium text-cyan-300 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Description */}
                <p className="relative z-10 text-slate-300 text-sm leading-relaxed font-body mb-6">
                  {card.description}
                </p>

                {/* Highlights Grid */}
                <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                  {card.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs font-heading font-semibold px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      {h}
                    </span>
                  ))}
                </div>

                {/* CTA Link */}
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToSection("services");
                    }}
                    className="inline-flex items-center gap-2 text-xs font-heading font-bold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>Explore Capability Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-heading font-semibold text-cyan-400">
                    {idx + 1} of {showcaseCards.length}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Callout Bar */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-heading">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>Interactive 3D WebGL Shaders &amp; High-FPS Motion Architecture</span>
          </div>
          <button
            onClick={() => navigateToSection("services")}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 shrink-0"
          >
            <span>View All Engineering Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
}
