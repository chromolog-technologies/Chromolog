// ─── Case Studies Index & Proof Page (/case-studies) ──────────────────────────

import { useState } from "react";
import { caseStudiesData } from "../data/caseStudiesData";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";
import { ArrowRight, CheckCircle2, AlertTriangle, Building2, TrendingUp, Sparkles } from "lucide-react";

export default function CaseStudies({ setActivePage }) {
  const [selectedCase, setSelectedCase] = useState(caseStudiesData[0]);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-white font-body pt-12 pb-24">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-purple-900/10 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
            <Badge variant="status" color="success" className="px-4 py-1.5 text-xs font-semibold">
              Real Client Outcomes
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Case Studies &amp; Proven Results
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-body leading-relaxed">
              Explore how Chromolog helps companies in Kerala &amp; Dubai replace Excel spreadsheets, WhatsApp chaos, and legacy websites with custom digital systems.
            </p>
          </div>

          {/* Active Case Study Showcase */}
          <Card variant="glass" className="p-6 md:p-10 border-white/10 bg-[#0a0d1d]/80 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Case Study Details */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="ai" className="px-3 py-1 text-xs font-semibold">
                    {selectedCase.industry}
                  </Badge>
                  <span className="text-xs text-cyan-400 font-heading font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {selectedCase.location}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white leading-tight">
                  {selectedCase.title}
                </h2>

                {/* Challenge (Before Chromolog) */}
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-heading">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{selectedCase.challenge.title}</span>
                  </div>
                  <ul className="space-y-1 pl-6 list-disc text-xs text-slate-300 font-body">
                    {selectedCase.challenge.points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* Solution (What Chromolog Built) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> {selectedCase.solution.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-body leading-relaxed">
                    {selectedCase.solution.desc}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedCase.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Metrics Grid */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Measured &amp; Qualitative Results
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedCase.results.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                        <div className="text-lg font-extrabold text-cyan-400 font-heading">{r.metric}</div>
                        <div className="text-[10px] text-slate-300 line-clamp-1">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Case Image & Selection Buttons */}
              <div className="lg:col-span-5 space-y-6">
                <img
                  src={selectedCase.image}
                  alt={selectedCase.title}
                  className="w-full h-64 sm:h-72 rounded-2xl object-cover border border-white/10 shadow-lg"
                />

                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="text-xs font-heading font-bold text-white">Qualitative Impact:</div>
                  <p className="text-xs text-slate-300 font-body italic leading-relaxed">
                    "{selectedCase.qualitativeResult}"
                  </p>
                </div>
              </div>

            </div>
          </Card>

          {/* List of All Case Studies to Switch */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">Explore More Proven Success Stories:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {caseStudiesData.map((cs) => (
                <Card
                  key={cs.id}
                  variant="glass"
                  onClick={() => setSelectedCase(cs)}
                  className={`p-4 border transition-all cursor-pointer ${
                    selectedCase.id === cs.id
                      ? "border-cyan-400 bg-cyan-500/15 shadow-lg"
                      : "border-white/10 bg-[#0a0d1d]/80 hover:border-white/20"
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-heading font-bold mb-1">{cs.industry}</div>
                  <div className="text-xs font-bold font-heading text-white line-clamp-2 mb-2">{cs.title}</div>
                  <div className="text-[10px] text-slate-400">{cs.location}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-indigo-950/40 border border-white/15 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-2xl font-extrabold font-heading text-white">
              Ready to Achieve Similar Results for Your Business?
            </h2>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => {
                if (setActivePage) {
                  setActivePage("free-consultation");
                  window.history.pushState({}, "", "/free-consultation");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              Get a Free Technology Consultation
            </Button>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
