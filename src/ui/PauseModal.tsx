import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onResetCar: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onResetCar,
  onReturnTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none font-mono">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 shadow-[0_0_40px_rgba(255,0,127,0.4)] text-white flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          <span className="text-xs font-black tracking-widest text-cyan-400">
            VICE CITY CRUISER
          </span>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-300">
            GAME PAUSED
          </h2>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME DRIVING (ESC)</span>
          </button>

          <button
            onClick={onResetCar}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-cyan-500/50 cursor-pointer active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET CAR TO ROAD (R)</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold text-sm border border-pink-500/50 cursor-pointer active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO TITLE SCREEN</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 text-center">
          Free Roam Mode · Explore Ocean Drive, Stunt Jumps & Metropolis
        </div>
      </div>
    </div>
  );
};
