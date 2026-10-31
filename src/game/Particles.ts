import * as THREE from 'three';

/**
 * High-performance pooled particle system for:
 * - Tire smoke (drift clouds & burnouts)
 * - Nitro exhaust flames (blue/cyan jet)
 * - Gearshift exhaust backfire pops (orange fireballs)
 * - Wall collision sparks
 */

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
  active: boolean;
}

export class ParticleSystem {
  private maxParticles = 600;
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private pointsMesh: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1.0,
        life: 0,
        maxLife: 1.0,
        opacity: 0,
        active: false,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Procedural soft circle particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.PointsMaterial({
      map: texture,
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.pointsMesh = new THREE.Points(this.geometry, material);
    scene.add(this.pointsMesh);
  }

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    colorHex: number,
    size: number,
    life: number
  ) {
    // Find inactive particle
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.position.set(x, y, z);
        p.velocity.set(vx, vy, vz);
        p.color.setHex(colorHex);
        p.size = size;
        p.life = life;
        p.maxLife = life;
        p.opacity = 0.8;
        p.active = true;
        break;
      }
    }
  }

  /**
   * Emit tire smoke during drift or burnout
   */
  public emitTireSmoke(pos: THREE.Vector3, intensity: number) {
    const count = Math.min(Math.floor(intensity * 4) + 1, 4);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = 0.4 + Math.random() * 0.8;
      const vz = (Math.random() - 0.5) * 1.5;
      const px = pos.x + (Math.random() - 0.5) * 0.3;
      const py = pos.y + 0.1;
      const pz = pos.z + (Math.random() - 0.5) * 0.3;
      // White/light grey smoke
      this.spawnParticle(px, py, pz, vx, vy, vz, 0xdddddd, 1.8 + Math.random() * 1.2, 0.8 + Math.random() * 0.5);
    }
  }

  /**
   * Emit nitro exhaust blue jet flame
   */
  public emitNitroFlame(posL: THREE.Vector3, posR: THREE.Vector3, carForward: THREE.Vector3) {
    const speed = -8.0;
    // Blue/cyan nitro jet flame
    const flameColors = [0x00f0ff, 0x0088ff, 0xffffff];
    for (const pos of [posL, posR]) {
      const col = flameColors[Math.floor(Math.random() * flameColors.length)];
      const vx = carForward.x * speed + (Math.random() - 0.5) * 0.4;
      const vy = carForward.y * speed + (Math.random() - 0.5) * 0.3;
      const vz = carForward.z * speed + (Math.random() - 0.5) * 0.4;
      this.spawnParticle(pos.x, pos.y, pos.z, vx, vy, vz, col, 0.8, 0.2);
    }
  }

  /**
   * Emit exhaust backfire pop (orange fireball on shift)
   */
  public emitBackfire(posL: THREE.Vector3, posR: THREE.Vector3, carForward: THREE.Vector3) {
    const speed = -5.0;
    const colors = [0xff4400, 0xffaa00, 0xffff66];
    for (const pos of [posL, posR]) {
      for (let i = 0; i < 6; i++) {
        const col = colors[Math.floor(Math.random() * colors.length)];
        const vx = carForward.x * speed + (Math.random() - 0.5) * 1.2;
        const vy = 0.2 + (Math.random() - 0.5) * 0.6;
        const vz = carForward.z * speed + (Math.random() - 0.5) * 1.2;
        this.spawnParticle(pos.x, pos.y, pos.z, vx, vy, vz, col, 1.2, 0.25);
      }
    }
  }

  /**
   * Emit collision sparks
   */
  public emitSparks(pos: THREE.Vector3, normal: THREE.Vector3) {
    for (let i = 0; i < 16; i++) {
      const vx = normal.x * (2 + Math.random() * 5) + (Math.random() - 0.5) * 4;
      const vy = 1 + Math.random() * 4;
      const vz = normal.z * (2 + Math.random() * 5) + (Math.random() - 0.5) * 4;
      this.spawnParticle(pos.x, pos.y, pos.z, vx, vy, vz, 0xffcc33, 0.4, 0.4);
    }
  }

  public update(dt: number) {
    let pIdx = 0;
    let cIdx = 0;
    let sIdx = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }

        // Move particle
        p.position.addScaledVector(p.velocity, dt);

        // Expand smoke / fade
        const progress = 1 - p.life / p.maxLife;
        const currentSize = p.size * (1 + progress * 2.5);

        this.positions[pIdx] = p.position.x;
        this.positions[pIdx + 1] = p.position.y;
        this.positions[pIdx + 2] = p.position.z;

        this.colors[cIdx] = p.color.r;
        this.colors[cIdx + 1] = p.color.g;
        this.colors[cIdx + 2] = p.color.b;

        this.sizes[sIdx] = currentSize;

        pIdx += 3;
        cIdx += 3;
        sIdx += 1;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.setDrawRange(0, sIdx);
  }

  public dispose() {
    this.geometry.dispose();
    (this.pointsMesh.material as THREE.Material).dispose();
  }
}
