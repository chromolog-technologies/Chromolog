// ─── BusinessCore — Living Transformation: BEFORE → CHROMOLOG ENGINE → AFTER ─────

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  MessageSquare,
  Globe,
  FileText,
  Repeat,
  Unplug,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  BarChart3,
  Smartphone,
  Brain,
  Sparkles,
} from "lucide-react";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { easings } from "../motion/easings";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const beforeNodes = [
  { id: "excel", title: "Excel Spreadsheets", icon: FileSpreadsheet, desc: "Conflicting data & formula errors", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "whatsapp", title: "WhatsApp Chats", icon: MessageSquare, desc: "Lost lead orders & chat chaos", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "oldweb", title: "Old Website", icon: Globe, desc: "Slow, outdated & yields 0 leads", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "paper", title: "Paper Receipts", icon: FileText, desc: "Manual re-entry & lost slips", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "manual", title: "Manual Work", icon: Repeat, desc: "Hours wasted on duplicate entry", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "separate", title: "Separate SaaS", icon: Unplug, desc: "Disconnected software tools", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
];

const afterNodes = [
  { id: "website", title: "Website", icon: Globe, desc: "High-speed lead generation engine", color: "#00E5FF", metric: "3x Inbound Leads" },
  { id: "crm", title: "CRM", icon: UserCheck, desc: "Pipeline & automated WhatsApp sync", color: "#6366F1", metric: "Zero Lost Leads" },
  { id: "automation", title: "Automation", icon: Cpu, desc: "Instant billing & inventory triggers", color: "#10B981", metric: "100% Automated" },
  { id: "dashboard", title: "Dashboard", icon: BarChart3, desc: "Real-time executive revenue KPIs", color: "#F59E0B", metric: "Live Telemetry" },
  { id: "mobile", title: "Mobile", icon: Smartphone, desc: "Flutter iOS/Android with offline sync", color: "#06B6D4", metric: "< 50ms Latency" },
  { id: "ai", title: "AI Engine", icon: Brain, desc: "Document OCR & intelligent workflows", color: "#A855F7", metric: "Smart Processing" },
];

export default function BusinessCore({ onOpenAudit }) {
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'before', 'after'
  const [activeAfterNode, setActiveAfterNode] = useState(afterNodes[0]);
  const [simulationRunning, setSimulationRunning] = useState(true);

  // Auto-cycle active after node for live telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAfterNode((prev) => {
        const idx = afterNodes.findIndex((n) => n.id === prev.id);
        return afterNodes[(idx + 1) % afterNodes.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="business-core"
      className="relative py-20 md:py-28 bg-bg-dark border-b border-white/[0.06] overflow-hidden select-none"
    >
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="ai" className="px-3.5 py-1 text-xs font-semibold">
            Living System Transformation
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            We Turn Disconnected Processes Into One Digital System
          </h2>
          <p className="text-sm sm:text-base text-muted-text font-body leading-relaxed max-w-2xl mx-auto">
            See how Chromolog replaces scattered spreadsheets, lost WhatsApp chats, and paper slips with one continuous, real-time enterprise flow.
          </p>
        </div>

        {/* Filter / View Mode Switcher */}
        <div className="flex justify-center items-center gap-2">
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition-all ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : "text-muted-text hover:text-white"
              }`}
            >
              Full Transformation View
            </button>
            <button
              onClick={() => setActiveTab("before")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition-all ${
                activeTab === "before"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "text-muted-text hover:text-white"
              }`}
            >
              ❌ Before (Chaos)
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition-all ${
                activeTab === "after"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-muted-text hover:text-white"
              }`}
            >
              ✅ After (Connected)
            </button>
          </div>
        </div>

        {/* ── 3-COLUMN LIVING TRANSFORMATION DIAGRAM ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">

          {/* 1. LEFT SIDE — BEFORE (Fragmented Chaos) */}
          {(activeTab === "all" || activeTab === "before") && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className={`${activeTab === "all" ? "lg:col-span-4" : "lg:col-span-12"} space-y-4`}
            >
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold font-heading text-rose-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> BEFORE CHROMOLOG
                </div>
                <h3 className="text-sm font-bold font-heading text-white">Scattered & Disconnected</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {beforeNodes.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      animate={
                        prefersReducedMotion || !simulationRunning
                          ? {}
                          : {
                              y: [0, -3, 0, 3, 0],
                            }
                      }
                      transition={{
                        duration: 3.5 + idx * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`p-3.5 rounded-2xl ${item.bg} ${item.border} border text-left flex items-start gap-3 relative overflow-hidden group`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                          {item.title}
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded">
                            Unsynced
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-text font-body leading-tight">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 2. CENTER — CHROMOLOG TRANSFORMATION CORE ENGINE */}
          {activeTab === "all" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-6 py-6"
            >
              {/* Central Glowing Engine Core */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Pulse Aura Rings */}
                <div className="absolute w-48 h-48 rounded-full border border-accent/30 animate-ping opacity-30 pointer-events-none" />
                <div className="absolute w-56 h-56 rounded-full border border-primary/30 animate-pulse opacity-40 pointer-events-none" />

                {/* Core Engine Card */}
                <div
                  onClick={onOpenAudit}
                  className="relative w-40 h-40 rounded-full bg-gradient-to-br from-surface via-bg-dark to-surface border-2 border-accent/70 shadow-[0_0_60px_rgba(0,229,255,0.35)] flex flex-col items-center justify-center p-4 text-center cursor-pointer group hover:scale-105 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-accent/15 border border-accent/40 text-accent flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 fill-accent/20" />
                  </div>
                  <strong className="text-xs font-extrabold font-heading text-white tracking-widest uppercase">
                    CHROMOLOG
                  </strong>
                  <span className="text-[10px] font-bold text-accent font-heading mt-0.5">
                    CORE ENGINE
                  </span>
                  <span className="text-[9px] text-muted-text mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" /> Click to Audit
                  </span>
                </div>
              </div>

              {/* Directional Flow Vector Arrows */}
              <div className="flex items-center justify-center gap-3 text-xs font-bold font-heading text-accent bg-accent/10 border border-accent/20 px-4 py-2 rounded-full">
                <span>Chaos Input</span>
                <ArrowRight className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-white font-extrabold">Chromolog Core</span>
                <ArrowRight className="w-4 h-4 text-accent animate-pulse" />
                <span>Unified System</span>
              </div>

              <p className="text-xs text-muted-text font-body max-w-xs leading-relaxed">
                Chromolog transforms fragmented Excel files, paper slips, and WhatsApp chats into one synchronized cloud database.
              </p>
            </motion.div>
          )}

          {/* 3. RIGHT SIDE — AFTER (Connected Ecosystem) */}
          {(activeTab === "all" || activeTab === "after") && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className={`${activeTab === "all" ? "lg:col-span-4" : "lg:col-span-12"} space-y-4`}
            >
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold font-heading text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> AFTER CHROMOLOG
                </div>
                <h3 className="text-sm font-bold font-heading text-white">Seamlessly Connected Ecosystem</h3>
              </div>

              {/* Connected Chain Nodes (Website → CRM → Automation → Dashboard → Mobile → AI) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {afterNodes.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeAfterNode.id === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      onMouseEnter={() => setActiveAfterNode(item)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer relative overflow-hidden ${
                        isActive
                          ? "bg-surface border-accent shadow-[0_0_20px_rgba(0,229,255,0.2)]"
                          : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          border: `1px solid ${item.color}40`,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                            {item.title}
                            {idx < afterNodes.length - 1 && (
                              <span className="text-[10px] text-accent font-heading">→</span>
                            )}
                          </div>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: `${item.color}15`,
                              color: item.color,
                              borderColor: `${item.color}30`,
                            }}
                          >
                            {item.metric}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-text font-body leading-tight">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>

        {/* ── Active Pillar Live Telemetry Showcase ─────────────────────────── */}
        <div className="max-w-4xl mx-auto pt-2">
          <Card variant="glass" className="p-6 border-accent/40 bg-accent/[0.02] shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    backgroundColor: `${activeAfterNode.color}20`,
                    color: activeAfterNode.color,
                    border: `1px solid ${activeAfterNode.color}40`,
                  }}
                >
                  <activeAfterNode.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold font-heading text-white">
                      Connected Pillar: {activeAfterNode.title}
                    </h3>
                    <span className="text-[10px] font-bold text-success uppercase tracking-wider bg-success/10 border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Flow Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-text font-body mt-0.5">
                    {activeAfterNode.desc} &bull; <span className="text-accent font-semibold">{activeAfterNode.metric}</span>
                  </p>
                </div>
              </div>

              <Button
                variant="gradient"
                size="sm"
                onClick={onOpenAudit}
                className="whitespace-nowrap shrink-0"
              >
                Transform Your Business <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom Trust Line */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-text font-heading pt-4 border-t border-white/[0.06]">
          <span className="flex items-center gap-1.5 text-white">
            <CheckCircle2 className="w-4 h-4 text-accent" /> Replace Excel & WhatsApp Order Chaos
          </span>
          <span className="flex items-center gap-1.5 text-white">
            <CheckCircle2 className="w-4 h-4 text-accent" /> 100% Source Code & Database Ownership
          </span>
          <span className="flex items-center gap-1.5 text-white">
            <CheckCircle2 className="w-4 h-4 text-accent" /> Zero Monthly SaaS Lock-in
          </span>
        </div>

      </div>
    </section>
  );
}
