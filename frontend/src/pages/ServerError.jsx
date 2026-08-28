import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Home, MessageSquare, AlertTriangle } from "lucide-react";

const PARTICLES = [...Array(5)].map((_, i) => ({
  width: 4 + Math.random() * 5,
  height: 4 + Math.random() * 5,
  color: i % 2 === 0 ? "#ef4444" : "#f59e0b",
}));

export default function ServerError({ setActivePage }) {
  const goHome = () => {
    if (setActivePage) setActivePage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-6">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-error/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] bg-warning/4 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Error icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-error/70" />
          </div>
          <span className="text-7xl md:text-8xl font-heading font-extrabold leading-none bg-gradient-to-b from-white/10 to-white/[0.02] bg-clip-text text-transparent">
            500
          </span>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-slate-600 font-body text-base leading-relaxed">
            We encountered an unexpected error. Our team has been notified. Please try refreshing the page.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-heading font-bold text-sm hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => {
              goHome();
              setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 400);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-text font-heading font-bold text-sm hover:border-white/[0.15] hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Support
          </button>
        </motion.div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.width,
              height: p.height,
              left: `${10 + i * 18}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: p.color,
              opacity: 0.2,
            }}
            animate={{ y: [-8, 8, -8], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
