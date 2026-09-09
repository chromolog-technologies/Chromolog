import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Upload, Sparkles } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const benefits = [
  "Work on real products",
  "AI-first development culture",
  "Flexible work environment",
  "Internship opportunities",
  "Growth-focused team",
  "Real client exposure",
];

export default function Careers() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  };

  const scrollToForm = () => {
    document.getElementById("career-application")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative bg-bg-dark text-white overflow-hidden py-20 md:py-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.018] pointer-events-none" />
      <div className="absolute top-12 left-[-10%] w-[360px] h-[360px] rounded-full bg-primary/8 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-24 right-[-8%] w-[320px] h-[320px] rounded-full bg-accent/6 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto pt-10 pb-14 md:pb-16"
        >
          <Badge variant="ai" className="mb-4 px-4 py-1.5 text-xs">Careers</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white leading-tight">
            Build the Future With <span className="gradient-text-primary">Chromolog</span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed mt-5 max-w-2xl mx-auto font-body">
            Join a growing AI-first software company building modern web, mobile, SaaS, and enterprise solutions.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="gradient" size="lg" icon={ArrowRight} iconPosition="right" onClick={scrollToForm}>
              Apply Now
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16 md:mb-20">
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-4">
              <Badge variant="ai" className="px-3 py-1 text-xs">Why Work With Us</Badge>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mt-4">
                Real products, sharp teams, meaningful client exposure.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mt-4 font-body">
                We keep teams close to product decisions, client problems, and modern AI tooling so every role has room to grow.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="rounded-2xl border border-white/10 bg-[#0a0d1d]/80 backdrop-blur-xl p-5 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mb-3" />
                <h3 className="text-sm font-heading font-bold text-white">{benefit}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        <div id="career-application" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-28">
          <div className="lg:col-span-5">
            <Badge variant="ai" className="px-3 py-1 text-xs">Application</Badge>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mt-4">Want to grow with us?</h2>
            <p className="text-sm text-slate-300 leading-relaxed mt-4 font-body">
              Tell us what you want to do, where we can see your work, and how you want to grow with Chromolog.
            </p>
          </div>
          <Card variant="glass" className="lg:col-span-7 p-6 md:p-8 border-white/15 bg-[#0a0d1d]/90 shadow-2xl backdrop-blur-2xl">
            {submitted && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-heading mb-6">
                Thanks for applying. Our team will review your profile and get back to you.
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="career-name" className="block text-xs font-heading font-semibold text-white mb-1">Name *</label>
                  <input id="career-name" name="name" type="text" required placeholder="Your name" className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body shadow-sm" />
                </div>
                <div>
                  <label htmlFor="career-email" className="block text-xs font-heading font-semibold text-white mb-1">Email *</label>
                  <input id="career-email" name="email" type="email" required placeholder="you@example.com" className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="career-phone" className="block text-xs font-heading font-semibold text-white mb-1">Phone *</label>
                  <input id="career-phone" name="phone" type="tel" required placeholder="+91 94002 30723" className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body shadow-sm" />
                </div>
                <div>
                  <label htmlFor="career-portfolio" className="block text-xs font-heading font-semibold text-white mb-1">Portfolio / GitHub / LinkedIn</label>
                  <input id="career-portfolio" name="portfolio" type="url" placeholder="https://..." className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body shadow-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="career-resume" className="block text-xs font-heading font-semibold text-white mb-1">Resume Upload</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#050816] border border-white/15 text-xs text-slate-300 cursor-pointer">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload resume as PDF or DOC</span>
                  <input id="career-resume" name="resume" type="file" accept=".pdf,.doc,.docx" className="opacity-0 w-full h-full absolute inset-0 cursor-pointer" />
                </div>
              </div>
              <div>
                <label htmlFor="career-message" className="block text-xs font-heading font-semibold text-white mb-1">Message</label>
                <textarea id="career-message" name="message" rows="3" placeholder="Tell us about your experience, strengths, and what you'd like to build." className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-body resize-none shadow-sm" />
              </div>
              <Button variant="gradient" size="md" type="submit" icon={Sparkles} iconPosition="right" className="w-full md:w-auto">
                Apply Now
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
