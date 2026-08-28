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
      primary: "bg-blue-50 border-blue-200 text-blue-700 font-bold",
      secondary: "bg-sky-50 border-sky-200 text-sky-700 font-bold",
      success: "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold",
      warning: "bg-amber-50 border-amber-200 text-amber-800 font-bold",
      error: "bg-rose-50 border-rose-200 text-rose-700 font-bold",
      info: "bg-sky-50 border-sky-200 text-sky-700 font-bold",
    },
    new: "bg-blue-50 border-blue-300 text-blue-600 font-bold animate-pulse",
    ai: "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 font-bold shadow-sm",
    enterprise: "bg-slate-100 border-slate-200 text-slate-800 font-bold transition-all",
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
