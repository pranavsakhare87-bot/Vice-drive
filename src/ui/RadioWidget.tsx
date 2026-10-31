import React, { useState } from 'react';
import { soundEngine, SoundSystem } from '../audio/SoundSystem';
import { Radio, Volume2, VolumeX, ChevronLeft, ChevronRight, Disc } from 'lucide-react';

export const RadioWidget: React.FC = () => {
  const [stationIdx, setStationIdx] = useState(soundEngine.getCurrentStationIndex());
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  const currentStation = SoundSystem.STATIONS[stationIdx];

  const handleNext = () => {
    const next = soundEngine.nextStation();
    setStationIdx(next);
  };

  const handlePrev = () => {
    const prev = soundEngine.prevStation();
    setStationIdx(prev);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative pointer-events-auto select-none bg-slate-900/90 border border-pink-500/60 rounded-xl p-2.5 shadow-[0_0_20px_rgba(255,0,127,0.3)] flex items-center gap-3 backdrop-blur-none text-white font-mono">
      {/* 80s Cassette Icon / Rotating Reel */}
      <div className="relative w-10 h-10 rounded-lg bg-pink-950/80 border border-pink-500/80 flex items-center justify-center shrink-0">
        <Disc className={`w-6 h-6 text-pink-400 ${stationIdx !== 4 && !isMuted ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
      </div>

      {/* Station Name & Genre */}
      <div className="flex flex-col min-w-[130px]">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-pink-400 tracking-wider">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>VICE RADIO</span>
        </div>
        <span className="text-sm font-black text-white tracking-wide truncate">
          {currentStation.name}
        </span>
        <span className="text-[10px] text-slate-400 truncate">
          {currentStation.genre}
        </span>
      </div>

      {/* Station Selectors & Mute */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          className="p-1 rounded bg-slate-800 hover:bg-pink-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          title="Previous Station ([)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          className="p-1 rounded bg-slate-800 hover:bg-pink-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          title="Next Station (])"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggleMute}
          className={`p-1 rounded transition-colors cursor-pointer border ${
            isMuted ? 'bg-red-900/80 border-red-500 text-red-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Toggle Mute (M)"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
