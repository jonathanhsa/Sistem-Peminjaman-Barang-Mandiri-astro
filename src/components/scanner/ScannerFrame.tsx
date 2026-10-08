import React from 'react';

export const ScannerFrame: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
      {/* Scanner Box Target */}
      <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-2xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] overflow-hidden transform-gpu scanner-box">
        {/* Animated Laser Line */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2EC4A0] to-transparent shadow-[0_0_12px_#2EC4A0] animate-scan pointer-events-none" />

        {/* 4 Corner Markers */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-[#FFD23F] rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-[#FFD23F] rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-[#FFD23F] rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-[#FFD23F] rounded-br-lg" />

        {/* Central Crosshair Guide */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-12 h-0.5 bg-white" />
          <div className="h-12 w-0.5 bg-white absolute" />
        </div>
      </div>
    </div>
  );
};
