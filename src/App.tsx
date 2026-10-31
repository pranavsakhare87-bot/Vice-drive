import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { CameraMode, CarStyle, CarTelemetry, GameState } from './types';
import { TitleScreen } from './ui/TitleScreen';
import { HUD } from './ui/HUD';
import { PauseModal } from './ui/PauseModal';
import { ReferenceGalleryModal } from './ui/ReferenceGalleryModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [carStyle, setCarStyle] = useState<CarStyle>('modern');

  // Live telemetry state for React HUD
  const [telemetry, setTelemetry] = useState<CarTelemetry>({
    speedKmh: 0,
    speedMph: 0,
    rpm: 850,
    gear: 1,
    isReversing: false,
    driftAngle: 0,
    isDrifting: false,
    driftScore: 0,
    driftCombo: 1,
    nitroPercent: 100,
    airtimeSeconds: 0,
    highestJump: 0,
    topSpeed: 0,
    stuntLabel: '',
    headlightsOn: true,
    underglowOn: true,
    carPosition: { x: 0, y: 0.4, z: 0 },
    carRotationY: 0,
  });

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container);
    engineRef.current = engine;

    // Telemetry throttle loop (update React state at ~25fps to minimize UI re-renders)
    let lastTelemetryTime = 0;
    engine.onTelemetryUpdate = () => {
      const now = performance.now();
      if (now - lastTelemetryTime > 40) {
        lastTelemetryTime = now;
        setTelemetry(engine.physics.getTelemetry(true, true));
      }
    };

    // Global Key Listener for Title Screen Start & Pause Toggle
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setGameState((prev) => {
          if (prev === 'playing') {
            engine.pauseGame();
            return 'paused';
          } else if (prev === 'paused') {
            engine.resumeGame();
            return 'playing';
          }
          return prev;
        });
      } else if (engine.gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        engine.startGame();
        setGameState('playing');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
      setGameState('playing');
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
      setGameState('paused');
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
      setGameState('playing');
    }
  }, []);

  const handleResetCar = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetCar();
      if (gameState === 'paused') {
        engineRef.current.resumeGame();
        setGameState('playing');
      }
    }
  }, [gameState]);

  const handleReturnToTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.returnToTitle();
      setGameState('title');
    }
  }, []);

  const handleSelectCarStyle = useCallback((style: CarStyle) => {
    setCarStyle(style);
    if (engineRef.current) {
      engineRef.current.setCarStyle(style);
    }
  }, []);

  const handleCameraChange = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(mode);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas isolated mount container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      )}

      {/* Gameplay HUD */}
      {gameState === 'playing' && (
        <HUD
          engine={engineRef.current}
          telemetry={telemetry}
          cameraMode={cameraMode}
          onCameraChange={handleCameraChange}
          onPause={handlePauseGame}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      )}

      {/* Pause Modal */}
      <PauseModal
        isOpen={gameState === 'paused'}
        onResume={handleResumeGame}
        onResetCar={handleResetCar}
        onReturnTitle={handleReturnToTitle}
      />

      {/* Reference Gallery / Car Blueprint Modal */}
      <ReferenceGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectStyle={handleSelectCarStyle}
        currentStyle={carStyle}
      />
    </div>
  );
}
