import React, { useState } from 'react';
import { CameraMode, CarStyle, HandlingMode } from '../types';
import { GameEngine } from '../game/GameEngine';
import {
  Camera,
  RotateCcw,
  Lightbulb,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Gauge,
  Palette
} from 'lucide-react';

interface BottomControlDockProps {
  engine: GameEngine | null;
  onOpenGallery: () => void;
  headlightsOn: boolean;
  underglowOn: boolean;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  engine,
  onOpenGallery,
  headlightsOn,
  underglowOn,
  cameraMode,
  onCameraChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'handling' | 'custom' | 'controls'>('camera');
  const [handlingMode, setHandlingMode] = useState<HandlingMode>('vice_arcade');
  const [carStyle, setCarStyle] = useState<CarStyle>('modern');
  const [underglowColor, setUnderglowColor] = useState<number>(0x00f0ff);

  const handleCameraSelect = (mode: CameraMode) => {
    onCameraChange(mode);
    if (engine) engine.setCameraMode(mode);
  };

  const handleHandlingSelect = (mode: HandlingMode) => {
    setHandlingMode(mode);
    if (engine) engine.setHandlingMode(mode);
  };

  const handleStyleSelect = (style: CarStyle) => {
    setCarStyle(style);
    if (engine) engine.setCarStyle(style);
  };

  const handleToggleHeadlights = () => {
    if (engine) engine.carModel.toggleHeadlights();
  };

  const handleToggleUnderglow = () => {
    if (engine) engine.carModel.toggleUnderglow();
  };

  const handleUnderglowColor = (hex: number) => {
    setUnderglowColor(hex);
    if (engine) engine.carModel.setUnderglowColor(hex);
  };

  const handleResetCar = () => {
    if (engine) engine.resetCar();
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[94vw] max-w-[920px] transition-transform duration-300 z-30 pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-2.25rem)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand tab button attached to top edge */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-pink-500/60 text-xs font-mono font-bold text-pink-300 hover:text-white transition-colors cursor-pointer shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>▴ SHOW CONTROLS DOCK</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-pink-400" />
              <span>▾ HIDE DOCK (CINEMA MODE)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-slate-900/95 border border-pink-500/50 rounded-2xl p-3 shadow-[0_0_30px_rgba(255,0,127,0.25)] flex flex-col gap-2.5 text-white font-mono">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CAMERA</span>
            </button>

            <button
              onClick={() => setActiveTab('handling')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'handling'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>PHYSICS</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>M5 VEHICLE</span>
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'controls'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>KEYS</span>
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            {/* View Original Car Picture Modal Button */}
            <button
              onClick={onOpenGallery}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/80 text-cyan-300 hover:bg-cyan-900 text-xs font-bold transition-colors cursor-pointer"
              title="Compare with your uploaded reference car photos"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>USER CAR PHOTO</span>
            </button>

            {/* Reset Car Position Button */}
            <button
              onClick={handleResetCar}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/80 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors cursor-pointer"
              title="Reset car on road (Key R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET (R)</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="pt-0.5">
          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold mr-1">VIEW:</span>
              {(['chase', 'hood', 'bumper', 'cinematic'] as CameraMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleCameraSelect(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    cameraMode === mode
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
              <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
                Press [C] to cycle cameras
              </span>
            </div>
          )}

          {activeTab === 'handling' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold mr-1">HANDLING:</span>
              {[
                { id: 'vice_arcade', label: 'VICE ARCADE (BALANCED)' },
                { id: 'realistic_drift', label: 'REALISTIC DRIFT' },
                { id: 'stunt_master', label: 'STUNT MASTER' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHandlingSelect(item.id as HandlingMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    handlingMode === item.id
                      ? 'bg-pink-500 text-white border-pink-300 shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-pink-500/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Car Styling Model */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">STYLE:</span>
                <button
                  onClick={() => handleStyleSelect('modern')}
                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer border ${
                    carStyle === 'modern'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  MODERN F90 (PHOTO 1)
                </button>
                <button
                  onClick={() => handleStyleSelect('classic')}
                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer border ${
                    carStyle === 'classic'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  CLASSIC E39 (PHOTO 2)
                </button>
              </div>

              {/* Headlights Toggle */}
              <button
                onClick={handleToggleHeadlights}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold cursor-pointer border ${
                  headlightsOn
                    ? 'bg-yellow-500/30 text-yellow-300 border-yellow-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Headlights (Key L)"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>LIGHTS (L)</span>
              </button>

              {/* Underglow Toggle & Colors */}
              <button
                onClick={handleToggleUnderglow}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold cursor-pointer border ${
                  underglowOn
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Neon Underglow (Key U)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>UNDERGLOW (U)</span>
              </button>

              {/* Underglow Colors */}
              <div className="flex items-center gap-1 ml-auto">
                {[
                  { name: 'Cyan', hex: 0x00f0ff, bg: '#00f0ff' },
                  { name: 'Pink', hex: 0xff007f, bg: '#ff007f' },
                  { name: 'Purple', hex: 0x9d4edd, bg: '#9d4edd' },
                  { name: 'Acid Green', hex: 0x00ff88, bg: '#00ff88' },
                  { name: 'Gold', hex: 0xffaa00, bg: '#ffaa00' },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleUnderglowColor(c.hex)}
                    className="w-4 h-4 rounded-full border border-white/60 hover:scale-125 transition-transform cursor-pointer"
                    style={{ backgroundColor: c.bg }}
                    title={`Set underglow to ${c.name}`}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div><strong className="text-cyan-300">W / ↑</strong> Drive / Accelerate</div>
              <div><strong className="text-cyan-300">S / ↓</strong> Brake / Reverse</div>
              <div><strong className="text-cyan-300">A / D / ← →</strong> Steer Left / Right</div>
              <div><strong className="text-pink-400">SPACE</strong> Handbrake Drift</div>
              <div><strong className="text-yellow-300">SHIFT</strong> Nitro Boost (NOS)</div>
              <div><strong className="text-cyan-300">C</strong> Switch Camera View</div>
              <div><strong className="text-cyan-300">L / U</strong> Headlights / Underglow</div>
              <div><strong className="text-pink-400">H</strong> 80s Dual Horn</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
