// ─── Local SEO Geographic Landing Page (/locations/:loc) ──────────────────────

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";
import { MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { servicesData } from "../data/servicesData";

const locationInfo = {
  kochi: {
    name: "Kochi",
    region: "Kerala, India",
    h1: "Custom Software & Web Application Development Company in Kochi",
    desc: "Chromolog Technologies engineers custom software, web applications, CRM, HRMS, and business automation systems for growing enterprises in Kochi and Infopark technology hubs.",
    highlights: ["Local engineering team based in Kochi", "On-site workflow discovery & client meetings", "Proven record with Kochi retail, healthcare & logistics"],
    services: Object.values(servicesData),
  },
  kerala: {
    name: "Kerala",
    region: "India",
    h1: "Software Development & Business Automation Company in Kerala",
    desc: "Chromolog helps Kerala businesses transition from manual Excel spreadsheets, WhatsApp order chaos, and outdated legacy websites to modern cloud software.",
    highlights: ["State-wide software engineering presence", "Custom CRM, HRMS, ERP & Mobile App development", "Dedicated technical support in Malayalam & English"],
    services: Object.values(servicesData),
  },
  dubai: {
    name: "Dubai",
    region: "United Arab Emirates",
    h1: "Custom Software & Web Development Company in Dubai, UAE",
    desc: "Chromolog delivers high-performance digital systems, web apps, and enterprise business software for organizations across Dubai and the UAE.",
    highlights: ["UAE VAT & WPS statutory compliance", "High-speed cloud infrastructure on AWS Middle East", "Dedicated GCC client coordination"],
    services: Object.values(servicesData),
  },
  uae: {
    name: "UAE",
    region: "Middle East",
    h1: "Enterprise Software & Cloud Systems Engineering in UAE",
    desc: "Chromolog designs scalable cloud software, mobile apps, and custom enterprise portals tailored for businesses operating across the United Arab Emirates.",
    highlights: ["Cross-border GCC software solutions", "Bespoke CRM & ERP platforms", "24/7 cloud infrastructure monitoring"],
    services: Object.values(servicesData),
  },
};

export default function LocationPage({ locationSlug = "kochi", setActivePage }) {
  const loc = locationInfo[locationSlug] || locationInfo["kochi"];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-slate-900 font-body pt-12 pb-24">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-purple-50 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
            <Badge variant="status" color="info" className="px-4 py-1.5 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 mr-1" /> {loc.name}, {loc.region} Hub
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight">
              {loc.h1}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-body leading-relaxed">
              {loc.desc}
            </p>
          </div>

          {/* Local Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loc.highlights.map((h, i) => (
              <Card key={i} variant="glass" className="p-6 border-slate-200 bg-white shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-bold font-heading text-slate-900">{h}</span>
              </Card>
            ))}
          </div>

          {/* Services Available in Location */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold font-heading text-white">Services Available in {loc.name}</h2>
              <p className="text-xs text-muted-text mt-1">Tailored for regional market requirements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loc.services.map((svc) => (
                <Card
                  key={svc.slug}
                  variant="glass"
                  className="p-5 border-white/[0.08] hover:border-accent/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-accent font-heading">{svc.badge}</div>
                    <h3 className="text-base font-bold font-heading text-white group-hover:text-accent transition-colors">
                      {svc.h1}
                    </h3>
                    <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                      {svc.hero.solution}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => {
                        if (setActivePage) {
                          setActivePage(`services/${svc.slug}`);
                          window.history.pushState({}, "", `/services/${svc.slug}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-3.5 h-3.5 text-accent" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Local CTA */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-bg-dark to-accent/20 border border-white/10 text-center space-y-4">
            <h2 className="text-2xl font-extrabold font-heading text-white">
              Schedule an On-Site or Online Consultation in {loc.name}
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
