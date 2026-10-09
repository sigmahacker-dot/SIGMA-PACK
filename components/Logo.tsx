// Original Sigma Pack logo: a bold "S" mark in an orange rounded square + wordmark.
// Built as an inline SVG component — 100% original design, not copied from any reference.

"use client";

import { useId } from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export default function Logo({ size = 36, showWordmark = true }: LogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "") + "sg";
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="Sigma Pack logo"
        className="shrink-0 drop-shadow-[0_4px_14px_rgba(255,106,0,0.45)]"
      >
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF8C2E" />
            <stop offset="1" stopColor="#E05A00" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill={`url(#${uid})`} />
        {/* inner highlight */}
        <rect x="3" y="3" width="42" height="20" rx="10" fill="#fff" opacity="0.14" />
        {/* bold S stroke */}
        <path
          d="M30.5 16.2c-1.3-1.5-3.4-2.4-5.7-2.4-3.6 0-6.4 2.1-6.4 5.1 0 7 14.6 3.6 14.6 10.7 0 3.4-3.5 5.6-7.7 5.6-2.9 0-5.6-1.2-7.1-3"
          stroke="#fff"
          strokeWidth="4.6"
          strokeLinecap="round"
        />
        {/* lightning tick accent */}
        <path d="M33 31.5l-2.6 7 6.2-8.2" stroke="#0A1830" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-white">
          Sigma{" "}
          <span className="text-gradient-orange">Pack</span>
        </span>
      )}
    </span>
  );
}
