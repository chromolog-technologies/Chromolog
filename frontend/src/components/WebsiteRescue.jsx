// ─── Website Rescue Offer Section ("Is Your Website 3+ Years Old?") ───────────

import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { AlertCircle, ShieldAlert } from "lucide-react";

export default function WebsiteRescue({ setActivePage }) {
  const signs = [
    "Takes more than 3 seconds to load on mobile phones.",
    "Non-responsive layout that looks broken on modern smartphones.",
    "Outdated visual design that doesn't reflect your current scale.",
    "Zero organic enquiry leads generated from Google search.",
    "Difficult to update content, services, or news without developer help.",
    "Lacks clear commercial Call-To-Action (CTA) triggers & WhatsApp sync.",
  ];

  const handleRescueClick = () => {
    if (setActivePage) {
      setActivePage("services/website-redesign");
      window.history.pushState({}, "", "/services/website-redesign");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-16 md:py-20 bg-bg-dark/80 border-b border-white/[0.06] overflow-hidden" id="website-rescue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="ai" className="px-3.5 py-1 text-xs font-semibold">
            Website Rescue Offer
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
            Is Your Website 3+ Years Old?
          </h2>
          <p className="text-xs sm:text-base text-slate-600 font-body leading-relaxed">
            Your business may have grown and changed, but an outdated website actively loses valuable client leads to modern competitors every single day.
          </p>
        </div>

        {/* Warning signs checklist */}
        <Card variant="glass" className="p-6 md:p-8 border-amber-500/30 bg-amber-50/50 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-base font-bold font-heading text-slate-900">7 Warning Signs Your Website Needs an Immediate Upgrade:</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signs.map((sign, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-800 font-body leading-relaxed">{sign}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900 block font-heading">Modernize Your Web Platform:</strong>
              We upgrade legacy sites into fast, React-engineered lead generation assets with 301 SEO protection.
            </div>
            <Button variant="gradient" size="md" onClick={handleRescueClick} className="whitespace-nowrap shrink-0">
              Get a Free Website Health Check
            </Button>
          </div>
        </Card>

      </div>
    </section>
  );
}
