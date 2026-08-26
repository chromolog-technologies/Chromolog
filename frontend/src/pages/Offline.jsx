import React, { useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Home } from "lucide-react";

const PARTICLES = [...Array(4)].map((_, i) => ({
  width: 4 + Math.random() * 4,
  height: 4 + Math.random() * 4,
  color: i % 2 === 0 ? "#f59e0b" : "#4f46e5",
}));

export default function Offline({ setActivePage }) {
  const [checking, setChecking] = useState(false);

  const tryReconnect = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setChecking(false);
      }
    }, 1500);
  };

  const goHome = () => {
    if (setActivePage) setActivePage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-6">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[15%] w-[280px] h-[280px] bg-warning/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-[220px] h-[220px] bg-primary/4 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Offline icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-warning/70" />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-white">
            You're offline
          </h1>
          <p className="text-muted-text font-body text-base leading-relaxed">
            It looks like you've lost your internet connection. Some content may still be available from cache.
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
            onClick={tryReconnect}
            disabled={checking}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "Try Again"}
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-heading font-bold text-sm hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>

        {/* Connection status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs text-muted-text/60 font-body">Waiting for connection</span>
        </motion.div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.width,
              height: p.height,
              left: `${15 + i * 20}%`,
              top: `${25 + (i % 2) * 30}%`,
              background: p.color,
              opacity: 0.2,
            }}
            animate={{ y: [-6, 6, -6], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
