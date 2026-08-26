import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { setAnalyticsConsent } from "../utils/analytics";

const STORAGE_KEY = "chromolog_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsConsent(stored === "accepted");
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setAnalyticsConsent(true);
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setAnalyticsConsent(false);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100%-2rem)] max-w-xl"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="relative bg-[#0A0F1D]/95 border border-white/[0.08] rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-xl">
            {/* Dismiss X */}
            <button
              onClick={decline}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.05] text-muted-text hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-4.5 h-4.5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-bold text-white mb-1">
                  We use cookies & analytics
                </p>
                <p className="text-xs text-muted-text font-body leading-relaxed">
                  We use analytics cookies to understand how visitors use our site and improve your experience. No personal data is sold or shared.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={accept}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-heading font-bold hover:bg-primary/90 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Accept All
                  </button>
                  <button
                    onClick={decline}
                    className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-heading font-semibold text-muted-text hover:text-white hover:border-white/[0.15] transition-colors"
                  >
                    Decline
                  </button>
                  <a
                    href="/privacy"
                    className="text-[11px] text-muted-text/60 hover:text-accent transition-colors underline underline-offset-2 font-body ml-auto"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
