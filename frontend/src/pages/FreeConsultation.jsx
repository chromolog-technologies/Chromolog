// ─── Free Technology Consultation Lead Capture Page (/free-consultation) ───────

import { useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";
import { CheckCircle2, ShieldCheck, PhoneCall, Clock, Sparkles, Building2 } from "lucide-react";

export default function FreeConsultation({ setActivePage }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    serviceNeeded: "Custom Software Development",
    currentSetup: "Excel Spreadsheets",
    details: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-white font-body pt-12 pb-24">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/20 via-accent/10 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
            <Badge variant="ai" className="px-4 py-1.5 text-xs font-semibold">
              Commercial Technology Audit
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Get a Free Technology Consultation
            </h1>
            <p className="text-sm sm:text-base text-muted-text font-body leading-relaxed">
              Replacing manual processes or an outdated website starts with a clear architecture plan. Speak directly with Chromolog senior software engineers — zero sales pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* Left Column: What happens during consultation */}
            <div className="lg:col-span-6 space-y-8">
              <Card variant="glass" className="p-6 md:p-8 border-white/15 space-y-6">
                <div className="space-y-2">
                  <div className="text-xs font-heading font-semibold text-accent uppercase tracking-wider">What We Analyze</div>
                  <h2 className="text-xl font-bold font-heading text-white">Your 30-Minute Consultation Includes:</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { title: "Manual Process Bottleneck Audit", desc: "We review how your team currently uses Excel, WhatsApp, paper, or legacy tools." },
                    { title: "Custom System Architecture Proposal", desc: "We recommend whether a web application, custom CRM, HRMS, LMS, or ERP is right." },
                    { title: "Fixed Timeline & Quote Estimate", desc: "You receive a transparent cost breakdown and milestone plan within 24 hours." },
                    { title: "100% Code Ownership Explanation", desc: "Understand how your IP rights, source code, and data security are safeguarded." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold font-heading text-white">{item.title}</div>
                        <div className="text-xs text-muted-text font-body leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-white font-heading">Prefer instant WhatsApp chat?</div>
                    <div className="text-[10px] text-muted-text">Chat with our engineering lead in Kerala/Dubai</div>
                  </div>
                  <a
                    href="https://wa.me/919400230723?text=Hi%2C%20I%20would%20like%20to%20book%20a%20Free%20Technology%20Consultation."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-success/20 text-success border border-success/30 text-xs font-bold font-heading hover:bg-success/30 transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Us
                  </a>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4 text-center">
                <Card variant="glass" className="p-4 border-white/[0.08]">
                  <div className="text-xl font-extrabold text-accent font-heading">24 Hours</div>
                  <div className="text-xs text-muted-text">Proposal Delivery Time</div>
                </Card>
                <Card variant="glass" className="p-4 border-white/[0.08]">
                  <div className="text-xl font-extrabold text-success font-heading">Zero Cost</div>
                  <div className="text-xs text-muted-text">No Obligation Audit</div>
                </Card>
              </div>
            </div>

            {/* Right Column: Lead Form */}
            <div className="lg:col-span-6">
              <Card variant="glass" className="p-6 md:p-8 border-white/15 bg-bg-dark/90">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-extrabold font-heading text-white">Consultation Request Received!</h2>
                    <p className="text-xs text-muted-text max-w-md mx-auto leading-relaxed">
                      Thank you, <strong className="text-white">{formData.name}</strong>. Our senior software architect is reviewing your details and will call or WhatsApp you shortly.
                    </p>
                    <div className="pt-4">
                      <a
                        href="https://wa.me/919400230723?text=Hi%2C%20I%20just%20submitted%20my%20consultation%20request%20form."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-bg-dark text-xs font-bold font-heading hover:bg-accent/90 transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" /> Message Us Directly on WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h2 className="text-xl font-extrabold font-heading text-white">Book Your Consultation</h2>
                      <p className="text-xs text-muted-text mt-0.5">Fill in your business context below.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="e.g. Rahul Nair"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Phone / WhatsApp *</label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Work Email *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="rahul@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Company Name</label>
                          <input
                            type="text"
                            name="company"
                            placeholder="Your Business Name"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Primary Service Needed</label>
                          <select
                            name="serviceNeeded"
                            value={formData.serviceNeeded}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-bg-dark border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                          >
                            <option value="Custom Software Development">Custom Software Development</option>
                            <option value="Web Application Development">Web Application Development</option>
                            <option value="Website Redesign & Upgrade">Website Redesign & Upgrade</option>
                            <option value="Mobile App Development">Mobile App Development</option>
                            <option value="Custom CRM Development">Custom CRM Development</option>
                            <option value="Custom ERP Development">Custom ERP Development</option>
                            <option value="HRMS Development">HRMS Development</option>
                            <option value="LMS Development">LMS Development</option>
                            <option value="Business Automation">Business Automation</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-semibold text-white/90 mb-1">What process are you looking to replace?</label>
                        <select
                          name="currentSetup"
                          value={formData.currentSetup}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-bg-dark border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                        >
                          <option value="Excel Spreadsheets">Excel Spreadsheets & Manual Files</option>
                          <option value="WhatsApp Order Chats">WhatsApp Order & Customer Chats</option>
                          <option value="Outdated 2017-2020 Website">Outdated 2017-2020 Website</option>
                          <option value="Manual Paper Attendance/Rosters">Manual Paper Attendance & Shift Rosters</option>
                          <option value="Disconnected SaaS Apps">Disconnected SaaS Software</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-semibold text-white/90 mb-1">Project Details / Goals</label>
                        <textarea
                          name="details"
                          rows="3"
                          placeholder="Tell us a little bit about your project requirements..."
                          value={formData.details}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent resize-none"
                        />
                      </div>
                    </div>

                    <Button variant="gradient" size="md" className="w-full mt-2" type="submit">
                      Schedule Free Technology Consultation
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
