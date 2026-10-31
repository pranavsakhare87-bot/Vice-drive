import React, { useState } from 'react';
import { CarTelemetry } from '../types';
import { Flame, Zap, Gauge } from 'lucide-react';

interface SpeedometerProps {
  telemetry: CarTelemetry;
}

export const Speedometer: React.FC<SpeedometerProps> = ({ telemetry }) => {
  const [useMph, setUseMph] = useState(false);

  const displaySpeed = useMph ? telemetry.speedMph : telemetry.speedKmh;
  const speedUnit = useMph ? 'MPH' : 'KM/H';
  const speedMax = useMph ? 200 : 320;

  // RPM calculation (0 to 8000 RPM)
  const normRpm = Math.min(Math.max((telemetry.rpm - 800) / (7200 - 800), 0), 1);
  const rpmAngle = -120 + normRpm * 240; // -120deg to +120deg

  const gearText = telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : `${telemetry.gear}`;

  return (
    <div className="relative select-none pointer-events-auto flex flex-col items-end gap-2 font-mono">
      {/* Drift Score Banner (Active while drifting) */}
      {telemetry.isDrifting && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600/90 to-purple-600/90 text-white px-3 py-1.5 rounded-lg border border-pink-400 shadow-[0_0_20px_rgba(255,0,127,0.5)] transform animate-bounce">
          <Flame className="w-5 h-5 text-yellow-300" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-pink-200">
              VICE DRIFT {telemetry.driftAngle}°
            </span>
            <span className="text-lg font-black text-yellow-300 tabular-nums">
              +{telemetry.driftScore} pts <span className="text-sm text-cyan-300">x{telemetry.driftCombo}</span>
            </span>
          </div>
        </div>
      )}

      {/* Stunt Airtime Banner */}
      {telemetry.airtimeSeconds > 0.4 && (
        <div className="bg-amber-500/90 text-black font-black px-3 py-1 rounded border border-yellow-200 shadow-lg text-sm tracking-widest flex items-center gap-1.5">
          <Zap className="w-4 h-4 fill-black" />
          <span>AIRTIME {telemetry.airtimeSeconds.toFixed(1)}s</span>
        </div>
      )}

      {/* Main Gauge Dial Box */}
      <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-slate-900/95 via-purple-950/90 to-black/95 p-2 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(0,240,255,0.35)] backdrop-blur-none flex flex-col items-center justify-center">
        {/* RPM Arc SVG */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#222"
            strokeWidth="6"
            strokeDasharray="180 360"
            strokeLinecap="round"
          />
          {/* Active RPM Fill */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={normRpm > 0.85 ? '#ff0055' : normRpm > 0.6 ? '#ffaa00' : '#00f0ff'}
            strokeWidth="6"
            strokeDasharray={`${normRpm * 180} 360`}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>

        {/* Speed & Gear readouts */}
        <div className="flex flex-col items-center z-10 -mt-2">
          {/* Gear pill */}
          <div className="px-2 py-0.5 rounded bg-pink-600/80 text-white font-black text-xs border border-pink-400 tracking-wider">
            GEAR {gearText}
          </div>

          {/* Speed Number */}
          <span className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_2px_10px_rgba(0,240,255,0.7)] mt-0.5">
            {displaySpeed}
          </span>

          {/* Unit Toggle Button */}
          <button
            onClick={() => setUseMph(!useMph)}
            className="text-[11px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 mt-0.5"
            title="Click to toggle KM/H / MPH"
          >
            {speedUnit}
          </button>
        </div>

        {/* Needle */}
        <div
          className="absolute w-1 h-20 bg-gradient-to-t from-pink-500 to-yellow-300 origin-bottom rounded-full shadow-[0_0_8px_rgba(255,0,127,0.8)] pointer-events-none transition-transform duration-75"
          style={{
            transform: `rotate(${rpmAngle}deg)`,
            top: '14px',
          }}
        />

        {/* NOS Meter Bar at the bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 flex flex-col items-center gap-0.5">
          <div className="flex justify-between w-full text-[9px] font-bold text-cyan-300">
            <span>NOS</span>
            <span>{telemetry.nitroPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 border border-cyan-400/50 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full transition-all duration-100"
              style={{ width: `${telemetry.nitroPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
