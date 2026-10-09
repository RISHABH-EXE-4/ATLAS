import React from 'react';

interface AtlasLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const AtlasLogo: React.FC<AtlasLogoProps> = ({
  size = 'md',
  showWordmark = false,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* Cool Purple Hexagonal Ribbon Glyph from Design */}
      <div className={`relative ${iconDimensions} flex items-center justify-center shrink-0`}>
        <div className="absolute inset-0 rounded-2xl bg-purple-600/30 blur-md group-hover:blur-lg transition-all" />
        <svg
          viewBox="0 0 44 44"
          className="relative w-full h-full drop-shadow-[0_2px_12px_rgba(168,85,247,0.45)] transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hex-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
            <linearGradient id="hex-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="hex-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* 3D Interlocking Hexagonal Vertical Ribbon Loops */}
          {/* Left vertical ribbon column */}
          <path
            d="M 12 11 L 18 8 L 18 33 L 12 36 Z"
            fill="url(#hex-grad-2)"
            opacity="0.9"
          />
          {/* Center vertical ribbon column */}
          <path
            d="M 19 7 L 25 4 L 25 37 L 19 40 Z"
            fill="url(#hex-grad-1)"
          />
          {/* Right vertical ribbon column */}
          <path
            d="M 26 8 L 32 11 L 32 36 L 26 33 Z"
            fill="url(#hex-grad-3)"
            opacity="0.95"
          />

          {/* Diagonal connecting cross bridges that complete the hexagonal fold */}
          <path
            d="M 12 11 L 19 7 L 25 11 L 18 15 Z"
            fill="url(#hex-grad-3)"
            opacity="0.8"
          />
          <path
            d="M 25 33 L 32 36 L 25 40 L 18 36 Z"
            fill="url(#hex-grad-1)"
            opacity="0.85"
          />

          {/* Outer hexagonal contour highlight */}
          <path
            d="M 22 3 L 34 10 L 34 34 L 22 41 L 10 34 L 10 10 Z"
            stroke="url(#hex-grad-1)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>

      {showWordmark && (
        <span
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          className="text-lg font-bold tracking-wider text-white"
        >
          ATLAS
        </span>
      )}
    </div>
  );
};
