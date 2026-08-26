// ─── Executive Summary & AEO / GEO Answer Hub ────────────────────────────────
// Provides search engines & AI assistants (Google AI, ChatGPT, Perplexity) with:
// 1. Plain language definition of custom software engineering
// 2. Audience, industry, and use-case clarity
// 3. Key takeaways & executive summary
// 4. Decision support comparison matrix (Custom Software vs Off-the-Shelf SaaS)
// 5. Question-style headings with direct answer signals
// 6. Internal links & credible external citations (W3C, AWS)

import React from "react";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, ExternalLink, HelpCircle, ListOrdered } from "lucide-react";

export default function ExecutiveSummary({ setActivePage }) {
  const handleNavPage = (path) => {
    if (setActivePage) {
      setActivePage(path);
      window.history.pushState({}, "", `/${path}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="executive-summary" className="relative py-16 md:py-24 bg-bg-dark/95 border-b border-white/[0.06] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="ai" className="px-3.5 py-1 text-xs">
            Executive Briefing &amp; Key Takeaways
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Custom Software &amp; Digital Systems: At a Glance
          </h2>
          <p className="text-xs sm:text-base text-muted-text font-body leading-relaxed">
            Essential takeaways, plain-language definitions, decision support metrics, and architecture standards for business decision-makers.
          </p>
        </div>

        {/* 1. TOP EXECUTIVE SUMMARY & KEY TAKEAWAYS CARD */}
        <Card variant="glass" className="p-6 sm:p-8 border-accent/30 bg-accent/[0.02] shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-heading text-accent uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-accent" /> Top Executive Summary &amp; Definition
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                What is custom software development and who is it for?
              </h3>
              {/* Direct Answer Signal & Plain-Language Definition */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-2">
                <p className="text-xs font-bold font-heading text-accent uppercase tracking-wide">
                  Direct Answer Signal
                </p>
                <p className="text-sm text-slate-200 font-body leading-relaxed">
                  <strong className="text-white">Definition:</strong> Custom software development is defined as the process of designing, building, deploying, and maintaining bespoke web applications, mobile apps, CRM, ERP, and HRMS platforms tailored specifically to an organization's internal business logic and security standards, avoiding generic off-the-shelf constraints.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex flex-wrap gap-2 md:flex-col">
              <a
                href="/free-consultation"
                onClick={(e) => { e.preventDefault(); handleNavPage("free-consultation"); }}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-heading font-bold text-xs hover:shadow-lg transition-all"
              >
                Schedule Free Technology Consultation
              </a>
              <a
                href="/services"
                onClick={(e) => { e.preventDefault(); handleNavPage("services"); }}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white font-heading font-bold text-xs hover:bg-white/10 transition-all"
              >
                Explore Custom Software Services
              </a>
            </div>
          </div>

          {/* Key Takeaways & Audience Clarity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Key Takeaways for Decision-Makers
              </h4>
              <ul className="space-y-2 text-xs text-muted-text font-body leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong className="text-white">100% Code &amp; Data IP Ownership:</strong> Zero ongoing seat licenses or restrictive third-party SaaS vendor lock-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong className="text-white">Workflow Automation:</strong> Direct integration of Excel, WhatsApp messaging, statutory payroll, and billing into connected databases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong className="text-white">Sub-50ms Performance:</strong> Modern stack (React, Laravel, Flutter, PostgreSQL, AWS) compliant with <a href="https://www.w3.org/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white inline-flex items-center gap-0.5">W3C web standards <ExternalLink className="w-2.5 h-2.5" /></a>.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Target Audience &amp; Supported Use-Cases
              </h4>
              <p className="text-xs text-muted-text font-body leading-relaxed">
                Chromolog's digital systems are specifically engineered for <strong className="text-white">growing SMEs, mid-market enterprises, healthcare providers, educational institutions, retail networks, and hospitality groups</strong> in Kerala, Dubai, and across international markets seeking to eliminate operational chaos.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a href="/services" onClick={(e) => { e.preventDefault(); handleNavPage("services"); }} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white hover:border-accent/40">Healthcare Queues &amp; EMR</a>
                <a href="/services" onClick={(e) => { e.preventDefault(); handleNavPage("services"); }} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white hover:border-accent/40">Campus ERP &amp; LMS</a>
                <a href="/services" onClick={(e) => { e.preventDefault(); handleNavPage("services"); }} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white hover:border-accent/40">Multi-Branch Retail POS</a>
                <a href="/products" onClick={(e) => { e.preventDefault(); handleNavPage("products"); }} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-white hover:border-accent/40">Custom CRM &amp; HRMS</a>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. CONVERSATIONAL QUESTION HEADINGS WITH DIRECT ANSWERS & STEPS */}
        <div className="space-y-8 pt-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Question 1 */}
            <Card variant="glass" className="p-6 border-white/[0.08] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-accent flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold font-heading text-white">
                  What custom software solutions does Chromolog Technologies offer?
                </h3>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <p className="text-[11px] font-bold text-accent uppercase font-heading">Direct Summary Answer</p>
                  <p className="text-xs text-slate-300 font-body leading-relaxed">
                    Chromolog Technologies engineers custom web applications, cross-platform mobile apps in Flutter, enterprise ERPs, HRMS with biometric attendance, custom CRM portals, and automated business billing systems.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <a
                  href="/services"
                  onClick={(e) => { e.preventDefault(); handleNavPage("services"); }}
                  className="text-xs font-bold font-heading text-accent hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Explore Custom Software Development Services <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>

            {/* Question 2: How to replace manual processes */}
            <Card variant="glass" className="p-6 border-white/[0.08] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold font-heading text-white">
                  How to replace manual Excel and WhatsApp chaos with custom web applications?
                </h3>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <p className="text-[11px] font-bold text-accent uppercase font-heading">4-Step Transformation Process</p>
                  <ol className="space-y-1 text-xs text-slate-300 font-body list-decimal list-inside">
                    <li>Map current manual bottlenecks &amp; data touchpoints.</li>
                    <li>Architect a unified PostgreSQL cloud database schema.</li>
                    <li>Develop high-speed web portals &amp; mobile agent workflows.</li>
                    <li>Automate WhatsApp messaging, billing, and staff access.</li>
                  </ol>
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <a
                  href="/case-studies"
                  onClick={(e) => { e.preventDefault(); handleNavPage("case-studies"); }}
                  className="text-xs font-bold font-heading text-accent hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Browse Custom Software Case Studies &amp; Outcomes <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>

          </div>

        </div>

        {/* 3. DECISION SUPPORT & COMPARISON MATRIX */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Should I build custom software or buy off-the-shelf SaaS?
            </h3>
            <p className="text-xs text-muted-text font-body leading-relaxed">
              <strong className="text-white">Direct Answer:</strong> Build custom software when your core operational workflows create a competitive advantage and off-the-shelf SaaS tools impose rigid rules, expensive per-user license fees, or fragmented data silos.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-surface/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.1] bg-white/[0.03]">
                  <th className="p-4 font-heading font-bold text-white">Evaluation Dimension</th>
                  <th className="p-4 font-heading font-bold text-rose-400 bg-rose-500/5">Fragmented Tools (Excel / WhatsApp)</th>
                  <th className="p-4 font-heading font-bold text-amber-400 bg-amber-500/5">Generic Off-the-Shelf SaaS</th>
                  <th className="p-4 font-heading font-bold text-accent bg-accent/10">Chromolog Custom Digital System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-muted-text font-body">
                <tr>
                  <td className="p-4 font-bold text-white">Workflow Customization</td>
                  <td className="p-4 bg-rose-500/5">Zero structure (manual formulas &amp; chat chaos)</td>
                  <td className="p-4 bg-amber-500/5">Rigid pre-set templates &amp; unneeded features</td>
                  <td className="p-4 bg-accent/5 font-semibold text-white">100% tailored to exact company business logic</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">IP &amp; Data Ownership</td>
                  <td className="p-4 bg-rose-500/5">Stored on personal devices &amp; loose desktop sheets</td>
                  <td className="p-4 bg-amber-500/5">Vendor owns database &amp; platform architecture</td>
                  <td className="p-4 bg-accent/5 font-semibold text-white">Full client ownership of source code &amp; PostgreSQL DB</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Recurring License Fees</td>
                  <td className="p-4 bg-rose-500/5">$0 software cost, but high lost-productivity cost</td>
                  <td className="p-4 bg-amber-500/5">Per-user monthly subscription pricing that inflates fast</td>
                  <td className="p-4 bg-accent/5 font-semibold text-white">Zero per-user monthly SaaS fees</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Scalability &amp; Cloud Infrastructure</td>
                  <td className="p-4 bg-rose-500/5">Breaks easily as data volume grows</td>
                  <td className="p-4 bg-amber-500/5">Requires expensive third-party connector add-ons</td>
                  <td className="p-4 bg-accent/5 font-semibold text-white">Built on scalable <a href="https://aws.amazon.com/architecture/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white inline-flex items-center gap-0.5">AWS Cloud Architecture <ExternalLink className="w-2.5 h-2.5" /></a></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="/projects"
              onClick={(e) => { e.preventDefault(); handleNavPage("projects"); }}
              className="text-xs font-bold font-heading text-white hover:text-accent transition-colors underline"
            >
              View Custom Web App &amp; ERP Portfolio Projects
            </a>
            <span className="text-muted-text text-xs">•</span>
            <a
              href="/blog"
              onClick={(e) => { e.preventDefault(); handleNavPage("blog"); }}
              className="text-xs font-bold font-heading text-white hover:text-accent transition-colors underline"
            >
              Read Enterprise Software Engineering Blog
            </a>
            <span className="text-muted-text text-xs">•</span>
            <a
              href="/products"
              onClick={(e) => { e.preventDefault(); handleNavPage("products"); }}
              className="text-xs font-bold font-heading text-white hover:text-accent transition-colors underline"
            >
              Discover AlphaGrew ERP &amp; HumaNode HRMS Products
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

