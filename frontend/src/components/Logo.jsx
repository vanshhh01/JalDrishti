import React from 'react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl'
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-5.5 sm:h-5.5',
    lg: 'w-7 h-7'
  };

  const textSizes = {
    sm: 'text-base font-black',
    md: 'text-xl sm:text-2xl font-black',
    lg: 'text-2xl sm:text-3xl font-black'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Crystalline Water Drop Icon (No Green Dot) */}
      <div className={`relative ${iconSizes[size] || iconSizes.md} bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 transition duration-300 ring-2 ring-white/80 shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          className={`${svgSizes[size] || svgSizes.md} text-white`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="rgba(255,255,255,0.25)" />
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <circle cx="12" cy="14" r="3" fill="white" fillOpacity="0.95" />
        </svg>
      </div>

      {showText && (
        <span className={`${textSizes[size] || textSizes.md} tracking-tight bg-gradient-to-r from-cyan-700 via-teal-700 to-blue-800 bg-clip-text text-transparent select-none`}>
          JalDrishti
        </span>
      )}
    </div>
  );
}
