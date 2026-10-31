import React from 'react';
import { Play, Sparkles, Volume2, Image as ImageIcon } from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGallery: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onOpenGallery }) => {
  const handleStart = () => {
    soundEngine.init();
    soundEngine.resume();
    onStart();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-12 pointer-events-none select-none font-mono">
      {/* Top Header & Negative Space */}
      <div className="flex justify-between items-start pointer-events-auto">
        {/* Bespoke inline SVG Title Lockup with 80s Vice City Synthwave typography */}
        <div className="flex flex-col">
          <svg className="w-[300px] sm:w-[460px] h-[90px] sm:h-[120px]" viewBox="0 0 460 120" fill="none">
            <defs>
              <linearGradient id="vicePink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff007f" />
                <stop offset="50%" stopColor="#ff4b93" />
                <stop offset="100%" stopColor="#ff9a00" />
              </linearGradient>
              <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#48cfad" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* "VICE CITY" Script style */}
            <text
              x="20"
              y="55"
              fill="url(#vicePink)"
              filter="url(#neonGlow)"
              fontSize="48"
              fontWeight="900"
              fontFamily="Impact, sans-serif"
              fontStyle="italic"
              letterSpacing="2"
            >
              VICE CITY
            </text>

            {/* "CRUISER" Sleek Outrun underline text */}
            <text
              x="25"
              y="98"
              fill="url(#neonCyan)"
              filter="url(#neonGlow)"
              fontSize="34"
              fontWeight="900"
              fontFamily="Arial Black, sans-serif"
              letterSpacing="8"
            >
              CRUISER
            </text>

            {/* Neon horizontal racing slice bars */}
            <line x1="280" y1="92" x2="440" y2="92" stroke="#ff007f" strokeWidth="4" />
            <line x1="320" y1="98" x2="440" y2="98" stroke="#00f0ff" strokeWidth="3" />
          </svg>

          {/* Subtitle badge */}
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/80 text-[11px] font-black text-emerald-300 tracking-wider">
              M-POWER MINT GREEN SPECIAL
            </span>
            <span className="text-[11px] text-pink-300 font-bold">
              FREE ROAM OPEN WORLD
            </span>
          </div>
        </div>

        {/* User photo thumbnail badge & gallery opener */}
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-pink-500/80 hover:bg-pink-900/60 transition-colors shadow-[0_0_20px_rgba(255,0,127,0.3)] cursor-pointer text-white"
        >
          <img
            src="/assets/aistudio/download__1__394dedf9.jpeg"
            alt="Reference"
            className="w-10 h-7 object-cover rounded border border-cyan-400"
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>REFERENCE PHOTO</span>
            </span>
            <span className="text-[11px] font-black text-pink-200">
              CUSTOM 3D MODEL
            </span>
          </div>
        </button>
      </div>

      {/* 30-40% Negative Center Space allows live 3D showcase of the rotating mint car! */}
      <div className="flex-1" />

      {/* Bottom Start Lockup & Control Hint */}
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        {/* Start Button */}
        <button
          onClick={handleStart}
          className="group relative flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 text-white font-black text-lg sm:text-xl tracking-wider shadow-[0_0_35px_rgba(255,0,127,0.6)] hover:shadow-[0_0_50px_rgba(0,240,255,0.8)] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>START DRIVING (ENTER / TAP)</span>
        </button>

        {/* Flat control-hint line as required by Game Craft */}
        <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 text-center tracking-wide shadow-md">
          <span className="text-cyan-400 font-bold">WASD / Touch Pedals</span> Move ·{' '}
          <span className="text-pink-400 font-bold">Space / Drift Button</span> Handbrake ·{' '}
          <span className="text-yellow-300 font-bold">Shift / NOS</span> Nitro ·{' '}
          <span className="text-cyan-300 font-bold">Haptics Active</span>
        </div>
      </div>
    </div>
  );
};
