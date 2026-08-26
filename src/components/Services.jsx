// ─── Services — Grouped by Business Outcomes ────────────────────────────────────

import React from "react";
import { ArrowRight } from "lucide-react";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function Services({ setActivePage }) {
  const categories = [
    {
      id: "customers",
      badge: "🌐 Get More Customers",
      title: "Get More Customers",
      desc: "Turn passive internet visitors into qualified inbound business enquiries with fast, SEO-engineered web platforms.",
      items: [
        { name: "Website Development", slug: "website-development", desc: "High-converting corporate & lead generation websites." },
        { name: "Website Redesign", slug: "website-redesign", desc: "Modernize slow 3+ year old websites into fast lead assets." },
        { name: "Landing Pages & SEO", slug: "website-development", desc: "Targeted landing pages optimized for search rankings." },
      ],
    },
    {
      id: "automate",
      badge: "⚙️ Automate Operations",
      title: "Automate Your Business",
      desc: "Replace manual Excel spreadsheets, paper forms, and repetitive data entry with custom cloud software.",
      items: [
        { name: "Custom Software", slug: "custom-software-development", desc: "Tailor-made software built 100% around your exact business rules." },
        { name: "Web Applications", slug: "web-application-development", desc: "High-speed browser portals for staff, clients, and partners." },
        { name: "Business Automation", slug: "business-automation", desc: "Connect Excel, WhatsApp, and email into unified automated systems." },
      ],
    },
    {
      id: "manage",
      badge: "👥 Manage Clients & Teams",
      title: "Manage Customers & Teams",
      desc: "Centralize your sales pipeline, employee shift rosters, student lessons, and multi-branch operations.",
      items: [
        { name: "Custom CRM", slug: "crm-development", desc: "Visual lead pipelines, WhatsApp messaging, and sales rep KPIs." },
        { name: "HRMS & Payroll", slug: "hrms-development", desc: "Biometric attendance, shift rosters, and automated statutory payroll." },
        { name: "LMS Student Portals", slug: "lms-development", desc: "Course video streaming, online exams, and automated fee tracking." },
        { name: "Custom ERP Platforms", slug: "erp-development", desc: "Multi-branch stock inventory, purchase approvals, and billing." },
      ],
    },
    {
      id: "connect",
      badge: "📱 Connect Your Systems",
      title: "Connect Your Business",
      desc: "Connect mobile devices, field agents, payment gateways, and WhatsApp API into your central database.",
      items: [
        { name: "Mobile App Development", slug: "mobile-app-development", desc: "Cross-platform Flutter apps for iOS & Android with offline sync." },
        { name: "WhatsApp & API Bridges", slug: "business-automation", desc: "Automated WhatsApp receipts, order updates, and CRM sync." },
        { name: "Payment & Cloud Gateways", slug: "web-application-development", desc: "Seamless payment gateway integration and cloud hosting on AWS." },
      ],
    },
  ];

  const handleCardClick = (slug) => {
    if (setActivePage) {
      setActivePage(`services/${slug}`);
      window.history.pushState({}, "", `/services/${slug}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="relative bg-bg-dark overflow-hidden py-16 md:py-24 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="ai" className="px-3.5 py-1 text-xs">
            What Can We Modernize?
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
            What We Build
          </h2>
          <p className="text-xs sm:text-base text-muted-text font-body leading-relaxed">
            We don't offer generic IT catalog items. We engineer specific digital systems designed to solve operational friction and drive revenue growth.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} variant="glass" className="p-6 border-white/[0.08] flex flex-col justify-between space-y-5 hover:border-accent/40 transition-all">
              <div className="space-y-4">
                <div className="text-xs font-bold font-heading text-accent">{cat.badge}</div>
                <h3 className="text-xl font-bold font-heading text-white">{cat.title}</h3>
                <p className="text-xs text-muted-text font-body leading-relaxed">{cat.desc}</p>

                <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                  {cat.items.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => handleCardClick(item.slug)}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold font-heading text-white group-hover:text-accent transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-muted-text font-body">{item.desc}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-text group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Services Link */}
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              if (setActivePage) {
                setActivePage("services");
                window.history.pushState({}, "", "/services");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Explore All 10 Digital Systems →
          </Button>
        </div>

      </div>
    </section>
  );
}
