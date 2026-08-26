// ─── Industry Landing Page (/industries/:ind) ──────────────────────────────────

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";
import { Building2, CheckCircle2, ArrowRight } from "lucide-react";

const industryInfo = {
  healthcare: {
    name: "Healthcare",
    h1: "Healthcare Software & Hospital HRMS Systems",
    desc: "Chromolog engineers clinical workflow software, patient portals, biometric shift HRMS, and offline-first mobile tools for hospitals and clinics in Kerala & Dubai.",
    points: ["Biometric shift roster & attendance HRMS", "Patient appointment queue web app", "Offline-first mobile clinical tools"],
  },
  education: {
    name: "Education",
    h1: "Smart Campus ERP & Learning Management Systems (LMS)",
    desc: "Chromolog builds custom LMS platforms, student portals, online quiz engines, and fee collection workflows for schools, academies, and universities.",
    points: ["Interactive video streaming & assignment portal", "Online examination & automated grading engine", "Parent & student mobile dashboard"],
  },
  "real-estate": {
    name: "Real Estate",
    h1: "Custom Real Estate CRM & Property Lead Systems",
    desc: "Centralize property listings, lead management pipelines, agent follow-ups, and WhatsApp API notifications for real estate developers and agencies.",
    points: ["Visual property lead Kanban pipeline", "Automated WhatsApp property catalog auto-responder", "Agent activity & commission tracking"],
  },
  retail: {
    name: "Retail & Wholesale",
    h1: "Retail Inventory, POS & Multi-Branch CRM Systems",
    desc: "Unify stock tracking, branch order dispatch, billing, and customer loyalty management into a single high-performance web application.",
    points: ["Multi-branch stock sync & re-order alerts", "Field sales rep mobile ordering app", "Executive revenue & sales analytics"],
  },
  manufacturing: {
    name: "Manufacturing",
    h1: "Manufacturing ERP & Production Operations Systems",
    desc: "Digitize purchase requisitions, raw material inventory, work-in-progress tracking, and automated executive reporting.",
    points: ["Purchase order & GRN approval matrices", "Material stock ledger & re-order alerts", "Executive production yield dashboards"],
  },
  hospitality: {
    name: "Hospitality",
    h1: "Hospitality Automation & Hotel/Dining Systems",
    desc: "Connect QR digital menus, kitchen display units, billing, inventory, and staff rosters into a fast, unified cloud system.",
    points: ["Real-time kitchen order dispatch (KDS)", "Dynamic shift roster & payroll HRMS", "Customer feedback & loyalty engine"],
  },
};

export default function IndustryPage({ industrySlug = "healthcare", setActivePage }) {
  const ind = industryInfo[industrySlug] || industryInfo["healthcare"];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-white font-body pt-12 pb-24">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-accent/15 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
            <Badge variant="ai" className="px-4 py-1.5 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 mr-1" /> {ind.name} Industry Solutions
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              {ind.h1}
            </h1>
            <p className="text-sm sm:text-base text-muted-text font-body leading-relaxed">
              {ind.desc}
            </p>
          </div>

          {/* Key Solutions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ind.points.map((p, i) => (
              <Card key={i} variant="glass" className="p-6 border-white/[0.08] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm font-bold font-heading text-white">{p}</span>
              </Card>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-bg-dark to-accent/20 border border-white/10 text-center space-y-4">
            <h2 className="text-2xl font-extrabold font-heading text-white">
              Discuss Your {ind.name} Software Project
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
