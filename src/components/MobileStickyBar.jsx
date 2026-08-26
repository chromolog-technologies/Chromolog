// ─── Mobile Bottom Sticky Action Bar (Icon Only Pill) ──────────────────────────

import { MessageSquare, PhoneCall, Sparkles } from "lucide-react";

export default function MobileStickyBar({ onOpenAudit }) {
  return (
    <aside aria-label="Quick Mobile Actions" className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-bg-dark/90 backdrop-blur-2xl border border-white/15 px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-3">
        
        {/* WhatsApp Icon */}
        <a
          href="https://wa.me/919400230723?text=Hi%2C%20I%20would%20like%20to%20discuss%20a%20digital%20system%20project%20for%20our%20business."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Us"
          className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center active:scale-90 transition-transform shadow-md"
        >
          <MessageSquare className="w-5 h-5" />
        </a>

        {/* Call Icon */}
        <a
          href="tel:+919400230723"
          aria-label="Call Us"
          className="w-11 h-11 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center active:scale-90 transition-transform shadow-md"
        >
          <PhoneCall className="w-5 h-5" />
        </a>

        {/* Free Audit Icon */}
        <button
          onClick={onOpenAudit}
          aria-label="Free Digital Efficiency Audit"
          className="w-11 h-11 rounded-full bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/30"
        >
          <Sparkles className="w-5 h-5" />
        </button>

      </div>
    </aside>
  );
}
