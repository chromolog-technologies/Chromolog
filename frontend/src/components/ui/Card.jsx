import React from "react";

export default function Card({
  children,
  variant = "glass",
  className = "",
  glow = false,
  glowColor = "primary",
  hoverEffect = "lift",
  onClick,
  ...props
}) {
  const baseCard = "relative rounded-2xl border transition-all duration-300 overflow-hidden";
  
  const variants = {
    glass: "bg-white/80 backdrop-blur-xl border-slate-200/80 text-slate-900 shadow-sm hover:shadow-md",
    feature: "bg-white border-slate-200 text-slate-900 shadow-sm hover:border-primary/40 hover:shadow-lg",
    pricing: "bg-white border-slate-200 text-slate-900 hover:border-primary/40 shadow-md hover:shadow-xl",
    product: "bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-xl hover:shadow-primary/5",
    project: "bg-white border-slate-200 text-slate-900 hover:border-primary/40 shadow-sm hover:shadow-md",
    statistic: "bg-white/90 backdrop-blur-lg border-slate-200 text-center p-6 text-slate-900 shadow-sm",
    ai: "bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg hover:border-primary/40 text-slate-900",
    hover: "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-900 shadow-sm",
  };

  const hovers = {
    none: "",
    lift: "hover:-translate-y-2 hover:shadow-2xl",
    scale: "hover:scale-102",
    glow: "hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
  };

  const glows = {
    primary: "before:absolute before:inset-0 before:rounded-2xl before:bg-radial before:from-primary/10 before:to-transparent before:-z-10 before:pointer-events-none",
    secondary: "before:absolute before:inset-0 before:rounded-2xl before:bg-radial before:from-secondary/10 before:to-transparent before:-z-10 before:pointer-events-none",
    accent: "before:absolute before:inset-0 before:rounded-2xl before:bg-radial before:from-accent/10 before:to-transparent before:-z-10 before:pointer-events-none",
  };

  return (
    <div
      onClick={onClick}
      className={`${baseCard} ${variants[variant]} ${hovers[hoverEffect]} ${glow ? glows[glowColor] : ""} ${className}`}
      {...props}
    >
      {/* Visual Accent Layer */}
      {variant === "ai" && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent blur-2xl rounded-full pointer-events-none" />
      )}
      
      {children}
    </div>
  );
}

// Subcomponents for structure
Card.Header = function CardHeader({ children, className = "" }) {
  return <div className={`p-6 border-b border-white/[0.06] ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = "" }) {
  return <div className={`p-6 border-t border-white/[0.06] bg-white/[0.01] ${className}`}>{children}</div>;
};
