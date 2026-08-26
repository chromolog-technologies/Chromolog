import React from "react";
import { motion } from "framer-motion";
import { Home, MessageSquare, FolderKanban } from "lucide-react";

// Particle sizes computed once at module load — NOT inside render to avoid re-rolling
const PARTICLES = [...Array(6)].map((_, i) => ({
  width: 4 + Math.random() * 6,
  height: 4 + Math.random() * 6,
  color: i % 2 === 0 ? "#4f46e5" : "#00e5ff",
}));

export default function NotFound({ setActivePage }) {
  const goHome = () => {
    if (setActivePage) setActivePage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-bg-dark flex items-center justify-center overflow-hidden px-6">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] bg-accent/4 blur-[90px] rounded-full pointer-events-none" />

      {/* Grid bg */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.012] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Glitch 404 number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8 select-none"
        >
          <span className="text-[10rem] md:text-[12rem] font-heading font-extrabold leading-none bg-gradient-to-b from-white/10 to-white/[0.02] bg-clip-text text-transparent">
            404
          </span>
          {/* Glitch layers */}
          <span className="absolute inset-0 text-[10rem] md:text-[12rem] font-heading font-extrabold leading-none text-accent/10 blur-[1px] select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10rem] md:text-[12rem] font-heading font-extrabold leading-none bg-gradient-to-br from-primary/20 to-accent/10 bg-clip-text text-transparent">
              404
            </span>
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
            Page not found
          </h1>
          <p className="text-muted-text font-body text-base leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => { goHome(); setTimeout(() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }), 400); }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-heading font-bold text-sm hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors"
          >
            <FolderKanban className="w-4 h-4" />
            View Projects
          </button>
          <button
            onClick={() => { goHome(); setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 400); }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-text font-heading font-bold text-sm hover:border-white/[0.15] hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Us
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
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: p.color,
              opacity: 0.25,
            }}
            animate={{ y: [-10, 10, -10], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
