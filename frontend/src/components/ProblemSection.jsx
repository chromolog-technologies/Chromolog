// ─── Problem Section — Glassmorphism & Gradient Theme ─────────────

import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { FileSpreadsheet, MessageSquare, Repeat, Globe, Sparkles } from "lucide-react";

export default function ProblemSection({ onOpenAudit, navigateToSection }) {
  const problems = [
    {
      icon: FileSpreadsheet,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      title: "Excel Everywhere",
      desc: "Critical business data scattered across conflicting spreadsheets, causing billing and inventory errors.",
    },
    {
      icon: MessageSquare,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      title: "WhatsApp Operations",
      desc: "Client leads, sales quotes, and customer orders buried and lost inside unorganized personal chat histories.",
    },
    {
      icon: Repeat,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      title: "Manual Processes",
      desc: "Employees spending hours re-entering the same information across paper slips and disconnected tools.",
    },
    {
      icon: Globe,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      title: "Outdated Website",
      desc: "A legacy website that fails to convert mobile visitors, ranks poorly on Google, and generates zero leads.",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-[#060818] border-b border-white/10 overflow-hidden" id="problem-audit">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="status" color="warning" className="px-3.5 py-1 text-xs font-semibold">
            Operational Health Check
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Is Your Business Still Running on <br />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
              Disconnected Tools?
            </span>
          </h2>
          <p className="text-xs sm:text-base text-slate-300 font-body leading-relaxed max-w-xl mx-auto">
            Most growing businesses outgrow early habits fast. Disconnected manual tools slow down scale and burn employee productivity.
          </p>
        </div>

        {/* 4 Problem Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border ${item.border} shadow-xl flex flex-col justify-between space-y-4 hover:bg-white/[0.08] hover:scale-[1.02] transition-all duration-300 group`}
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} border ${item.border} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-heading text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 font-body leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Resolution Banner */}
        <div className="p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-gradient-to-r from-cyan-500/10 via-purple-600/10 to-blue-600/10 border border-white/20 text-center space-y-5 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-xs font-heading font-bold text-cyan-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Chromolog System Transformation
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white leading-tight">
            Chromolog Turns Fragmented Workflows into One Connected Digital System
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-body leading-relaxed">
            We replace manual entry, WhatsApp order chaos, and outdated sites with custom CRM, HRMS, ERP, and web applications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button variant="gradient" size="md" onClick={onOpenAudit}>
              Get Free Digital Efficiency Audit
            </Button>
            <Button variant="outline" size="md" onClick={() => navigateToSection("services")}>
              Explore Connected Solutions
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}
