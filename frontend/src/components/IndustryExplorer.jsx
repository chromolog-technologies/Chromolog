import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, GraduationCap, ShoppingBag, Utensils, Truck, Building, ArrowRight, HelpCircle, CheckCircle } from "lucide-react";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { trackCTA } from "../utils/analytics";
import { trackCTAInterest, trackIndustryInterest, trackTechClick } from "../utils/visitor";

const industries = [
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Activity,
    color: "#00E5FF",
    tagline: "Secure, real-time patient workflow architectures.",
    overview: "We design cloud-native clinic management software, offline-first biometric scanners, and intelligent hospital queue display systems complying with secure data isolation standards.",
    problems: ["Legacy patient queuing bottlenecks", "High concurrency check-in crashes", "Complex scheduling synchronisations"],
    solutions: ["Real-time Patient Token Monitors", "Biometric SDK background listeners", "Encrypted medical database records"],
    benefits: ["42% reduction in patient wait times", "Zero data loss during network drops", "Full compliance with healthcare data standards"],
    products: ["Medical College Chest Hospital", "Cloud Clinic SaaS"],
    tech: ["Laravel REST", "Flutter Client", "MySQL", "Firebase Sync"],
  },
  {
    id: "education",
    name: "Education Technology",
    icon: GraduationCap,
    color: "#4F46E5",
    tagline: "Unified portals for smart campus automation.",
    overview: "Replacing fragmented school and college tools with modular, multi-persona campus ERPs containing placements dashboards, grading trackers, and automated fee modules.",
    problems: ["Scattered student records data", "Manual student placement sorting", "Inefficient parent-teacher messaging"],
    solutions: ["AlphaGrew Placement Predictors", "Multi-portal persona layouts", "Automated PDF certificate builders"],
    benefits: ["92% online fee collection rate", "85% reduction in placement team workload", "10,000+ students on single platform"],
    products: ["AlphaGrew Smart Campus ERP", "Library E-Gate system"],
    tech: ["React SPA", "Laravel", "PostgreSQL", "Node.js API"],
  },
  {
    id: "retail",
    name: "Retail & Inventory",
    icon: ShoppingBag,
    color: "#06B6D4",
    tagline: "High-performance POS and multi-branch tracking.",
    overview: "Engineering billing and stock software with fast barcode scanning, multi-store stock checks in real time, and GST compliance.",
    problems: ["Slow barcode scan under load", "No offline billing fallback options", "Stock mismatch across warehouse branches"],
    solutions: ["Native barcode reader integrations", "SQLite offline sync layers", "Real-time stock search APIs"],
    benefits: ["3x faster checkout process", "Offline billing continuity during network drops", "Unified multi-store inventory visibility"],
    products: ["Retail Billing & Inventory Software", "iPhone Multi-Store Vault"],
    tech: ["Flutter Mobile", "Laravel Web Server", "SQLite cache", "MySQL"],
  },
  {
    id: "hospitality",
    name: "Hospitality & Dining",
    icon: Utensils,
    color: "#7C3AED",
    tagline: "Seamless dining checkout and table ordering.",
    overview: "Connecting tables, menus, kitchen display systems, and front-desk billing with real-time WebSocket communication pipelines.",
    problems: ["Paper-based kitchen order delays", "Incorrect item delivery updates", "Billing desk synchronization issues"],
    solutions: ["Kitchen Display Systems (KDS)", "QR table-ordering menus", "WebSocket ordering streams"],
    benefits: ["40% faster order-to-kitchen time", "Zero order mismatches via real-time sync", "Table turnover improved by 25%"],
    products: ["Restaurant QR Ordering & Kitchen Platform"],
    tech: ["Flutter client app", "Laravel server", "WebSockets"],
  },
  {
    id: "logistics",
    name: "Logistics & Supply",
    icon: Truck,
    color: "#22C55E",
    tagline: "Fleet monitoring and warehousing modules.",
    overview: "Designing secure supply chain layers to verify product availability, track transit times, and manage dispatcher orders.",
    problems: ["Lack of dispatcher location checks", "Disorganized shipping documents", "Warehouse intake errors"],
    solutions: ["Real-time transit monitors", "Centralized shipping data systems", "Inventory barcode intakes"],
    benefits: ["Real-time shipment visibility across branches", "Fewer intake errors with barcode scanning", "Centralized dispatch control dashboard"],
    products: ["Custom logistics managers", "Multi-store stocks"],
    tech: ["Docker containers", "AWS deployment", "Laravel backend"],
  },
  {
    id: "enterprise",
    name: "Enterprise Workflow",
    icon: Building,
    color: "#EF4444",
    tagline: "Robust HRMS platforms and CRM funnels.",
    overview: "Architecting multi-tenant business automation software covering payroll runs, custom RBAC permissions, and lead pipelines.",
    problems: ["Paper-based department approvals", "Manual payroll calculation loops", "Fragmented lead pipeline records"],
    solutions: ["HumaNode RBAC permissions", "Queued background payroll compute", "Event-driven approval triggers"],
    benefits: ["84% reduction in paper file reliance", "100% audit trace on every approval", "Instant automated payroll processing"],
    products: ["HumaNode HRMS System", "YCDC Digital Transformation"],
    tech: ["React SPA", "Laravel Monolith", "PostgreSQL JSONB", "Redis"],
  },
];

export default function IndustryExplorer() {
  const [activeInd, setActiveInd] = useState("healthcare");
  const selectedInd = industries.find((ind) => ind.id === activeInd);
  const SelectedIcon = selectedInd.icon;

  const handleIndustrySelect = (industryId) => {
    setActiveInd(industryId);
    trackIndustryInterest(industryId);
  };

  return (
    <section className="relative bg-bg-dark py-16 md:py-24 border-t border-white/[0.05]" id="industries">
      {/* Background radial gradients */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-primary/4 blur-[110px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-secondary/4 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* Section Head */}
        <div className="section-head reveal text-center max-w-3xl mx-auto mb-20">
          <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">Industry Solutions</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mt-2">
            Industry Solution Explorer
          </h2>
          <p className="text-muted-text text-base mt-4 max-w-xl mx-auto font-body">
            Select a target sector to review standard business problems, solutions, and product integrations.
          </p>
        </div>

        {/* Dynamic Selector Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Vertical List Selector */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-2.5">
            {industries.map((ind) => {
              const IndIcon = ind.icon;
              const isActive = ind.id === activeInd;
              return (
                <button
                  key={ind.id}
                  onClick={() => handleIndustrySelect(ind.id)}
                  onFocus={() => trackIndustryInterest(ind.id)}
                  className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 ${
                    isActive
                      ? "bg-white/[0.04] border-primary/45 shadow-xl shadow-primary/5 text-white"
                      : "bg-white/[0.01] border-white/[0.05] text-muted-text hover:text-white-text hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl border ${
                      isActive ? "bg-primary/20 border-primary/30 text-accent" : "bg-white/[0.02] border-white/[0.06] text-muted-text"
                    }`}>
                      <IndIcon className="w-5 h-5" />
                    </div>
                    <span className="text-base font-heading font-bold">{ind.name}</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-muted-text/30 transition-transform ${isActive ? "translate-x-1 text-white" : ""}`} />
                </button>
              );
            })}
          </div>

          {/* Right Content details layout */}
          <div className="lg:col-span-8 flex items-stretch">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInd}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full flex animate-reveal"
              >
                <Card
                  variant="glass"
                  className="w-full p-8 md:p-10 border-white/[0.08] shadow-2xl backdrop-blur-xl flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-3">
                        <SelectedIcon className="w-4 h-4" style={{ color: selectedInd.color }} />
                        <span className="text-xs font-bold font-heading text-white">{selectedInd.name} Solutions</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-heading font-extrabold text-white leading-tight">
                        {selectedInd.tagline}
                      </h3>
                      <p className="text-sm text-muted-text leading-relaxed font-body mt-3">
                        {selectedInd.overview}
                      </p>
                    </div>

                    {/* Problem / Solution Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">
                      
                      {/* Business Problems */}
                      <div className="space-y-3.5 text-left">
                        <span className="text-[10px] font-bold text-error uppercase tracking-widest font-heading flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Business Challenges
                        </span>
                        <div className="space-y-2">
                          {selectedInd.problems.map((prob, idx) => (
                            <div key={idx} className="text-xs font-semibold text-muted-text leading-relaxed font-body flex items-start gap-2">
                              <span className="text-error font-bold mt-0.5">•</span>
                              <span>{prob}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Solutions Offered */}
                      <div className="space-y-3.5 text-left">
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest font-heading flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Engineering Solutions
                        </span>
                        <div className="space-y-2">
                          {selectedInd.solutions.map((sol, idx) => (
                            <div key={idx} className="text-xs font-semibold text-white-text/95 leading-relaxed font-body flex items-start gap-2">
                              <span className="text-success font-bold mt-0.5">•</span>
                              <span>{sol}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Benefits */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-heading flex items-center gap-1.5 mb-3">
                        <span className="w-3.5 h-3.5 rounded-full border border-accent/40 flex items-center justify-center text-[7px]">✦</span>
                        Key Benefits
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedInd.benefits && selectedInd.benefits.map((b, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-100 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 leading-relaxed">
                            <span className="text-accent font-extrabold shrink-0 mt-0.5">→</span>
                            <span className="font-body">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Products & Stacks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">

                      {/* Products */}
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest font-heading">Deliverables Built</span>
                        <div className="space-y-1">
                          {selectedInd.products.map((p, idx) => (
                            <span key={idx} className="block text-xs font-bold text-white font-heading">{p}</span>
                          ))}
                        </div>
                      </div>

                      {/* Preferred Tech Stack */}
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest font-heading">Target Stack</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedInd.tech.map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => trackTechClick(t)}
                              className="text-[10px] font-semibold text-accent border border-white/[0.04] bg-white/[0.02] hover:bg-accent/10 hover:border-accent/20 px-2 py-0.5 rounded font-heading transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-6 mt-8 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        trackCTA("industry_architect_contact", selectedInd.name);
                        trackCTAInterest(`Industry contact: ${selectedInd.name}`);
                        trackIndustryInterest(selectedInd.id);
                        const contactSection = document.getElementById("contact");
                        if (contactSection) {
                          window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "contact" } }));
                        }
                      }}
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

      </div>
    </section>
  );
}
