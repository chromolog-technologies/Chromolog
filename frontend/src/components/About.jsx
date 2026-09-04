// ─── About — Scroll-Driven Timeline + Story Tabs ────────────────────────────
// Timeline: scroll-driven line draw + stagger alternating cards + glow nodes
// Tabs: layout-id animated active indicator

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { easings } from "../motion/easings";
import { timelineCardLeft, timelineCardRight } from "../motion/variants";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stories = [
  {
    id: "story",
    tabLabel: "Our Story",
    icon: BookOpen,
    content: "Chromolog Technologies was established with a singular focus: to build digital products that combine clean, modular code with human-centric interfaces. Based in Kerala, India, we have partnered with institutions and enterprises to design, develop, and deploy production-grade software ecosystems that scale effortlessly.",
    title: "Crafting intelligent architectures since day one.",
  },
  {
    id: "vision",
    tabLabel: "Vision & Mission",
    icon: Target,
    content: "We believe AI shouldn't be bolted on as an afterthought; it must be native to the workflow. Our mission is to engineer high-security, high-performance systems with frictionless designs, empowering teams to eliminate manual operational loops and focus on core business growth.",
    title: "To bake intelligence directly into every system.",
  },
  {
    id: "future",
    tabLabel: "Future & Growth",
    icon: Sparkles,
    content: "We are actively steering towards autonomous agent architectures. By leveraging advanced language models, vector stores, and real-time database scopes, we build custom software platforms that are future-ready, self-learning, and tailored to industry-specific regulatory demands.",
    title: "Pioneering the cognitive agent ecosystem.",
  },
];

const milestones = [
  { year: "2022", title: "Inception & Foundations", desc: "Chromolog was founded with a target to modernize custom software. Formed a core team of senior product engineers in Ernakulam, Kerala." },
  { year: "2023", title: "Enterprise Scalability", desc: "Successfully delivered custom ERP and queue displays for retail and education centers, handling high daily transaction volumes." },
  { year: "2024", title: "Product Ecosystems", desc: "Incubated HumaNode HRMS architecture, shifting towards multi-tenant scoping and Laravel + React modular infrastructures." },
  { year: "2025", title: "AI-First Evolution", desc: "Standardized cognitive APIs, offline-first barcode syncs, and intelligent queue scheduling, transforming operations into AI-led systems." },
  { year: "2026", title: "Global Scale & Agents", desc: "Incubating autonomous agent pipelines, vector search connectors, and premium cloud deployments for international modern teams." },
];

export default function About({ navigateToSection }) {
  const [activeStory, setActiveStory] = useState("story");
  const selectedStory = stories.find((s) => s.id === activeStory);
  const timelineRef = useRef(null);
  const lineRef = useRef(null);

  // ── GSAP scroll-driven line draw ─────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion || !lineRef.current || !timelineRef.current) return;

    const line = lineRef.current;
    gsap.set(line, { scaleY: 0, transformOrigin: "top center" });

    const trigger = ScrollTrigger.create({
      trigger: timelineRef.current,
      start: "top 75%",
      end: "bottom 30%",
      scrub: 0.8,
      onUpdate: (self) => {
        gsap.set(line, { scaleY: self.progress });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="about" className="relative bg-bg-dark overflow-hidden py-16 md:py-24">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-primary/4 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-secondary/4 blur-[90px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">

        {/* Section Head */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 28, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: easings.expo }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">Who We Are</Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-white leading-tight mt-2">
            Not just lines of code. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Intelligent Business Systems.
            </span>
          </h2>
          <p className="text-slate-300 text-base mt-4 max-w-xl mx-auto font-body">
            We partner with institutions, startups, and enterprises to ship scalable software.
          </p>
        </motion.div>

        {/* Story Tab Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-24">

          {/* Left Tab Buttons with layout ID indicator */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-3">
            {stories.map((story, i) => {
              const TabIcon = story.icon;
              const isActive = story.id === activeStory;
              return (
                <motion.button
                  key={story.id}
                  onClick={() => setActiveStory(story.id)}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: easings.expo }}
                  className={`relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                    isActive
                      ? "bg-white/[0.04] border-primary/40 shadow-xl shadow-primary/5 text-white"
                      : "bg-white/[0.01] border-white/[0.06] text-muted-text hover:text-white-text hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Shared layout active background */}
                  {isActive && (
                    <motion.div
                      layoutId="story-active-bg"
                      className="absolute inset-0 rounded-2xl border border-primary/30"
                      style={{
                        background: "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(0,229,255,0.03))",
                      }}
                      transition={{ duration: 0.35, ease: easings.smooth }}
                    />
                  )}
                  <div
                    className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? "bg-primary/20 border-primary/30 text-accent"
                        : "bg-white/[0.02] border-white/[0.06] text-muted-text"
                    }`}
                  >
                    <TabIcon className="w-5 h-5" />
                  </div>
                  <div className="relative">
                    <span className="block text-[10px] font-semibold font-heading tracking-wide uppercase text-white/40">Pillar</span>
                    <span className="text-base font-heading font-bold">{story.tabLabel}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 flex items-stretch">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStory}
                initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(6px)" }}
                transition={{ duration: 0.38, ease: easings.snappy }}
                className="w-full"
              >
                <Card variant="glass" className="h-full p-8 md:p-10 flex flex-col justify-between border-white/[0.08] shadow-2xl backdrop-blur-xl">
                  <div className="space-y-6">
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-white leading-tight">
                      {selectedStory.title}
                    </h3>
                    <p className="text-muted-text text-base leading-relaxed font-body">
                      {selectedStory.content}
                    </p>
                  </div>
                  <div className="flex gap-4 pt-8 border-t border-white/[0.06] mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToSection("contact")}
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      Connect with Architects
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Animated Milestones Timeline ──────────────────────────────── */}
        <div className="border-t border-white/[0.08] pt-20">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easings.expo }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.08] rounded-full bg-white/[0.02] text-xs font-semibold text-muted-text mb-3">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Milestones & Growth</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">Our Journey Roadmap</h3>
          </motion.div>

          {/* Timeline Pipeline */}
          <div ref={timelineRef} className="relative max-w-4xl mx-auto pl-6 md:pl-0">
            {/* Static track line (dim) */}
            <div className="absolute left-[8px] md:left-1/2 top-0 bottom-0 w-px bg-white/[0.06] transform md:-translate-x-1/2" />

            {/* GSAP scroll-driven fill line */}
            <div
              ref={lineRef}
              className="absolute left-[8px] md:left-1/2 top-0 bottom-0 w-px transform md:-translate-x-1/2 origin-top"
              style={{
                background: "linear-gradient(to bottom, #00e5ff, #4f46e5, #7c3aed)",
                scaleY: 0,
              }}
            />

            <div className="space-y-12">
              {milestones.map((milestone, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={idx}
                    variants={isEven ? timelineCardLeft : timelineCardRight}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3, margin: "-40px 0px -60px 0px" }}
                    className={`relative flex flex-col md:flex-row items-start md:items-center ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Circle Node Marker */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.45, delay: 0.1, ease: easings.spring }}
                      className="absolute left-[8px] md:left-1/2 top-1.5 md:top-1/2 w-4 h-4 rounded-full bg-bg-dark border-2 border-primary transform -translate-x-[7.5px] md:-translate-y-1/2 flex items-center justify-center z-10"
                      style={{ boxShadow: "0 0 12px rgba(79,70,229,0.6)" }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-accent"
                        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>

                    {/* Card */}
                    <div className="w-full md:w-1/2 md:px-8 pl-6">
                      <Card
                        variant="feature"
                        className="p-6 border-white/[0.06] hover:border-primary/25 hover:shadow-primary/5 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-base font-heading font-extrabold text-accent">{milestone.year}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <h3 className="text-sm font-heading font-bold text-white">{milestone.title}</h3>
                        </div>
                        <p className="text-xs md:text-sm text-muted-text leading-relaxed font-body">{milestone.desc}</p>
                        {/* Subtle bottom glow on hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-b-2xl"
                          style={{ background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)" }}
                        />
                      </Card>
                    </div>

                    {/* Empty spacer */}
                    <div className="hidden md:block w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
