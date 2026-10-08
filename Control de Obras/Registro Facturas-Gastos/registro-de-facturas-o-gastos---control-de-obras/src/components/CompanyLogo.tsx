import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ className = '', size = 'md' }) => {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-xs tracking-wider font-extrabold',
    md: 'text-sm sm:text-base tracking-widest font-extrabold',
    lg: 'text-lg sm:text-xl tracking-widest font-extrabold',
  };

  const subtitleSizes = {
    sm: 'text-[10px] tracking-widest font-bold',
    md: 'text-xs sm:text-sm tracking-widest font-bold',
    lg: 'text-sm sm:text-base tracking-widest font-bold',
  };

  const rifSizes = {
    sm: 'text-[9px] text-gray-500 font-semibold',
    md: 'text-xs text-gray-500 font-semibold',
    lg: 'text-sm text-gray-500 font-semibold',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision SVG Replica of the green gear & leaf logo */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Gear */}
          <path
            d="M50 15 
               C53 15 54 18 57 19 C61 17 64 16 67 19 C70 22 69 25 72 28 C75 29 78 30 79 34 C80 38 78 41 81 45 C84 49 85 51 85 55 C85 59 82 61 80 65 C78 69 79 72 76 75 C73 78 70 77 66 80 C62 83 60 85 56 84 C52 83 49 85 45 85 C41 85 39 82 35 80 C31 78 28 79 25 76 C22 73 23 70 20 66 C17 62 15 60 16 56 C17 52 15 49 15 45 C15 41 18 39 20 35 C22 31 21 28 24 25 C27 22 30 23 34 20 C38 17 40 15 44 16 Z"
            fill="#3B7A46"
          />
          
          {/* Gear teeth outline effect */}
          <circle cx="50" cy="50" r="44" stroke="#2D6036" strokeWidth="3" />
          
          {/* Teeth pattern */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => (
            <rect
              key={idx}
              x="45"
              y="4"
              width="10"
              height="12"
              rx="2"
              fill="#3B7A46"
              stroke="#26522E"
              strokeWidth="1"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}

          {/* Inner White Ring */}
          <circle cx="50" cy="50" r="32" fill="#FFFFFF" stroke="#3B7A46" strokeWidth="2.5" />

          {/* Green Leaf Inside */}
          <path
            d="M 33 55 C 33 35, 67 32, 67 32 C 67 32, 69 58, 48 64 C 40 66, 33 62, 33 55 Z"
            fill="#88C222"
          />
          
          {/* Leaf Inner Vein curve */}
          <path
            d="M 35 56 Q 48 48 65 33"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-left font-sans leading-tight">
        <span className={`text-[#111827] dark:text-gray-100 ${titleSizes[size]}`}>
          OFICINA TÉCNICA
        </span>
        <span className={`text-[#15803D] dark:text-emerald-400 ${subtitleSizes[size]}`}>
          IBARRA Y ASOCIADOS, C.A.
        </span>
        <span className={rifSizes[size]}>
          J-40230045-0
        </span>
      </div>
    </div>
  );
};
