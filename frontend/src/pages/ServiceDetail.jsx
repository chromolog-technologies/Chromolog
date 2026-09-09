// ─── Streamlined High-Density Service Details Template ───────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Building2,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Clock,
  Code2,
  Send,
  HelpCircle,
} from "lucide-react";
import { servicesData } from "../data/servicesData";
import { caseStudiesData } from "../data/caseStudiesData";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";

export default function ServiceDetail({ serviceSlug, setActivePage, navigateToSection }) {
  const service = servicesData[serviceSlug] || servicesData["custom-software-development"];
  const [openFaq, setOpenFaq] = useState(0);

  // Case study fallback
  const relevantCaseStudy = caseStudiesData[0];

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    currentSetup: "Excel & Manual Processes",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-white font-body pt-2 pb-8">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[250px] bg-gradient-to-b from-primary/15 via-purple-900/10 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">

          {/* ── 1. Compact Hero Header ────────────────────────────────────────── */}
          <div className="pt-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch border-b border-white/10 pb-5">
            <div className="lg:col-span-7 space-y-3 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ai" className="px-2.5 py-0.5 text-xs font-semibold">
                  {service.badge}
                </Badge>
                <span className="text-xs text-slate-300 flex items-center gap-1 font-heading font-medium">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Digital Architecture
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-white leading-snug tracking-tight">
                {service.h1}
              </h1>

              {/* Problem + Solution Callout Box */}
              <div className="p-3.5 rounded-xl bg-[#0a0d1d]/90 border border-white/10 space-y-2 text-xs sm:text-sm text-slate-300 font-body">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p><strong className="text-amber-400 font-semibold">Challenge:</strong> {service.hero.problem}</p>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p><strong className="text-emerald-400 font-semibold">Chromolog Solution:</strong> {service.hero.solution}</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    document.getElementById("consultation-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {service.hero.ctaPrimary}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (setActivePage) {
                      setActivePage("case-studies");
                      window.history.pushState({}, "", "/case-studies");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                >
                  {service.hero.ctaSecondary}
                </Button>
              </div>
            </div>

            {/* Hero Quick Specs */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <Card variant="glass" className="h-full p-4 sm:p-5 border-white/10 bg-[#0a0d1d]/80 backdrop-blur-xl flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-cyan-400 border border-accent/20 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-heading uppercase tracking-wider">Solution Focus</div>
                    <div className="text-xs font-bold text-white font-heading">{service.targetKeyword}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {service.secondaryKeywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{kw}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Pills */}
                <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                  <div className="text-[10px] font-heading uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-cyan-400" /> Stack:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {service.techStack.slice(0, 6).map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-bold text-cyan-300 font-heading">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href="https://wa.me/919400230723?text=Hi%2C%20I%20need%20a%20consultation%20regarding%20our%20software%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all font-heading flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Instant WhatsApp: +91 94002 30723
                </a>
              </Card>
            </div>
          </div>

          {/* ── 2. What We Build & Capabilities (2x2 Compact Grid) ─────────────── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-heading">Modules &amp; Deliverables</span>
                <h2 className="text-lg sm:text-xl font-extrabold font-heading text-white">What We Build &amp; Key Features</h2>
              </div>
              <Badge variant="status" color="success" className="text-xs w-fit">100% IP Code Ownership</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {service.whatWeBuild.map((item, idx) => (
                <Card key={idx} variant="glass" className="p-4 border-white/10 bg-[#0a0d1d]/80 hover:border-cyan-400/40 transition-all group shadow-md backdrop-blur-xl flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold font-heading shrink-0">
                        0{idx + 1}
                      </div>
                      <h3 className="text-sm font-bold font-heading text-white group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs font-body text-slate-300 leading-relaxed pl-8">
                      {item.desc}
                    </p>
                  </div>

                  {/* Feature Pill matching capability index */}
                  {service.capabilities[idx] && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-300 pl-8">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-heading font-medium">{service.capabilities[idx]}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* ── 3. 5-Step Process & Industry Expertise ────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0d1d]/80 border border-white/10 shadow-lg backdrop-blur-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-heading">Engineering Flow</span>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white">5-Step Delivery Process &amp; Industry Scope</h3>
              </div>
            </div>

            {/* 5 Steps Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {service.process.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                  <div className="text-xs font-black font-heading text-cyan-400">{p.step}</div>
                  <div className="text-xs font-bold font-heading text-white truncate">{p.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">{p.desc}</div>
                </div>
              ))}
            </div>

            {/* Industry Tags */}
            <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
              <span className="text-xs font-heading text-slate-400 font-bold uppercase mr-1">Industries Served:</span>
              {service.industries.map((ind, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white font-heading font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" /> {ind}
                </span>
              ))}
            </div>
          </div>

          {/* ── 4. Case Study Proof & Why Chromolog (Split 2-Column) ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Case Study */}
            <div className="lg:col-span-7">
              <Card variant="glass" className="h-full p-4 sm:p-5 border-white/10 bg-[#0a0d1d]/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="status" color="success" className="px-2 py-0.5 text-[10px]">
                    Verified Case Study
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-heading">{relevantCaseStudy.industry}</span>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold font-heading text-white mb-1">
                    {relevantCaseStudy.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {relevantCaseStudy.qualitativeResult}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {relevantCaseStudy.results.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-center">
                      <div className="text-xs font-extrabold text-cyan-400 font-heading">{r.metric}</div>
                      <div className="text-[10px] text-slate-300 truncate">{r.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Why Chromolog 3 Pillar Cards */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
              <div className="p-3.5 rounded-xl bg-[#0a0d1d]/80 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-cyan-400 border border-blue-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-heading text-white">100% Code Ownership</div>
                  <div className="text-[11px] text-slate-300">Full IP rights &amp; GitHub repository transferred</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a0d1d]/80 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-heading text-white">Sub-Second Performance</div>
                  <div className="text-[11px] text-slate-300">Modern React &amp; optimized REST/GraphQL APIs</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a0d1d]/80 border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-heading text-white">Direct Technical Support</div>
                  <div className="text-[11px] text-slate-300">Senior architect lead with zero account managers</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. FAQs & Lead Form (Side-by-Side Split Grid) ───────────────────── */}
          <div id="consultation-form" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: FAQs */}
            <div className="lg:col-span-6 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-heading flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
                </span>
                <h3 className="text-lg font-extrabold font-heading text-white">Service FAQs</h3>
              </div>

              <div className="space-y-2">
                {service.faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl bg-[#0a0d1d]/80 border border-white/10 shadow-md overflow-hidden backdrop-blur-xl">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                      className="w-full px-3.5 py-3 text-left flex items-center justify-between gap-3 font-heading font-semibold text-xs text-white hover:text-cyan-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-cyan-400" : "text-slate-400"}`} />
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-3.5 pb-3 text-xs font-body text-slate-300 leading-relaxed border-t border-white/10 pt-2">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: High-Converting Consultation Lead Form */}
            <div className="lg:col-span-6">
              <Card variant="glass" className="p-5 border-white/15 bg-gradient-to-br from-[#0a0d1d] to-[#0d122b] shadow-2xl backdrop-blur-2xl">
                {submitted ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-white">Consultation Requested!</h3>
                    <p className="text-xs text-slate-300">
                      Our lead software architect will review your project details and reach out within 4 hours.
                    </p>
                    <a
                      href={`https://wa.me/919400230723?text=Hi%2C%20I%20just%20submitted%20a%20consultation%20request%20for%20${encodeURIComponent(service.h1)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline pt-1 font-heading"
                    >
                      Need faster response? Chat on WhatsApp →
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-heading">Free Technology Consultation</span>
                      <h4 className="text-base font-extrabold font-heading text-white">Request a Custom Proposal</h4>
                      <p className="text-[11px] text-slate-300">Analyze current workflows &amp; receive an exact architecture roadmap.</p>
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Your Full Name *"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Phone / WhatsApp *"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body"
                      />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Work Email *"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body"
                      />
                    </div>

                    <div>
                      <select
                        name="currentSetup"
                        value={formData.currentSetup}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl bg-[#050816] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 font-body"
                      >
                        <option value="Excel & Manual Processes" className="bg-[#060818]">Current Setup: Excel / Spreadsheets</option>
                        <option value="WhatsApp Order Chaos" className="bg-[#060818]">Current Setup: WhatsApp Orders</option>
                        <option value="Outdated Legacy Website" className="bg-[#060818]">Current Setup: Outdated Website</option>
                        <option value="Off-the-shelf Software" className="bg-[#060818]">Current Setup: Disconnected SaaS Software</option>
                        <option value="New Business Project" className="bg-[#060818]">Current Setup: New Project Idea</option>
                      </select>
                    </div>

                    <div>
                      <textarea
                        name="message"
                        rows="2"
                        placeholder="Briefly describe your requirements..."
                        value={formData.message}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body resize-none"
                      />
                    </div>

                    <Button variant="gradient" size="sm" className="w-full text-xs py-2.5" type="submit" icon={Send} iconPosition="right">
                      Submit Consultation Request
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
