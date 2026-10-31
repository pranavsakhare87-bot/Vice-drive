import React, { useState, useEffect } from 'react';
import { CarTelemetry, CameraMode } from '../types';
import { GameEngine } from '../game/GameEngine';
import { Minimap } from './Minimap';
import { Speedometer } from './Speedometer';
import { RadioWidget } from './RadioWidget';
import { BottomControlDock } from './BottomControlDock';
import { TouchControls } from './TouchControls';
import {
  Pause,
  Camera,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { haptics } from '../utils/haptics';

interface HUDProps {
  engine: GameEngine | null;
  telemetry: CarTelemetry;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  onPause: () => void;
  onOpenGallery: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  telemetry,
  cameraMode,
  onCameraChange,
  onPause,
  onOpenGallery,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleFullscreen = () => {
    haptics.buttonPress();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleQuickReset = () => {
    haptics.buttonPress();
    if (engine) engine.resetCar();
  };

  const handleQuickCamera = () => {
    haptics.tap();
    if (engine) engine.cycleCamera();
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-2 sm:p-4 font-mono"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* Top Bar Perimeter Cluster */}
      <div className="flex justify-between items-start pointer-events-none gap-2">
        {/* Top-Left: City Badge & Download App CTA */}
        <div className="pointer-events-auto flex flex-col gap-1.5 items-start">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-pink-500/60 px-2.5 sm:px-3 py-1 rounded-xl shadow-[0_0_15px_rgba(255,0,127,0.25)]">
              <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-300 tracking-wider">
                VICE CITY
              </span>
              <span className="text-[9px] sm:text-[10px] text-cyan-300 font-bold border-l border-slate-700 pl-1.5 sm:pl-2">
                FREE ROAM
              </span>
            </div>
          </div>

          {/* Stunt notice or Top record */}
          {telemetry.topSpeed > 180 && (
            <div className="text-[9px] sm:text-[10px] font-bold text-yellow-300 bg-black/70 px-2 py-0.5 rounded border border-yellow-500/40">
              TOP RECORD: {telemetry.topSpeed} KM/H
            </div>
          )}

          {/* On Mobile: Position Minimap here in top-left below badge so it NEVER collides with steering thumb */}
          {isMobileScreen && (
            <div className="mt-1 scale-85 origin-top-left">
              <Minimap
                playerX={telemetry.carPosition.x}
                playerZ={telemetry.carPosition.z}
                playerYaw={telemetry.carRotationY}
              />
            </div>
          )}
        </div>

        {/* Top-Right: Quick Actions, Radio & Pause */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Quick Mobile Camera Switch */}
          <button
            onClick={handleQuickCamera}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-cyan-300 hover:text-white transition-colors cursor-pointer shadow-lg active:scale-95"
            title="Switch Camera (Key C)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Quick Mobile Reset Car */}
          <button
            onClick={handleQuickReset}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-red-400 text-red-300 hover:text-white transition-colors cursor-pointer shadow-lg active:scale-95"
            title="Reset Car on Road (Key R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle (Great for Android!) */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-yellow-400 text-yellow-300 hover:text-white transition-colors cursor-pointer shadow-lg active:scale-95 hidden xs:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Radio Station Widget */}
          <div className="hidden sm:block">
            <RadioWidget />
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-pink-500 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg active:scale-95"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 85% playfield completely unobstructed! */}
      <div className="flex-1 pointer-events-none" />

      {/* Desktop Bottom Clusters (Minimap on Left, Speedometer on Right) */}
      {!isMobileScreen && (
        <div className="flex justify-between items-end mb-16 sm:mb-14 pointer-events-none">
          <div className="pointer-events-auto">
            <Minimap
              playerX={telemetry.carPosition.x}
              playerZ={telemetry.carPosition.z}
              playerYaw={telemetry.carRotationY}
            />
          </div>

          <div className="pointer-events-auto">
            <Speedometer telemetry={telemetry} />
          </div>
        </div>
      )}

      {/* Mobile Speedometer: Positioned safely above pedals on right or top-center */}
      {isMobileScreen && (
        <div className="fixed top-14 right-3 pointer-events-auto scale-80 origin-top-right">
          <Speedometer telemetry={telemetry} />
        </div>
      )}

      {/* Bottom Center: Collapsible Control Dock */}
      <BottomControlDock
        engine={engine}
        onOpenGallery={onOpenGallery}
        headlightsOn={telemetry.headlightsOn}
        underglowOn={telemetry.underglowOn}
        cameraMode={cameraMode}
        onCameraChange={onCameraChange}
      />

      {/* On-Screen Mobile Pedals & Steer */}
      <TouchControls engine={engine} />
    </div>
  );
};
