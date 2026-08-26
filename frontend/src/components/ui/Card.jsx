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
    glass: "bg-white/[0.03] backdrop-blur-xl border-white/[0.08] text-white",
    feature: "bg-surface-secondary border-white/[0.06] text-white hover:border-primary/30",
    pricing: "bg-surface border-white/[0.08] hover:border-primary/40 shadow-xl",
    product: "bg-surface border-white/[0.06] shadow-md hover:shadow-2xl hover:shadow-primary/5",
    project: "bg-surface-secondary border-white/[0.08] hover:border-accent/40 shadow-lg",
    statistic: "bg-white/[0.02] backdrop-blur-lg border-white/[0.08] text-center p-6 text-white",
    ai: "bg-gradient-to-br from-surface to-surface-secondary border-white/[0.08] shadow-2xl hover:border-purple-glow/40 text-white",
    hover: "bg-surface-secondary border-white/[0.05] hover:bg-white/[0.06] cursor-pointer text-white",
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
