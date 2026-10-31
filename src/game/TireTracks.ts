import * as THREE from 'three';

/**
 * Procedural Dynamic Tire Skid Marks System.
 * Generates continuous rubber skid mark strips on the asphalt when drifting or braking.
 */

interface SkidPoint {
  leftPos: THREE.Vector3;
  rightPos: THREE.Vector3;
  opacity: number;
}

export class TireTracks {
  private maxPoints = 350;
  private points: SkidPoint[] = [];
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private uvs: Float32Array;
  private colors: Float32Array;
  private activeCount = 0;

  constructor(scene: THREE.Scene) {
    const totalVertices = this.maxPoints * 4;
    this.positions = new Float32Array(totalVertices * 3);
    this.uvs = new Float32Array(totalVertices * 2);
    this.colors = new Float32Array(totalVertices * 4);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));

    // Semi-transparent rubber tire mark material
    const material = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.renderOrder = 1;
    scene.add(this.mesh);
  }

  public addMark(
    rearLeftPos: THREE.Vector3,
    rearRightPos: THREE.Vector3,
    groundY: number,
    slipIntensity: number
  ) {
    if (slipIntensity < 0.15) return;

    const opacity = Math.min(slipIntensity * 0.7, 0.75);
    const left = rearLeftPos.clone();
    left.y = groundY + 0.02; // Offset above asphalt to prevent z-fighting

    const right = rearRightPos.clone();
    right.y = groundY + 0.02;

    this.points.push({ leftPos: left, rightPos: right, opacity });

    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }

    this.updateGeometry();
  }

  private updateGeometry() {
    let pIdx = 0;
    let cIdx = 0;

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      // Distance check to avoid connecting disconnected drifts (e.g. after respawn)
      if (p1.leftPos.distanceTo(p2.leftPos) > 4.0) continue;

      // Tire mark quad (Left tire)
      const halfWidth = 0.12;
      this.writeQuad(p1.leftPos, p2.leftPos, halfWidth, p1.opacity, pIdx, cIdx);
      pIdx += 18;
      cIdx += 24;

      // Tire mark quad (Right tire)
      this.writeQuad(p1.rightPos, p2.rightPos, halfWidth, p1.opacity, pIdx, cIdx);
      pIdx += 18;
      cIdx += 24;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, pIdx / 3);
  }

  private writeQuad(
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    opacity: number,
    pIdx: number,
    cIdx: number
  ) {
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width);

    const v1 = new THREE.Vector3().subVectors(start, perp);
    const v2 = new THREE.Vector3().addVectors(start, perp);
    const v3 = new THREE.Vector3().subVectors(end, perp);
    const v4 = new THREE.Vector3().addVectors(end, perp);

    // Triangle 1 (v1, v2, v3)
    const verts = [v1, v2, v3, v2, v4, v3];
    for (let i = 0; i < 6; i++) {
      const v = verts[i];
      this.positions[pIdx++] = v.x;
      this.positions[pIdx++] = v.y;
      this.positions[pIdx++] = v.z;

      this.colors[cIdx++] = 0.08;
      this.colors[cIdx++] = 0.08;
      this.colors[cIdx++] = 0.08;
      this.colors[cIdx++] = opacity;
    }
  }

  public clear() {
    this.points = [];
    this.geometry.setDrawRange(0, 0);
  }

  public dispose() {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
