import React, { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  loading = false,
  disabled = false,
  magnetic = false,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!magnetic || !buttonRef.current || disabled || loading) return;

    const button = buttonRef.current;
    
    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      setCoords({ x: x * 0.35, y: y * 0.35 });
    };

    const handleMouseLeave = () => {
      setCoords({ x: 0, y: 0 });
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [magnetic, disabled, loading]);

  const baseStyles = "relative inline-flex items-center justify-center font-heading font-semibold tracking-wide rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-98 select-none";
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/30 border border-transparent",
    secondary: "bg-surface-secondary text-white hover:bg-surface border border-white/10 hover:border-white/20",
    ghost: "bg-transparent text-white hover:bg-white/10 border border-transparent",
    outline: "bg-transparent text-white border border-white/15 hover:border-white/30 hover:bg-white/5",
    gradient: "bg-gradient-to-r from-primary via-secondary to-purple-glow text-white border border-transparent hover:shadow-lg hover:shadow-primary/20 hover:scale-101",
  };

  const magneticStyle = magnetic
    ? { transform: `translate3d(${coords.x}px, ${coords.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={magneticStyle}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {isHovered && (variant === "primary" || variant === "gradient") && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full animate-[shimmer_1.5s_infinite]" />
      )}
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : Icon && iconPosition === "left" ? (
        <Icon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === "right" ? (
        <Icon className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
      ) : null}
    </button>
  );
}
