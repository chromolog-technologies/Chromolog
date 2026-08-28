// ─── Who We Help Section ("Built for Businesses That Are Ready to Grow") ──────

import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { Building, TrendingUp, Layers, LayoutTemplate } from "lucide-react";

export default function WhoWeHelp() {
  const personas = [
    {
      icon: Building,
      title: "Small & Medium Businesses",
      desc: "You have outgrown manual spreadsheets and paper records, needing an affordable digital workflow system to scale.",
    },
    {
      icon: TrendingUp,
      title: "Growing Companies",
      desc: "Your existing software tools don't talk to each other or scale, causing operational bottlenecks and staff delay.",
    },
    {
      icon: Layers,
      title: "Established Enterprises",
      desc: "You need custom API integrations, automated HRMS/ERP modules, or legacy software system modernization.",
    },
    {
      icon: LayoutTemplate,
      title: "Businesses With Legacy Websites",
      desc: "Your website is 3+ years old, non-responsive, and fails to convert mobile visitors into qualified sales enquiries.",
    },
  ];

  return (
    <section className="relative py-16 md:py-20 bg-bg-dark/90 border-b border-white/[0.06] overflow-hidden" id="who-we-help">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="status" color="info" className="px-3.5 py-1 text-xs font-semibold">
            Ideal Business Partnerships
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 tracking-tight">
            Industries We Serve
          </h2>
          <p className="text-xs sm:text-base text-slate-600 font-body leading-relaxed">
            We partner with business owners and executive teams who recognize that technology is their strongest competitive advantage.
          </p>
        </div>

        {/* 4 Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {personas.map((p, idx) => (
            <Card key={idx} variant="glass" className="p-6 border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-200">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-heading text-slate-900 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 font-body leading-relaxed">{p.desc}</p>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
