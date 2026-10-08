import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-12', variant = 'full' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Gear + Leaf Symbol */}
      <svg
        viewBox="0 0 200 200"
        className="h-full w-auto shrink-0 drop-shadow-sm"
        aria-label="Logo Oficina Técnica Ibarra y Asociados"
      >
        {/* Outer Technical Gear in Institutional Forest Green */}
        <g fill="#387042">
          {/* Gear teeth */}
          <path d="M 90 10 L 110 10 L 112 30 A 70 70 0 0 1 135 39 L 152 26 L 166 40 L 153 57 A 70 70 0 0 1 162 80 L 182 82 L 182 102 L 162 104 A 70 70 0 0 1 153 127 L 166 144 L 152 158 L 135 145 A 70 70 0 0 1 112 154 L 110 174 L 90 174 L 88 154 A 70 70 0 0 1 65 145 L 48 158 L 34 144 L 47 127 A 70 70 0 0 1 38 104 L 18 102 L 18 82 L 38 80 A 70 70 0 0 1 47 57 L 34 40 L 48 26 L 65 39 A 70 70 0 0 1 88 30 Z" />
        </g>
        
        {/* White Ring Divider */}
        <circle cx="100" cy="92" r="54" fill="#FFFFFF" />
        <circle cx="100" cy="92" r="48" fill="#F4F7F4" stroke="#387042" strokeWidth="3" />

        {/* Central Vibrant Eco Leaf */}
        <path
          d="M 68 112 C 65 85, 88 62, 125 58 C 128 85, 110 120, 68 112 Z"
          fill="#8CBF26"
        />
        {/* Leaf Center Line */}
        <path
          d="M 72 108 Q 95 82 122 62"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Typography */}
      {variant !== 'compact' && (
        <div className="flex flex-col justify-center font-sans tracking-tight leading-none text-slate-900">
          <span className="font-bold text-xs sm:text-sm md:text-base tracking-widest text-emerald-950 uppercase">
            Oficina Técnica
          </span>
          <span className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 tracking-wider uppercase">
            Ibarra y Asociados, C.A.
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 tracking-widest mt-0.5">
            RIF: J-40230045-0
          </span>
        </div>
      )}
    </div>
  );
};
