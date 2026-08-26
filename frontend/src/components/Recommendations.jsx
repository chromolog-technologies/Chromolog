import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight, Lightbulb } from "lucide-react";
import { getRecommendations, getVisitorProfile, recordVisit, trackCTAInterest } from "../utils/visitor";
import { trackRecommendation } from "../utils/analytics";

/**
 * AI-powered recommendation bar.
 * Appears after visitor has viewed 2+ sections or spent 30s on the page.
 * Shows personalized service, product, and CTA recommendations.
 */
export default function Recommendations({ setActivePage }) {
  const [visible, setVisible] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Record this visit
    recordVisit();

    // Check if already dismissed this session
    if (sessionStorage.getItem("chromolog_recs_dismissed")) {
      setDismissed(true);
      return;
    }

    const refreshRecommendations = (force = false) => {
      const profile = getVisitorProfile();
      const sectionCount = Object.keys(profile.viewedSections).length;

      // Only show if visitor has engaged (2+ sections viewed or 2+ visits)
      if (force || sectionCount >= 2 || profile.visitCount >= 2) {
        const recs = getRecommendations();
        if (recs.length > 0) {
          setRecommendations(recs);
          setVisible(true);
        }
      }
    };

    // Wait briefly for intent signals, then keep updating when the profile changes.
    const timer = setTimeout(() => refreshRecommendations(false), 12000);
    const handleProfileChange = () => refreshRecommendations(false);
    window.addEventListener("chromolog:visitor-profile", handleProfileChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("chromolog:visitor-profile", handleProfileChange);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem("chromolog_recs_dismissed", "1");
  };

  const handleClick = (rec) => {
    trackRecommendation(rec.type, rec.title);
    trackCTAInterest(`Recommendation: ${rec.title}`);

    if (rec.type === "cta") {
      // Scroll to contact via Lenis bridge
      window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "contact" } }));
    } else if (rec.type === "blog") {
      setActivePage?.("blog");
      window.history.pushState({}, "", "/blog");
    } else if (rec.type === "product" || rec.type === "service") {
      // Scroll to relevant section via Lenis bridge
      const sectionMap = { service: "services", product: "product" };
      const targetId = sectionMap[rec.type] || "services";
      window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: targetId } }));
    }

    handleDismiss();
  };

  if (dismissed) return null;

  // Recommendation type icon colors
  const typeColors = {
    service: "from-primary to-purple-glow",
    product: "from-accent to-secondary",
    blog: "from-warning to-error",
    cta: "from-success to-accent",
  };

  return (
    <AnimatePresence>
      {visible && recommendations.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-6xl mx-auto px-6 py-16"
          aria-label="Personalized recommendations"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white">
                  Recommended for You
                </h3>
                <p className="text-xs text-muted-text font-body">
                  Personalized based on your interests
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-text hover:text-white transition-colors"
              aria-label="Dismiss recommendations"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
              <motion.button
                key={rec.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onClick={() => handleClick(rec)}
                className="group text-left p-5 rounded-2xl border border-white/[0.06] bg-[#0A0F1D]/50 hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[rec.type] || "from-primary to-accent"} flex items-center justify-center shrink-0`}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-accent/60 block mb-1">
                      {rec.type}
                    </span>
                    <h3 className="text-sm font-heading font-bold text-white group-hover:text-accent transition-colors leading-snug">
                      {rec.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-muted-text font-body mb-3">
                  {rec.reason}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-accent/70 group-hover:text-accent transition-colors">
                  Explore
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
