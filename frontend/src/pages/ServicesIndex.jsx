// ─── Services Index Hub Page (/services) ──────────────────────────────────────

import { servicesData } from "../data/servicesData";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageTransition from "../components/motion/PageTransition";
import { ArrowRight, CheckCircle2, Cpu, ShieldCheck } from "lucide-react";

export default function ServicesIndex({ setActivePage }) {
  const serviceList = Object.values(servicesData);

  const handleServiceClick = (slug) => {
    if (setActivePage) {
      setActivePage(`services/${slug}`);
      window.history.pushState({}, "", `/services/${slug}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-dark text-slate-900 font-body pt-12 pb-24">
        {/* Ambient top light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
            <Badge variant="ai" className="px-4 py-1.5 text-xs font-semibold">
              Digital Systems &amp; Software Engineering
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight">
              We Build Digital Systems for Growing Businesses
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-body leading-relaxed">
              From website upgrades to custom web applications, CRM, HRMS, LMS and business software, Chromolog helps businesses replace manual processes and outdated technology.
            </p>
          </div>

          {/* Grid of 10 Priority Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceList.map((service, idx) => (
              <Card
                key={service.slug}
                variant="glass"
                className="p-6 border-slate-200/80 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group shadow-sm bg-white"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="ai" className="px-2.5 py-0.5 text-[10px]">
                      0{idx + 1} • {service.badge}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-heading">Kerala &amp; Dubai</span>
                  </div>

                  <h2 className="text-lg font-bold font-heading text-slate-900 group-hover:text-primary transition-colors">
                    {service.h1}
                  </h2>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.hero.solution}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {service.whatWeBuild.slice(0, 2).map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="line-clamp-1">{w.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between group-hover:border-primary group-hover:bg-blue-50"
                    onClick={() => handleServiceClick(service.slug)}
                  >
                    <span>Explore Solution</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Free Consultation Banner */}
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-50 via-white to-purple-50 border border-slate-200 text-center max-w-4xl mx-auto space-y-6 shadow-md">
            <h2 className="text-2xl font-extrabold font-heading text-slate-900">
              Not Sure Which System Your Business Needs First?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
              Our software architects analyze your current manual workflows and provide a clear 1-page technology roadmap with zero obligation.
            </p>
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
