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
    <section className="relative bg-bg-dark overflow-hidden py-20 md:py-24">
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
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 leading-tight">
            Build the Future With <span className="gradient-text-primary">Chromolog</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed mt-5 max-w-2xl mx-auto">
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
            <div className="sticky top-28">
              <Badge variant="ai" className="px-3 py-1 text-xs">Why Work With Us</Badge>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mt-4">
                Real products, sharp teams, meaningful client exposure.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-4">
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
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mb-3" />
                <h3 className="text-sm font-heading font-bold text-slate-900">{benefit}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        <div id="career-application" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-28">
          <div className="lg:col-span-5">
            <Badge variant="ai" className="px-3 py-1 text-xs">Application</Badge>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mt-4">Want to grow with us?</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
              Tell us what you want to do, where we can see your work, and how you want to grow with Chromolog.
            </p>
          </div>
          <Card variant="glass" className="lg:col-span-7 p-6 md:p-8 border-slate-200 bg-white shadow-sm">
            {submitted && (
              <div className="fs-success-msg">
                Thanks for applying. Our team will review your profile and get back to you.
              </div>
            )}
            <form className="fields mt-0" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="career-name">Name</label>
                  <input id="career-name" name="name" type="text" required placeholder="Your name" />
                </div>
                <div className="field">
                  <label htmlFor="career-email">Email</label>
                  <input id="career-email" name="email" type="email" required placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label htmlFor="career-phone">Phone</label>
                  <input id="career-phone" name="phone" type="tel" required placeholder="+91 94002 30723" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="career-portfolio">Portfolio / GitHub / LinkedIn</label>
                <input id="career-portfolio" name="portfolio" type="url" placeholder="https://..." />
              </div>
              <div className="field">
                <label htmlFor="career-resume">Resume Upload</label>
                <label className="career-upload" htmlFor="career-resume">
                  <Upload className="w-4 h-4 text-accent" />
                  <span>Upload resume as PDF or DOC</span>
                </label>
                <input id="career-resume" name="resume" type="file" accept=".pdf,.doc,.docx" className="sr-only" />
              </div>
              <div className="field">
                <label htmlFor="career-message">Message</label>
                <textarea id="career-message" name="message" placeholder="Tell us about your experience, strengths, and what you'd like to build." />
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
