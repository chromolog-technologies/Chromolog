import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Zap, Trophy, HeartHandshake, ShieldCheck, Scale, Sparkles, Star, AppWindow } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const features = [
  { text: "Smart Eligibility Filtering", icon: "ri-filter-3-line" },
  { text: "Job & Application Management", icon: "ri-briefcase-4-line" },
  { text: "AI Resume Analyser", icon: "ri-file-search-line" },
  { text: "Mock Interviews & Tests", icon: "ri-chat-check-line" },
  { text: "Student Analytics", icon: "ri-bar-chart-grouped-line" },
  { text: "Interview Readiness Score", icon: "ri-speed-up-line" },
  { text: "Push Notifications", icon: "ri-notification-3-line" },
  { text: "Multi-Portal Access", icon: "ri-graduation-cap-line" },
];

const comparisons = [
  {
    id: "speed",
    title: "Instantaneous Speed",
    label: "Speed",
    icon: Zap,
    stat: "100ms",
    statDesc: "Average API Response",
    desc: "We write highly optimized database calls and cache-first pipelines, yielding immediate render paints and high-speed data refreshes.",
  },
  {
    id: "quality",
    title: "Enterprise Quality",
    label: "Quality",
    icon: Trophy,
    stat: "100%",
    statDesc: "Client Code Ownership",
    desc: "Strict adherence to Domain-Driven Design (DDD) and Clean Architecture models, making your code highly maintainable and clean.",
  },
  {
    id: "support",
    title: "Dedicated Support",
    label: "Support",
    icon: HeartHandshake,
    stat: "24/7",
    statDesc: "Communication Scope",
    desc: "Direct communication channels via Slack or WhatsApp, providing immediate response and deployment of hotfixes under SLAs.",
  },
  {
    id: "security",
    title: "Rigorous Security",
    label: "Security",
    icon: ShieldCheck,
    stat: "SSL+",
    statDesc: "RBAC & Encryption",
    desc: "Granular Role-Based Access Control scoping, encrypted data storage layers, and secure REST JWT token integrations.",
  },
  {
    id: "scalability",
    title: "Elastic Scalability",
    label: "Scalability",
    icon: Scale,
    stat: "Docker",
    statDesc: "Cloud Native Scope",
    desc: "Dockerized modular services built to run on automated container schedules, resizing dynamically with concurrent traffic.",
  },
];

export default function ProductMockup({ navigateToSection }) {
  const [activeComp, setActiveComp] = useState("speed");
  const selectedComp = comparisons.find((c) => c.id === activeComp);

  const handleRequestDemo = (e) => {
    e.preventDefault();
    navigateToSection("contact");
  };

  const handleViewProjects = (e) => {
    e.preventDefault();
    navigateToSection("projects");
  };

  return (
    <section className="relative bg-bg-dark overflow-hidden py-16 md:py-24 border-t border-white/[0.05]" id="product">
      {/* Aurora overlays */}
      <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-primary/6 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[-20%] w-[450px] h-[450px] bg-secondary/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* Product Showcase Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-24">
          
          {/* Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="ai" className="px-3 py-1 text-xs">Flagship SaaS Product</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-white leading-tight">
              AlphaGrew <br />
              <span className="gradient-text-cyan">Smart Campus ERP</span>
            </h2>
            <p className="text-base text-slate-300 leading-relaxed font-body">
              A comprehensive cloud-based ERP solution designed for schools, colleges, and universities. Integrates cognitive analytics, automated placement scoring, and unified portals for students, parents, and faculties.
            </p>

            {/* Feature Badges list */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 border border-white/10 rounded-xl bg-white/[0.04] backdrop-blur-md shadow-sm transition-colors"
                >
                  <div className="p-1 rounded bg-purple-500/10 text-cyan-400 border border-purple-500/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 font-body">{feat.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="primary" size="md" onClick={handleRequestDemo}>
                Request Product Demo
              </Button>
              <Button variant="outline" size="md" onClick={handleViewProjects}>
                View All Projects
              </Button>
            </div>
          </div>

          {/* Right Apple-style 3D Mockup Dashboard */}
          <div className="lg:col-span-6 relative flex items-center justify-center p-4">
            
            {/* Spotlight Card */}
            <motion.div
              whileHover={{ rotateY: -15, rotateX: 8, scale: 1.01 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative w-full max-w-[490px] border border-white/[0.1] bg-[#0A0F1D]/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl z-10"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Screen Bar */}
              <div className="flex justify-between items-center px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.06] text-xs font-heading font-semibold text-muted-text select-none">
                <div className="flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-accent" />
                  <span>AlphaGrew Smart Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-success font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Screen Body */}
              <div className="p-6 space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "94.8%", label: "Readiness Score" },
                    { value: "852", label: "Profile Views" },
                    { value: "14", label: "Matches Today" },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-center">
                      <strong className="block text-lg font-heading font-extrabold text-white">{stat.value}</strong>
                      <span className="text-[9px] font-semibold text-muted-text uppercase tracking-wider block mt-1 leading-none">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Trend Graph Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Visual Chart */}
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl space-y-3">
                    <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest block font-heading">Readiness Trend</span>
                    <div className="flex items-end gap-2.5 h-16 pt-2">
                      <div className="bg-primary/20 hover:bg-primary/40 rounded-t-sm w-full transition-all h-[42%]" />
                      <div className="bg-primary/30 hover:bg-primary/50 rounded-t-sm w-full transition-all h-[58%]" />
                      <div className="bg-primary/40 hover:bg-primary/60 rounded-t-sm w-full transition-all h-[78%]" />
                      <div className="bg-gradient-to-t from-primary to-accent rounded-t-sm w-full h-[92%] shadow-[0_0_8px_rgba(0,229,255,0.3)] animate-pulse" />
                    </div>
                  </div>

                  {/* AI assist checklist */}
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl space-y-2 text-left">
                    <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest block font-heading">AI Analysis</span>
                    <div className="space-y-1.5 text-[11px] font-semibold text-white/90">
                      <div className="flex items-center gap-1.5 text-success">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Resume Gaps Resolved</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-success">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Mock Test Cleared</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-accent">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>4 Jobs Matched</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>

            {/* Ambient Background Glow behind Card */}
            <div className="absolute w-80 h-80 rounded-full bg-accent/5 blur-[80px] pointer-events-none z-0" />
            
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[12%] -right-4 z-20 pointer-events-none select-none"
            >
              <div className="flex items-center gap-2.5 bg-[#0A0F1D]/90 border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-xl">
                <Star className="w-4.5 h-4.5 text-warning fill-warning" />
                <div>
                  <span className="text-xs font-bold text-white block">Top Rated</span>
                  <span className="text-[9px] text-muted-text">Education System</span>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* Why Choose Us Interactive Comparison Section */}
        <div className="border-t border-white/[0.08] pt-20">
          
          {/* Section head */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">Architectural Excellence</Badge>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">Why Modern Teams Choose Chromolog</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Comparison Tab Buttons */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
              {comparisons.map((item) => {
                const ItemIcon = item.icon;
                const isActive = item.id === activeComp;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveComp(item.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border text-left transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.04] border-primary/45 shadow-xl shadow-primary/5 text-white"
                        : "bg-white/[0.01] border-white/[0.05] text-muted-text hover:text-white-text hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl border ${
                        isActive ? "bg-primary/20 border-primary/30 text-accent" : "bg-white/[0.02] border-white/[0.06] text-muted-text"
                      }`}>
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      <span className="text-base font-heading font-bold">{item.title}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-muted-text/30 transition-transform ${isActive ? "rotate-90 text-white" : ""}`} />
                  </button>
                );
              })}
            </div>

            {/* Showcase details card */}
            <div className="lg:col-span-7 flex items-stretch">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeComp}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full flex"
                >
                  <Card
                    variant="glass"
                    className="w-full p-8 md:p-10 flex flex-col justify-between border-white/[0.08] shadow-2xl backdrop-blur-xl"
                  >
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                        <selectedComp.icon className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-white font-heading">{selectedComp.label}</span>
                      </div>
                      <h4 className="text-xl md:text-2xl font-heading font-bold text-white leading-tight">
                        {selectedComp.title}
                      </h4>
                      <p className="text-base text-muted-text leading-relaxed font-body">
                        {selectedComp.desc}
                      </p>
                    </div>
                    
                    {/* Big Stats block */}
                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/[0.06] mt-8">
                      <div>
                        <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest font-heading block">Metric Benchmark</span>
                        <strong className="text-3xl md:text-4xl font-heading font-extrabold text-white mt-1 block">
                          {selectedComp.stat}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest font-heading block">Feature Scope</span>
                        <span className="text-sm font-semibold text-accent mt-1.5 block leading-none">
                          {selectedComp.statDesc}
                        </span>
                      </div>
                    </div>

                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
