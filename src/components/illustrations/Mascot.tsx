import React from 'react';

export interface MascotProps {
  mood?: 'happy' | 'alert' | 'scanning' | 'holding_card';
  size?: number;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 120,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Mascot ${mood}`}
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Soft Shadow Base */}
        <ellipse cx="80" cy="148" rx="50" ry="8" fill="#1e1b3a" opacity="0.12" />

        {/* Mascot Body (Friendly rounded droplet / robot-owl character) */}
        <rect
          x="32"
          y="36"
          width="96"
          height="100"
          rx="44"
          fill="#3B3FD9"
          stroke="#1E1B3A"
          strokeWidth="4"
        />

        {/* Belly / Face Screen */}
        <rect
          x="44"
          y="50"
          width="72"
          height="68"
          rx="28"
          fill="#FFFFFF"
          stroke="#1E1B3A"
          strokeWidth="3.5"
        />

        {/* Mascot Ears / Antennas */}
        <circle cx="48" cy="34" r="10" fill="#FFD23F" stroke="#1E1B3A" strokeWidth="3" />
        <circle cx="112" cy="34" r="10" fill="#FFD23F" stroke="#1E1B3A" strokeWidth="3" />

        {/* Graduation cap or Top Ribbon */}
        <path
          d="M80 18L105 28L80 38L55 28L80 18Z"
          fill="#1E1B3A"
        />
        <circle cx="80" cy="28" r="3" fill="#FFD23F" />
        <path d="M102 29L106 42" stroke="#FFD23F" strokeWidth="2.5" strokeLinecap="round" />

        {mood === 'happy' && (
          <>
            {/* Happy Eyes (Curved arches) */}
            <path
              d="M58 78C58 72 68 72 68 78"
              stroke="#1E1B3A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M92 78C92 72 102 72 102 78"
              stroke="#1E1B3A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Blushing Cheeks */}
            <circle cx="56" cy="88" r="6" fill="#FF6B6B" opacity="0.4" />
            <circle cx="104" cy="88" r="6" fill="#FF6B6B" opacity="0.4" />
            {/* Big Smile */}
            <path
              d="M72 88C72 96 88 96 88 88"
              stroke="#1E1B3A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="#FF6B6B"
            />
          </>
        )}

        {mood === 'alert' && (
          <>
            {/* Surprised / Alert Wide Eyes */}
            <circle cx="63" cy="76" r="8" fill="#1E1B3A" />
            <circle cx="65" cy="74" r="3" fill="#FFFFFF" />
            <circle cx="97" cy="76" r="8" fill="#1E1B3A" />
            <circle cx="99" cy="74" r="3" fill="#FFFFFF" />
            {/* Alert Mouth */}
            <ellipse cx="80" cy="94" rx="7" ry="9" fill="#FF6B6B" stroke="#1E1B3A" strokeWidth="3" />
            {/* Exclamation Badge on Side */}
            <circle cx="120" cy="50" r="12" fill="#FF6B6B" stroke="#1E1B3A" strokeWidth="2.5" />
            <text x="120" y="55" textAnchor="middle" fill="#FFFFFF" fontWeight="bold" fontSize="14">!</text>
          </>
        )}

        {mood === 'scanning' && (
          <>
            {/* Scanner Visor */}
            <rect
              x="52"
              y="68"
              width="56"
              height="20"
              rx="10"
              fill="#1E1B3A"
            />
            {/* Glowing Laser line */}
            <line
              x1="56"
              y1="78"
              x2="104"
              y2="78"
              stroke="#2EC4A0"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <animate attributeName="x1" values="56;75;56" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="x2" values="75;104;75" dur="1.5s" repeatCount="indefinite" />
            </line>
            <path
              d="M74 96H86"
              stroke="#1E1B3A"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        )}

        {mood === 'holding_card' && (
          <>
            <circle cx="63" cy="76" r="6" fill="#1E1B3A" />
            <circle cx="65" cy="74" r="2" fill="#FFFFFF" />
            <circle cx="97" cy="76" r="6" fill="#1E1B3A" />
            <circle cx="99" cy="74" r="2" fill="#FFFFFF" />
            <path
              d="M74 88C74 93 86 93 86 88"
              stroke="#1E1B3A"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Little ID Badge held in hand */}
            <rect x="70" y="105" width="20" height="26" rx="3" fill="#FFD23F" stroke="#1E1B3A" strokeWidth="2" />
            <line x1="74" y1="112" x2="86" y2="112" stroke="#1E1B3A" strokeWidth="2" />
            <line x1="74" y1="117" x2="84" y2="117" stroke="#1E1B3A" strokeWidth="1.5" />
          </>
        )}

        {/* Campus Badge on bottom corner */}
        <circle cx="44" cy="122" r="8" fill="#2EC4A0" stroke="#1E1B3A" strokeWidth="2.5" />
        <path d="M41 122L43 124L47 120" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};
