// ─── Master 10-Section Conversion Template for Service Pages ────────────────────

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

  // Filter relevant case study
  const relevantCaseStudy = caseStudiesData[0];

  // Lead Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
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
      <div className="relative min-h-screen bg-bg-dark text-slate-900 font-body pt-4 pb-16">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-purple-50 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 md:space-y-16">

          {/* ── 1. Hero Section (Problem + Solution + Primary CTA) ──────────────── */}
          <section className="pt-4 text-center md:text-left grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border-b border-slate-200 pb-10">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="ai" className="px-3.5 py-1 text-xs font-semibold">
                  {service.badge}
                </Badge>
                <span className="text-xs text-slate-600 flex items-center gap-1 font-heading font-medium">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Digital Systems Architecture
                </span>
              </div>

              {/* H1 Title with Target Keyword */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 leading-tight tracking-tight">
                {service.h1}
              </h1>

              {/* Problem + Solution Paragraph */}
              <div className="space-y-3 text-sm sm:text-base text-slate-600 font-body leading-relaxed">
                <p className="border-l-2 border-amber-500 pl-3.5 py-0.5 text-slate-800 bg-amber-50/50 rounded-r-lg">
                  <strong className="text-amber-800 font-semibold">The Problem:</strong> {service.hero.problem}
                </p>
                <p className="border-l-2 border-emerald-500 pl-3.5 py-0.5 text-slate-800 bg-emerald-50/50 rounded-r-lg">
                  <strong className="text-emerald-800 font-semibold">The Solution:</strong> {service.hero.solution}
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 pt-1">
                <Button
                  variant="gradient"
                  size="md"
                  onClick={() => {
                    if (navigateToSection) navigateToSection("contact");
                    else if (setActivePage) setActivePage("free-consultation");
                  }}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {service.hero.ctaPrimary}
                </Button>
                <Button
                  variant="outline"
                  size="md"
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

            {/* Right Hero Card / Quick Specs */}
            <div className="lg:col-span-5">
              <Card variant="glass" className="p-5 md:p-6 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-text font-heading uppercase tracking-wider">Solution Focus</div>
                    <div className="text-sm font-bold text-white font-heading">{service.targetKeyword}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {service.secondaryKeywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-text">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      <span>{kw}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-xs text-muted-text mb-1">Need instant technical advice?</div>
                  <a
                    href="https://wa.me/919400230723?text=Hi%2C%20I%20need%20a%20consultation%20regarding%20our%20software%20project."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-xs font-bold text-accent hover:underline font-heading"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Us: +91 94002 30723
                  </a>
                </div>
              </Card>
            </div>
          </section>

          {/* ── 2. Section 1: Pain Point Check ──────────────────────────────────── */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <Badge variant="ai" className="px-3 py-0.5 text-[11px]">
                Operational Audit
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                {service.painPoints.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-body">
                {service.painPoints.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.painPoints.points.map((pt, idx) => (
                <Card key={idx} variant="glass" className="p-4 border-amber-500/30 bg-amber-50/50 flex items-start gap-3 shadow-sm">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-body text-slate-800 leading-relaxed">{pt}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* ── 3. Section 2: What We Build ─────────────────────────────────────── */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <Badge variant="ai" className="px-3 py-0.5 text-[11px]">
                Engineering Capabilities
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                What We Build for Your Business
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Every digital system is engineered to solve specific operational bottlenecks and scale seamlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {service.whatWeBuild.map((item, idx) => (
                <Card key={idx} variant="glass" className="p-5 border-slate-200/80 bg-white hover:border-primary/40 transition-all group shadow-sm">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary text-xs font-bold font-heading">
                      0{idx + 1}
                    </div>
                    <h3 className="text-base font-bold font-heading text-slate-900 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs font-body text-slate-600 leading-relaxed pl-10">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* ── 4. Section 3: Features & Capabilities ───────────────────────────── */}
          <section className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">Core System Features</h3>
                <p className="text-xs text-slate-600 mt-0.5">Built-in enterprise standards in every project</p>
              </div>
              <Badge variant="status" color="success" className="w-fit text-xs">
                100% IP Ownership
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {service.capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-slate-800 font-heading">{cap}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. Section 4: Development Process ────────────────────────────────── */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <Badge variant="ai" className="px-3 py-0.5 text-[11px]">
                Structured Engineering Framework
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                Our 5-Step Development Process
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Transparent milestones with zero technical jargon and bi-weekly progress demonstrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {service.process.map((p, i) => (
                <Card key={i} variant="glass" className="p-4 border-white/[0.08] flex flex-col justify-between space-y-3">
                  <div className="text-2xl font-black font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {p.step}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading text-white mb-1">{p.title}</h4>
                    <p className="text-[11px] text-muted-text font-body leading-relaxed">{p.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* ── 6. Section 5: Target Industries ─────────────────────────────────── */}
          <section className="space-y-4">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <h3 className="text-lg font-bold font-heading text-white">Industries We Transform</h3>
              <p className="text-xs text-muted-text">Customized business rules for every commercial domain</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
              {service.industries.map((ind, i) => (
                <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold font-heading text-white">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 7. Section 6: Technology Stack ──────────────────────────────────── */}
          <section className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs font-heading uppercase text-muted-text tracking-wider">
              <Code2 className="w-4 h-4 text-accent" /> Proven Technology Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {service.techStack.map((tech, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white font-heading">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* ── 8. Section 7: Case Studies / Proof Snippet ───────────────────────── */}
          <section className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <Badge variant="status" color="success" className="px-2.5 py-0.5 text-[10px] mb-1">
                  Proven Results
                </Badge>
                <h3 className="text-xl font-extrabold font-heading text-white">Case Study Proof</h3>
              </div>
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
                View All Case Studies
              </Button>
            </div>

            <Card variant="glass" className="p-5 md:p-6 border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-3">
                <Badge variant="ai" className="px-2 py-0.5 text-[10px]">
                  {relevantCaseStudy.industry} Case Study
                </Badge>
                <h4 className="text-lg font-bold font-heading text-white">
                  {relevantCaseStudy.title}
                </h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  {relevantCaseStudy.qualitativeResult}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {relevantCaseStudy.results.map((r, i) => (
                    <div key={i} className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                      <div className="text-sm font-extrabold text-accent font-heading">{r.metric}</div>
                      <div className="text-[10px] text-muted-text line-clamp-1">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5">
                <img
                  src={relevantCaseStudy.image}
                  alt={relevantCaseStudy.title}
                  className="rounded-xl object-cover w-full h-44 border border-white/10"
                />
              </div>
            </Card>
          </section>

          {/* ── 9. Section 8: Why Chromolog ───────────────────────────────────────── */}
          <section className="space-y-5">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <h2 className="text-2xl font-extrabold font-heading text-white">
                Why Growing Businesses Choose Chromolog
              </h2>
              <p className="text-xs text-muted-text">
                Engineering excellence backed by commercial responsibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card variant="glass" className="p-5 border-white/[0.08] text-center space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-white">100% Code Ownership</h3>
                <p className="text-xs text-muted-text font-body leading-relaxed">
                  Zero vendor lock-in. Full IP rights and GitHub source code repository access transferred upon project delivery.
                </p>
              </Card>

              <Card variant="glass" className="p-5 border-white/[0.08] text-center space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-white">Sub-Second Speed & Modern Tech</h3>
                <p className="text-xs text-muted-text font-body leading-relaxed">
                  Engineered with modern React and clean backend APIs for blazing speed and optional AI automation capabilities.
                </p>
              </Card>

              <Card variant="glass" className="p-5 border-white/[0.08] text-center space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-success/20 text-success flex items-center justify-center mx-auto">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-white">Direct Technical Support</h3>
                <p className="text-xs text-muted-text font-body leading-relaxed">
                  Direct communication with senior engineers ensuring clear requirements, rapid development, and post-launch support.
                </p>
              </Card>
            </div>
          </section>

          {/* ── 10. Section 9: FAQs Accordion (SEO Schema Ready) ───────────────────── */}
          <section className="max-w-3xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold font-heading text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-muted-text">Clear answers to help you make informed software decisions.</p>
            </div>

            <div className="space-y-2.5">
              {service.faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-4 font-heading font-semibold text-xs sm:text-sm text-white hover:text-accent transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-accent" : "text-muted-text"}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-4 pb-3.5 text-xs font-body text-muted-text leading-relaxed border-t border-white/[0.04] pt-2.5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* ── 11. Section 10: High-Converting CTA & Lead Form ─────────────────── */}
          <section id="consultation-form" className="p-6 md:p-10 rounded-2xl bg-gradient-to-r from-primary/20 via-bg-dark to-accent/15 border border-white/15 relative overflow-hidden">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-3">
                <Badge variant="ai" className="px-3 py-0.5 text-[11px]">
                  Free Technology Audit
                </Badge>
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white leading-tight">
                  Discuss Your Project with Chromolog Engineers
                </h2>
                <p className="text-xs text-muted-text font-body leading-relaxed">
                  Book a free 30-minute consultation. We'll analyze your current manual workflows and provide a clear system architecture roadmap and quote.
                </p>

                <div className="space-y-1.5 pt-1 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> No sales pressure — 100% technical advice.
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Custom proposal delivered within 24 hours.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card variant="glass" className="p-5 border-white/15 bg-bg-dark/80 backdrop-blur-xl">
                  {submitted ? (
                    <div className="text-center py-6 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold font-heading text-white">Consultation Requested!</h3>
                      <p className="text-xs text-muted-text">
                        Our lead software architect will review your project details and reach out within 4 hours.
                      </p>
                      <a
                        href={`https://wa.me/919400230723?text=Hi%2C%20I%20just%20submitted%20a%20consultation%20request%20for%20${encodeURIComponent(service.h1)}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline pt-1 font-heading"
                      >
                        Need faster response? Chat on WhatsApp →
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="text-xs font-bold font-heading text-white mb-1">Get a Free Consultation</div>
                      
                      <div>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Your Name *"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="tel"
                          name="phone"
                          required
                          placeholder="Phone / WhatsApp *"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                        />
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="Work Email *"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div>
                        <select
                          name="currentSetup"
                          value={formData.currentSetup}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 rounded-xl bg-bg-dark border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                        >
                          <option value="Excel & Manual Processes">Current Setup: Excel / Spreadsheets</option>
                          <option value="WhatsApp Order Chaos">Current Setup: WhatsApp Orders</option>
                          <option value="Outdated Legacy Website">Current Setup: Outdated Website</option>
                          <option value="Off-the-shelf Software">Current Setup: Disconnected SaaS Software</option>
                          <option value="New Business Project">Current Setup: New Project Idea</option>
                        </select>
                      </div>

                      <div>
                        <textarea
                          name="message"
                          rows="2"
                          placeholder="Briefly describe your requirements..."
                          value={formData.message}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent resize-none"
                        />
                      </div>

                      <Button variant="gradient" size="sm" className="w-full text-xs py-2.5" type="submit">
                        Submit Consultation Request
                      </Button>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </section>

        </div>
      </div>
    </PageTransition>
  );
}
