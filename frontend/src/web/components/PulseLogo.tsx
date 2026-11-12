import React from 'react';

interface PulseLogoProps {
  size?: number;
  variant?: 'icon' | 'horizontal' | 'vertical';
  className?: string;
  showTagline?: boolean | 'always' | 'desktop';
  textColor?: 'dark' | 'white';
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
  size = 40,
  variant = 'horizontal',
  className = '',
  showTagline = true,
  textColor = 'dark',
}) => {
  const iconMarkup = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="flex-shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Map Pin Shape */}
      <path
        d="M50,95 C43,83 20,53 20,38 C20,21.4 33.4,8 50,8 C66.6,8 80,21.4 80,38 C80,53 57,83 50,95 Z"
        fill="#E7373A"
      />

      {/* Inner White Circle */}
      <circle cx="50" cy="38" r="18" fill="white" />

      {/* Red Pulse Heartbeat Line */}
      <path
        d="M37,38 L43,38 L44,34 L46,40 L48.5,25 L51,51 L53,32 L56,40 L57,38 L63,38"
        stroke="#E7373A"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  const titleColorClass = textColor === 'white' ? 'text-white' : 'text-[#121414] dark:text-white';
  const taglineColorClass = textColor === 'white' ? 'text-[#C7D2FE]' : 'text-[#4B5563] dark:text-slate-400';

  if (variant === 'icon') {
    return iconMarkup;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <div className="hover:scale-105 transition-transform duration-200">
          {iconMarkup}
        </div>
        <div className="flex flex-col items-center mt-1">
          <span className={`font-extrabold tracking-normal lowercase leading-none ${titleColorClass}`} style={{ fontSize: `${size * 0.65}px` }}>
            pulse
          </span>
          {Boolean(showTagline) && (
            <span className={`${taglineColorClass} font-semibold tracking-wider text-xs mt-1.5 whitespace-nowrap uppercase`}>
              No queue for your cure
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  const isAlwaysTagline = showTagline === 'always';
  const showHorizontalTagline = Boolean(showTagline);

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <div className="hover:scale-105 transition-transform duration-200 shrink-0">
        {iconMarkup}
      </div>
      <div className="flex flex-col justify-center text-left leading-none">
        <span className={`font-extrabold tracking-normal lowercase ${titleColorClass}`} style={{ fontSize: `${Math.max(18, size * 0.6)}px`, lineHeight: 1 }}>
          pulse
        </span>
        {showHorizontalTagline && (
          <span 
            className={`${taglineColorClass} font-semibold tracking-wider uppercase mt-1 ${isAlwaysTagline ? 'inline-block' : 'hidden sm:inline-block'}`} 
            style={{ fontSize: `${Math.max(10, size * 0.22)}px` }}
          >
            No queue for your cure
          </span>
        )}
      </div>
    </div>
  );
};

export default PulseLogo;
