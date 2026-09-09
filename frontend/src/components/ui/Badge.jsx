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
      primary: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 font-bold",
      secondary: "bg-sky-500/20 border-sky-400/40 text-sky-300 font-bold",
      success: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 font-bold",
      warning: "bg-amber-500/20 border-amber-400/40 text-amber-300 font-bold",
      error: "bg-rose-500/20 border-rose-400/40 text-rose-300 font-bold",
      info: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 font-bold",
    },
    new: "bg-blue-500/20 border-blue-400/40 text-blue-300 font-bold animate-pulse",
    ai: "bg-purple-500/20 border-purple-400/40 text-purple-200 font-bold shadow-sm",
    enterprise: "bg-slate-800/80 border-slate-700 text-slate-200 font-bold transition-all",
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
