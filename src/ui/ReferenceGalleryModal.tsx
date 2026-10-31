import React from 'react';
import { X, CheckCircle2, Sparkles, Car } from 'lucide-react';

interface ReferenceGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (style: 'modern' | 'classic') => void;
  currentStyle: 'modern' | 'classic';
}

export const ReferenceGalleryModal: React.FC<ReferenceGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectStyle,
  currentStyle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,0,127,0.4)] text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-500 text-pink-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-300 to-yellow-300">
              VEHICLE DESIGN & REFERENCE BLUEPRINT
            </h2>
            <p className="text-xs text-slate-400">
              Rendered with high fidelity from your uploaded reference images
            </p>
          </div>
        </div>

        {/* 2 Provided Image Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Image 1: Modern M5 Style */}
          <div
            onClick={() => onSelectStyle('modern')}
            className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
              currentStyle === 'modern'
                ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)] bg-slate-800/80'
                : 'border-slate-700 hover:border-pink-500/60 bg-slate-800/40'
            }`}
          >
            <div className="relative aspect-video bg-black overflow-hidden">
              <img
                src="/assets/aistudio/download__1__394dedf9.jpeg"
                alt="User Reference 1 - Modern M5 Mint"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {currentStyle === 'modern' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVE MODEL</span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-cyan-300">DESIGN 1: MODERN F90 SPORT SEDAN</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SHARP AERO
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Featuring mint green seafoam paint, aggressive front bumper intakes, LED DRL projector eyes, carbon chin splitter, lowered stance, and deep-dish bronze multi-spoke mesh rims with chrome outer lip.
              </p>
            </div>
          </div>

          {/* Image 2: Classic E39 Style */}
          <div
            onClick={() => onSelectStyle('classic')}
            className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
              currentStyle === 'classic'
                ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)] bg-slate-800/80'
                : 'border-slate-700 hover:border-pink-500/60 bg-slate-800/40'
            }`}
          >
            <div className="relative aspect-video bg-black overflow-hidden">
              <img
                src="/assets/aistudio/download__2__17b9e38b.jpeg"
                alt="User Reference 2 - Classic E39 Mint"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {currentStyle === 'classic' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVE MODEL</span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-pink-300">DESIGN 2: CLASSIC E39 LEGEND SEDAN</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-400 border border-pink-800">
                  ICONIC ANGEL EYES
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Featuring the legendary twin round angel eye projectors, iconic kidney grille surround, round lower fog pods, clean body moldings, and bronze deep dish multi-spoke wheels.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Specs */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-300">
            <Sparkles className="w-4 h-4" />
            <span>FAITHFULLY REPRODUCED VEHICLE CHARACTERISTICS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">BODY FINISH</span>
              <strong className="text-emerald-400">Mint Green / Turquoise</strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">WHEELS</span>
              <strong className="text-amber-400">Deep Bronze Mesh / Chrome Lip</strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">FRONT END</span>
              <strong className="text-cyan-400">BMW Split Kidney Grille</strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">EXHAUST</span>
              <strong className="text-pink-400">Quad Chrome Turbo Tips</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
