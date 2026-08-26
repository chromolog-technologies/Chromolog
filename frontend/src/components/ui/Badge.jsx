import React from "react";

export default function Badge({
  children,
  variant = "status",
  color = "primary",
  glow = true,
  className = "",
  ...props
}) {
  const baseBadge = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full select-none font-heading tracking-wide border";
  
  const variants = {
    status: {
      primary: "bg-primary/20 border-primary/40 text-indigo-200 shadow-[0_0_8px_rgba(79,70,229,0.15)]",
      secondary: "bg-secondary/20 border-secondary/40 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
      success: "bg-success/20 border-success/40 text-emerald-200 shadow-[0_0_8px_rgba(34,197,94,0.15)]",
      warning: "bg-warning/20 border-warning/40 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
      error: "bg-error/20 border-error/40 text-rose-200 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
      info: "bg-secondary/20 border-secondary/40 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
    },
    new: "bg-accent/20 border-accent/40 text-accent animate-pulse",
    ai: "bg-gradient-to-r from-primary/20 to-purple-glow/20 border-purple-glow/40 text-accent shadow-[0_0_12px_rgba(124,58,237,0.2)]",
    enterprise: "bg-white/10 border-white/20 text-white hover:border-white/30 transition-all",
  };

  const getStyle = () => {
    if (variant === "status") {
      return variants.status[color] || variants.status.primary;
    }
    return variants[variant] || variants.status.primary;
  };

  return (
    <span
      className={`${baseBadge} ${getStyle()} ${className}`}
      {...props}
    >
      {/* Decorative dot indicator for status badges */}
      {variant === "status" && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${glow ? 'animate-pulse' : ''}`} />
      )}
      
      {variant === "ai" && (
        <span className="text-[10px] uppercase font-bold tracking-wider mr-0.5 text-accent">AI</span>
      )}

      {children}
    </span>
  );
}
