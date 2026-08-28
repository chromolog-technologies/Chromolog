import React from "react";
import { motion } from "framer-motion";
import { Settings, Clock, Mail, MessageSquare } from "lucide-react";

const PARTICLES = [...Array(4)].map((_, i) => ({
  width: 3 + Math.random() * 5,
  height: 3 + Math.random() * 5,
  color: i % 2 === 0 ? "#4f46e5" : "#00e5ff",
}));

const WHATSAPP_URL = "https://wa.me/919400230723?text=Hi%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.";

export default function Maintenance() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-6">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[10%] w-[280px] h-[280px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[220px] h-[220px] bg-accent/4 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Animated gear icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="w-10 h-10 text-primary/70" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            We'll be back shortly
          </h1>
          <p className="text-slate-600 font-body text-base leading-relaxed">
            We're performing scheduled maintenance to improve your experience. This usually takes a few minutes.
          </p>

          {/* Estimated time */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-slate-600 font-body">
              Estimated downtime: <strong className="text-slate-900">15–30 minutes</strong>
            </span>
          </div>
        </motion.div>

        {/* Contact options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <a
            href="mailto:chromologtech@gmail.com"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-heading font-bold text-sm hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </a>
        </motion.div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.width,
              height: p.height,
              left: `${12 + i * 20}%`,
              top: `${22 + (i % 3) * 22}%`,
              background: p.color,
              opacity: 0.2,
            }}
            animate={{ y: [-6, 6, -6], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
