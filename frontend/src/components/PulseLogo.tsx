import React from 'react';

interface PulseLogoProps {
  size?: number;
  variant?: 'icon' | 'horizontal' | 'vertical';
  className?: string;
  showTagline?: boolean;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
  size = 40,
  variant = 'horizontal',
  className = '',
  showTagline = true,
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
      {/* Map Pin Shadow/Glow (Subtle) */}
      <filter id="logo-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.25" />
      </filter>

      {/* Map Pin Shape */}
      <path
        d="M50,95 C43,83 20,53 20,38 C20,21.4 33.4,8 50,8 C66.6,8 80,21.4 80,38 C80,53 57,83 50,95 Z"
        fill="#EF4444"
        filter="url(#logo-glow)"
      />

      {/* Inner White Circle */}
      <circle cx="50" cy="38" r="18" fill="white" />

      {/* Red Pulse Heartbeat Line */}
      <path
        d="M37,38 L43,38 L44,34 L46,40 L48.5,25 L51,51 L53,32 L56,40 L57,38 L63,38"
        stroke="#EF4444"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'icon') {
    return iconMarkup;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <div className="hover:scale-105 transition-transform duration-300">
          {iconMarkup}
        </div>
        <div className="flex flex-col items-center mt-1">
          <span className="font-extrabold tracking-normal text-slate-900 dark:text-white lowercase leading-none" style={{ fontSize: `${size * 0.65}px` }}>
            pulse
          </span>
          {showTagline && (
            <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] mt-2 whitespace-nowrap uppercase">
              NO QUEUE FOR YOUR CURE
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="hover:scale-105 transition-transform duration-300">
        {iconMarkup}
      </div>
      <div className="flex flex-col justify-center text-left leading-none">
        <span className="font-extrabold tracking-normal text-slate-900 dark:text-white lowercase" style={{ fontSize: `${size * 0.6}px`, lineHeight: 1 }}>
          pulse
        </span>
        {showTagline && (
          <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-1.5" style={{ fontSize: `${size * 0.17}px`, letterSpacing: '0.15em' }}>
            NO QUEUE FOR YOUR CURE
          </span>
        )}
      </div>
    </div>
  );
};
