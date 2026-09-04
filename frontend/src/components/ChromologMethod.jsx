// ─── The Chromolog Method ("We Don't Start With Technology. We Start With Your Business.") ─────

import Card from "./ui/Card";
import Badge from "./ui/Badge";

export default function ChromologMethod() {
  const steps = [
    {
      num: "01",
      title: "Understand",
      desc: "Your current processes & operational habits.",
    },
    {
      num: "02",
      title: "Identify",
      desc: "What is inefficient & causing friction.",
    },
    {
      num: "03",
      title: "Design",
      desc: "The right digital system blueprint.",
    },
    {
      num: "04",
      title: "Build",
      desc: "Software around your exact requirements.",
    },
    {
      num: "05",
      title: "Automate",
      desc: "Connect everything into one database.",
    },
    {
      num: "06",
      title: "Improve",
      desc: "Long-term support, security & upgrades.",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-bg-dark border-b border-white/[0.06] overflow-hidden" id="method">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="ai" className="px-3.5 py-1 text-xs font-semibold">
            Our Differentiator
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            We Don't Start With Technology. We Start With Your Business.
          </h2>
          <p className="text-xs sm:text-base text-slate-300 font-body leading-relaxed max-w-xl mx-auto">
            The Chromolog Method ensures software is engineered 100% around how your business actually operates.
          </p>
        </div>

        {/* 6 Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {steps.map((item, idx) => (
            <Card key={idx} variant="glass" className="p-5 border-white/15 bg-white/[0.04] backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-3 hover:border-cyan-400/40 hover:bg-white/[0.08] transition-all group">
              <div className="space-y-2">
                <div className="text-xs font-extrabold font-heading text-cyan-400">
                  {item.num}
                </div>
                <h3 className="text-base font-bold font-heading text-white group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 font-body leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
