import React, { useState, useRef, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { TouchControlMode } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Flame,
  Disc,
  Volume2,
  Sliders
} from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';
import { haptics } from '../utils/haptics';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine }) => {
  const [steerMode, setSteerMode] = useState<TouchControlMode>('buttons');
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [joystickThumbX, setJoystickThumbX] = useState(0);
  const joystickActiveRef = useRef(false);

  if (!engine) return null;

  type BooleanControlKey = 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitro' | 'horn';

  const setControl = (key: BooleanControlKey, value: boolean) => {
    soundEngine.init();
    soundEngine.resume();
    engine.controls[key] = value;
    if (value) {
      haptics.buttonPress();
      if (key === 'handbrake') haptics.driftSnap();
      if (key === 'nitro') haptics.nitroBoost();
    }
    if (key === 'horn') {
      soundEngine.setHorn(value);
    }
  };

  // Joystick touch handlers
  const handleJoystickTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActiveRef.current || !joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

    const maxDelta = 45;
    const deltaX = Math.min(Math.max(clientX - centerX, -maxDelta), maxDelta);
    setJoystickThumbX(deltaX);

    // Normalize to -1.0 to 1.0 (analog steering)
    const normalized = deltaX / maxDelta;
    engine.controls.analogSteer = -normalized; // Inverted in car physics coords: -right, +left
  };

  const handleJoystickTouchEnd = () => {
    joystickActiveRef.current = false;
    setJoystickThumbX(0);
    engine.controls.analogSteer = 0;
    engine.controls.left = false;
    engine.controls.right = false;
  };

  const handleJoystickTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    joystickActiveRef.current = true;
    soundEngine.init();
    soundEngine.resume();
    haptics.tap();
    handleJoystickTouchMove(e);
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-30 flex justify-between items-end p-3 sm:p-6 pb-6 touch-none"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* LEFT THUMB ZONE: STEERING CONTROLS */}
      <div className="flex flex-col gap-2 items-start pointer-events-auto">
        {/* Steering Mode Toggle Pill */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full p-0.5 shadow-md">
          <button
            onClick={() => {
              setSteerMode(steerMode === 'buttons' ? 'joystick' : 'buttons');
              haptics.tap();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>{steerMode === 'buttons' ? 'STEER: BUTTONS' : 'STEER: JOYSTICK'}</span>
          </button>
        </div>

        {steerMode === 'buttons' ? (
          /* Curved Ergonomic Steering Thumb Buttons */
          <div className="flex items-center gap-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); setControl('left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setControl('left', false); }}
              onMouseDown={() => setControl('left', true)}
              onMouseUp={() => setControl('left', false)}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-400/80 active:border-cyan-300 active:bg-cyan-500 active:text-black text-cyan-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-8 h-8 pointer-events-none" />
              <span className="text-[10px] font-black tracking-widest mt-0.5">LEFT</span>
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); setControl('right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setControl('right', false); }}
              onMouseDown={() => setControl('right', true)}
              onMouseUp={() => setControl('right', false)}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-400/80 active:border-cyan-300 active:bg-cyan-500 active:text-black text-cyan-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-95 transition-transform"
            >
              <ArrowRight className="w-8 h-8 pointer-events-none" />
              <span className="text-[10px] font-black tracking-widest mt-0.5">RIGHT</span>
            </button>
          </div>
        ) : (
          /* Analog Virtual Steering Joystick */
          <div
            ref={joystickRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            onMouseDown={handleJoystickTouchStart}
            onMouseMove={handleJoystickTouchMove}
            onMouseUp={handleJoystickTouchEnd}
            className="relative w-36 h-20 rounded-full bg-slate-900/95 border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.3)] touch-none cursor-ew-resize"
          >
            <div className="absolute inset-x-4 h-1 bg-cyan-950 rounded-full" />
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-b from-cyan-400 to-teal-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 font-black text-xs transition-transform"
              style={{ transform: `translateX(${joystickThumbX}px)` }}
            >
              STEER
            </div>
          </div>
        )}
      </div>

      {/* RIGHT THUMB ZONE: ERGONOMIC RACING PEDALS & ACTION BUTTONS */}
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        {/* Action Quick Buttons (Handbrake Drift, Nitro, Horn) */}
        <div className="flex items-center gap-2">
          {/* 80s Horn */}
          <button
            onTouchStart={(e) => { e.preventDefault(); setControl('horn', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl('horn', false); }}
            onMouseDown={() => setControl('horn', true)}
            onMouseUp={() => setControl('horn', false)}
            className="w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700 active:bg-yellow-500 active:text-black text-yellow-300 flex items-center justify-center shadow-md active:scale-95"
            title="Horn"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Nitro NOS */}
          <button
            onTouchStart={(e) => { e.preventDefault(); setControl('nitro', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl('nitro', false); }}
            onMouseDown={() => setControl('nitro', true)}
            onMouseUp={() => setControl('nitro', false)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-900/95 to-cyan-950/95 border-2 border-blue-400/90 active:bg-cyan-400 active:text-black text-cyan-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.35)] active:scale-95 transition-transform"
          >
            <Flame className="w-6 h-6 text-yellow-300 pointer-events-none" />
            <span className="text-[10px] font-black tracking-wider">NOS</span>
          </button>

          {/* Handbrake Drift */}
          <button
            onTouchStart={(e) => { e.preventDefault(); setControl('handbrake', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl('handbrake', false); }}
            onMouseDown={() => setControl('handbrake', true)}
            onMouseUp={() => setControl('handbrake', false)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-900/95 to-purple-950/95 border-2 border-pink-400/90 active:bg-pink-500 active:text-white text-pink-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,0,127,0.35)] active:scale-95 transition-transform"
          >
            <Disc className="w-6 h-6 text-pink-300 pointer-events-none" />
            <span className="text-[10px] font-black tracking-wider">DRIFT</span>
          </button>
        </div>

        {/* Racing Pedals (Brake & Gas) */}
        <div className="flex items-center gap-3">
          {/* Brake / Reverse Pedal */}
          <button
            onTouchStart={(e) => { e.preventDefault(); setControl('backward', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl('backward', false); }}
            onMouseDown={() => setControl('backward', true)}
            onMouseUp={() => setControl('backward', false)}
            className="w-16 h-24 sm:w-18 sm:h-28 rounded-2xl bg-gradient-to-b from-red-950/95 via-red-900/95 to-slate-950/95 border-2 border-red-500/90 active:bg-red-500 active:text-white text-red-200 flex flex-col items-center justify-between py-2 shadow-[0_0_25px_rgba(239,68,68,0.35)] active:scale-95 transition-transform"
          >
            <ArrowDown className="w-6 h-6" />
            <div className="w-8 h-1 bg-red-400/60 rounded-full" />
            <div className="w-8 h-1 bg-red-400/60 rounded-full" />
            <span className="text-[10px] font-black tracking-widest text-red-300">BRAKE</span>
          </button>

          {/* Gas Accelerator Pedal */}
          <button
            onTouchStart={(e) => { e.preventDefault(); setControl('forward', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl('forward', false); }}
            onMouseDown={() => setControl('forward', true)}
            onMouseUp={() => setControl('forward', false)}
            className="w-18 h-28 sm:w-20 sm:h-32 rounded-2xl bg-gradient-to-b from-emerald-950/95 via-emerald-800/95 to-slate-950/95 border-2 border-emerald-400/90 active:bg-emerald-400 active:text-black text-emerald-200 flex flex-col items-center justify-between py-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 transition-transform"
          >
            <ArrowUp className="w-7 h-7" />
            <div className="w-10 h-1 bg-emerald-400/60 rounded-full" />
            <div className="w-10 h-1 bg-emerald-400/60 rounded-full" />
            <div className="w-10 h-1 bg-emerald-400/60 rounded-full" />
            <span className="text-[11px] font-black tracking-widest text-emerald-300">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
