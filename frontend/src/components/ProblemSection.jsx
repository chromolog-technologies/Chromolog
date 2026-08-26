// ─── Problem Section — "Is Your Business Still Running Like This?" ─────────────

import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { FileSpreadsheet, MessageSquare, Repeat, Globe, Sparkles } from "lucide-react";

export default function ProblemSection({ onOpenAudit, navigateToSection }) {
  const problems = [
    {
      icon: FileSpreadsheet,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      title: "Excel Everywhere",
      desc: "Critical business data scattered across conflicting spreadsheets, causing billing and inventory errors.",
    },
    {
      icon: MessageSquare,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      title: "WhatsApp Operations",
      desc: "Client leads, sales quotes, and customer orders buried and lost inside unorganized personal chat histories.",
    },
    {
      icon: Repeat,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      title: "Manual Processes",
      desc: "Employees spending hours re-entering the same information across paper slips and disconnected tools.",
    },
    {
      icon: Globe,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      title: "Outdated Website",
      desc: "A legacy website that fails to convert mobile visitors, ranks poorly on Google, and generates zero leads.",
    },
  ];

  return (
    <section className="relative py-16 md:py-20 bg-bg-dark border-b border-white/[0.06] overflow-hidden" id="problem-audit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="status" color="warning" className="px-3.5 py-1 text-xs font-semibold">
            Operational Health Check
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Is Your Business Still Running on Disconnected Tools?
          </h2>
          <p className="text-xs sm:text-base text-muted-text font-body leading-relaxed">
            Most growing businesses outgrow early habits fast. Disconnected manual tools slow down scale and burn employee productivity.
          </p>
        </div>

        {/* 4 Problem Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((item, idx) => (
            <Card key={idx} variant="glass" className={`p-5 ${item.border} bg-white/[0.02] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all`}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-heading text-white">{item.title}</h3>
                <p className="text-xs text-muted-text font-body leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Resolution Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-bg-dark to-accent/20 border border-white/15 text-center space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-heading font-bold text-accent uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Chromolog System Transformation
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            Chromolog Turns Fragmented Workflows into One Connected Digital System
          </h3>
          <p className="text-xs sm:text-sm text-muted-text max-w-xl mx-auto">
            We replace manual entry, WhatsApp order chaos, and outdated sites with custom CRM, HRMS, ERP, and web applications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
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
