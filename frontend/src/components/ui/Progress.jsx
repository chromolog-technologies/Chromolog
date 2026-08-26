import React from "react";

export default function Progress({
  value = 0,
  max = 100,
  type = "linear",
  size = "md",
  color = "primary",
  showLabel = false,
  className = "",
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: "bg-primary text-primary",
    secondary: "bg-secondary text-secondary",
    accent: "bg-accent text-accent",
    success: "bg-success text-success",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  if (type === "circle") {
    const radius = 30;
    const strokeWidth = size === "sm" ? 4 : size === "md" ? 6 : 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const strokeColors = {
      primary: "stroke-primary",
      secondary: "stroke-secondary",
      accent: "stroke-accent",
      success: "stroke-success",
    };

    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            className="stroke-white/[0.06]"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          {/* Active progress circle */}
          <circle
            className={`transition-all duration-500 ease-out ${strokeColors[color]}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
        </svg>
        {showLabel && (
          <span className="absolute text-xs font-bold font-heading text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  // Linear Progress
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-muted-text font-heading">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.04]">
        <div
          style={{ width: `${percentage}%` }}
          className={`rounded-full transition-all duration-500 ease-out ${sizes[size]} ${colors[color]}`}
        />
      </div>
    </div>
  );
}
