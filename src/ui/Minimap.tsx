import React, { useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';

interface MinimapProps {
  playerX: number;
  playerZ: number;
  playerYaw: number;
}

export const Minimap: React.FC<MinimapProps> = ({ playerX, playerZ, playerYaw }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 150;
    const center = size / 2;
    const zoom = 0.45; // World to minimap scale

    ctx.clearRect(0, 0, size, size);

    // Save context for circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 4, 0, Math.PI * 2);
    ctx.clip();

    // Dark radar background
    ctx.fillStyle = '#0f0a1c';
    ctx.fillRect(0, 0, size, size);

    // Transform map around player
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(playerYaw); // Map rotates with car, car points UP
    ctx.translate(-playerX * zoom, -playerZ * zoom);

    // Ocean water on east side
    ctx.fillStyle = '#005577';
    ctx.fillRect(200 * zoom, -400 * zoom, 300 * zoom, 800 * zoom);

    // Beach sand
    ctx.fillStyle = '#c2a649';
    ctx.fillRect(40 * zoom, -400 * zoom, 160 * zoom, 800 * zoom);

    // Main Ocean Drive Boulevard
    ctx.fillStyle = '#40424a';
    ctx.fillRect(-15 * zoom, -350 * zoom, 30 * zoom, 700 * zoom);
    // Yellow center line
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -350 * zoom);
    ctx.lineTo(0, 350 * zoom);
    ctx.stroke();

    // Downtown Cross Highway
    ctx.fillStyle = '#40424a';
    ctx.fillRect(-350 * zoom, -13 * zoom, 700 * zoom, 26 * zoom);

    // Secondary road
    ctx.fillStyle = '#32343a';
    ctx.fillRect(-132 * zoom, -250 * zoom, 24 * zoom, 500 * zoom);

    // Buildings footprint
    ctx.fillStyle = '#ff6b8b'; // Art Deco hotels
    ctx.fillRect(-55 * zoom, -195 * zoom, 26 * zoom, 24 * zoom);
    ctx.fillRect(-54 * zoom, -132 * zoom, 24 * zoom, 22 * zoom);
    ctx.fillRect(-56 * zoom, -72 * zoom, 28 * zoom, 25 * zoom);
    ctx.fillRect(-53 * zoom, -11 * zoom, 22 * zoom, 22 * zoom);
    ctx.fillRect(-55 * zoom, 48 * zoom, 26 * zoom, 24 * zoom);
    ctx.fillRect(-54 * zoom, 108 * zoom, 25 * zoom, 24 * zoom);

    // Skyscrapers
    ctx.fillStyle = '#1b2838';
    ctx.fillRect(-200 * zoom, -170 * zoom, 40 * zoom, 40 * zoom);
    ctx.fillRect(-260 * zoom, -140 * zoom, 40 * zoom, 40 * zoom);
    ctx.fillRect(-206 * zoom, -66 * zoom, 32 * zoom, 32 * zoom);

    // Stunt ramps (bright yellow icons)
    ctx.fillStyle = '#ffe600';
    const rampLocations = [
      { x: 0, z: -90 },
      { x: 0, z: 90 },
      { x: 70, z: -30 },
      { x: -120, z: 90 },
    ];
    for (const r of rampLocations) {
      ctx.beginPath();
      ctx.arc(r.x * zoom, r.z * zoom, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Radar scan lines & rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, 35, 0, Math.PI * 2);
    ctx.arc(center, center, 65, 0, Math.PI * 2);
    ctx.stroke();

    // Player car arrow (Centered, pointing UP in mint green)
    ctx.fillStyle = '#41cc9c';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(center, center - 8);
    ctx.lineTo(center + 6, center + 7);
    ctx.lineTo(center, center + 4);
    ctx.lineTo(center - 6, center + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Radar outer bezel border (Vice City pink & teal)
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [playerX, playerZ, playerYaw]);

  return (
    <div className="relative pointer-events-auto select-none">
      <canvas
        ref={canvasRef}
        width={150}
        height={150}
        className="rounded-full shadow-[0_0_20px_rgba(255,0,127,0.4)]"
      />
      <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-cyan-400 tracking-wider">
        <Compass className="w-3 h-3" />
        <span>RADAR</span>
      </div>
    </div>
  );
};
