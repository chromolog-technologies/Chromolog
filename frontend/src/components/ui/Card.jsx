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
    glass: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 text-white shadow-2xl hover:border-purple-500/40 hover:bg-[#131c4a]/60",
    feature: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 text-white shadow-2xl hover:border-purple-500/40 hover:bg-[#131c4a]/60",
    pricing: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 text-white hover:border-purple-500/40 shadow-2xl hover:bg-[#131c4a]/60",
    product: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 text-white shadow-2xl hover:border-purple-500/40 hover:bg-[#131c4a]/60",
    project: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 text-white hover:border-purple-500/40 shadow-2xl hover:bg-[#131c4a]/60",
    statistic: "bg-[#0f1435]/60 backdrop-blur-xl border-white/10 text-center p-6 text-white shadow-2xl",
    ai: "bg-gradient-to-br from-[#0f1435]/80 to-[#192258]/80 backdrop-blur-xl border-white/10 shadow-2xl hover:border-purple-500/40 text-white",
    hover: "bg-[#0f1435]/50 backdrop-blur-xl border-white/10 hover:bg-[#131c4a]/60 cursor-pointer text-white shadow-2xl",
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
