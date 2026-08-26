import React, { useState } from "react";

const logoSrc = "/images/chromologtechnologies.webp";

export default function BrandLogo({ className = "h-12 w-auto", compact = false }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <svg
          width={compact ? "36" : "44"}
          height={compact ? "36" : "44"}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden="true"
        >
          <rect width="44" height="44" rx="12" fill="url(#brand-grad)" />
          <path d="M14 14L22 28L30 14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="15" r="2.5" fill="#00E5FF" />
          <defs>
            <linearGradient id="brand-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
        {!compact && (
          <span className="font-heading font-extrabold text-white text-base tracking-tight leading-none">
            CHROMOLOG
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      className={`${className} object-contain shrink-0 transition-transform duration-500 group-hover:scale-105 rounded-lg`}
      src={logoSrc}
      alt="Chromolog Technologies logo"
      width={compact ? 40 : 48}
      height={compact ? 40 : 48}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
