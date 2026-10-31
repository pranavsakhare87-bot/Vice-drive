import * as THREE from 'three';
import { GroundQuery } from './CarPhysics';

/**
 * 3D Open World Environment inspired by GTA Vice City.
 * Features:
 * - Ocean Drive Boulevard with palm trees & pastel Art Deco neon hotels
 * - Downtown Skyscraper metropolis
 * - Red rock canyon cliffs echoing the user's reference image backdrop
 * - Stunt Ramps (Canal jump, spiral ramp, rooftop launch)
 * - Breakable street cones & props
 * - Animated ocean water & sunset synthwave atmosphere
 */

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface StuntRamp {
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  angle: number; // heading
  slope: number;
}

export interface DynamicProp {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  radius: number;
  knocked: boolean;
}

export class CityWorld {
  public root: THREE.Group;
  private colliders: ColliderBox[] = [];
  private ramps: StuntRamp[] = [];
  private dynamicProps: DynamicProp[] = [];
  private animatedMaterials: THREE.Material[] = [];
  private oceanMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.root = new THREE.Group();
    this.root.name = 'CityWorld';
    scene.add(this.root);

    this.buildTerrainAndRoads();
    this.buildOcean();
    this.buildArtDecoHotels();
    this.buildDowntownSkyscrapers();
    this.buildCanyonCliffs();
    this.buildPalmTrees();
    this.buildStreetLights();
    this.buildStuntRamps();
    this.buildInteractiveProps();
  }

  private buildTerrainAndRoads() {
    // 1. Base terrain ground (asphalt / city foundation)
    const groundGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.root.add(ground);

    // 2. Procedural Asphalt Road Texture with Yellow Double Lines & White Dashes
    const roadTexture = this.createRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.7,
      metalness: 0.1,
    });

    // Ocean Drive Main Boulevard (Length 600m, Width 30m)
    const oceanDriveGeo = new THREE.PlaneGeometry(30, 600);
    const oceanDrive = new THREE.Mesh(oceanDriveGeo, roadMat);
    oceanDrive.rotation.x = -Math.PI / 2;
    oceanDrive.position.set(0, 0.015, 0);
    oceanDrive.receiveShadow = true;
    this.root.add(oceanDrive);

    // Downtown Cross Highway (X Axis, Length 600m, Width 26m)
    const crossRoadGeo = new THREE.PlaneGeometry(600, 26);
    const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.016, 0);
    crossRoad.receiveShadow = true;
    this.root.add(crossRoad);

    // Secondary boulevard
    const secondBoulevardGeo = new THREE.PlaneGeometry(24, 500);
    const secondBoulevard = new THREE.Mesh(secondBoulevardGeo, roadMat);
    secondBoulevard.rotation.x = -Math.PI / 2;
    secondBoulevard.position.set(-120, 0.015, -50);
    this.root.add(secondBoulevard);

    // Beach sand area on east side (x: 40 to 200, z: -300 to 300)
    const sandGeo = new THREE.PlaneGeometry(160, 600);
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.95,
      metalness: 0.05,
    });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(100, 0.01, 0);
    sand.receiveShadow = true;
    this.root.add(sand);
  }

  private createRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark asphalt base
    ctx.fillStyle = '#222428';
    ctx.fillRect(0, 0, 512, 512);

    // Noise/grain
    ctx.fillStyle = '#2b2d32';
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Yellow Double Center Lines
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(250, 0, 4, 512);
    ctx.fillRect(258, 0, 4, 512);

    // White dashed lane markers
    ctx.fillStyle = '#e8e8e8';
    for (let y = 0; y < 512; y += 48) {
      ctx.fillRect(130, y, 4, 26);
      ctx.fillRect(378, y, 4, 26);
    }

    // White outer boundary lines
    ctx.fillRect(24, 0, 6, 512);
    ctx.fillRect(482, 0, 6, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 16);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildOcean() {
    // Ocean on the far east side (x: 180 to 500)
    const oceanGeo = new THREE.PlaneGeometry(350, 800, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x005577,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.set(280, -0.2, 0);
    this.root.add(this.oceanMesh);
  }

  private buildArtDecoHotels() {
    // Row of colorful Vice City Art Deco hotels along Ocean Drive (west side, x: -30 to -70)
    const hotelData = [
      { name: 'THE MALIBU CLUB', color: 0xff6b8b, z: -180, w: 26, d: 24, h: 28, neonCol: 0xff007f },
      { name: 'OCEAN VIEW HOTEL', color: 0x48cfad, z: -120, w: 24, d: 22, h: 32, neonCol: 0x00f0ff },
      { name: 'PINK FLAMINGO', color: 0xff8ca3, z: -60, w: 28, d: 25, h: 24, neonCol: 0xff1493 },
      { name: 'VICE SHORES MOTEL', color: 0xfed166, z: 0, w: 22, d: 22, h: 18, neonCol: 0xffa500 },
      { name: 'STARLITE PALMS', color: 0x5d9cec, z: 60, w: 26, d: 24, h: 36, neonCol: 0x00ffff },
      { name: 'THE COLONY', color: 0xac92ec, z: 120, w: 25, d: 24, h: 26, neonCol: 0x9370db },
      { name: 'NEON SUNSET', color: 0xfc6e51, z: 180, w: 28, d: 26, h: 30, neonCol: 0xff4500 },
    ];

    for (const h of hotelData) {
      const posX = -42;
      const posY = h.h / 2;
      const posZ = h.z;

      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(posX, 0, posZ);

      // Main pastel Art Deco body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: h.color,
        roughness: 0.6,
        metalness: 0.1,
      });
      const bodyGeo = new THREE.BoxGeometry(h.w, h.h, h.d);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = posY;
      body.castShadow = true;
      body.receiveShadow = true;
      buildingGroup.add(body);

      // Art deco tiered crown on top
      const crownGeo = new THREE.BoxGeometry(h.w * 0.7, 4, h.d * 0.7);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = h.h + 2;
      buildingGroup.add(crown);

      // Glowing Neon Sign billboard on facade facing Ocean Drive (East)
      const signGroup = this.createNeonSign(h.name, h.neonCol);
      signGroup.position.set(h.w / 2 + 0.1, h.h * 0.65, 0);
      signGroup.rotation.y = Math.PI / 2;
      buildingGroup.add(signGroup);

      // Striped awning over ground entrance
      const awningGeo = new THREE.BoxGeometry(6, 0.4, 4);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(h.w / 2 + 2, 3.8, 0);
      buildingGroup.add(awning);

      this.root.add(buildingGroup);

      // Register collision box
      this.colliders.push({
        minX: posX - h.w / 2,
        maxX: posX + h.w / 2,
        minZ: posZ - h.d / 2,
        maxZ: posZ + h.d / 2,
        height: h.h,
      });
    }
  }

  private createNeonSign(text: string, neonColorHex: number): THREE.Group {
    const group = new THREE.Group();

    // Sign background plaque
    const plaqueGeo = new THREE.BoxGeometry(14, 3.5, 0.2);
    const plaqueMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.5 });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    group.add(plaque);

    // Procedural glowing canvas texture with stylized neon text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 512, 128);

    const hexStr = '#' + neonColorHex.toString(16).padStart(6, '0');
    ctx.font = 'bold 36px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Neon glow effect
    ctx.shadowColor = hexStr;
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 64);
    ctx.fillText(text, 256, 64);

    // Neon border
    ctx.strokeStyle = hexStr;
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 488, 104);

    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.colorSpace = THREE.SRGBColorSpace;

    const signFaceGeo = new THREE.PlaneGeometry(13.6, 3.2);
    const signFaceMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
    });
    const signFace = new THREE.Mesh(signFaceGeo, signFaceMat);
    signFace.position.z = 0.12;
    group.add(signFace);

    return group;
  }

  private buildDowntownSkyscrapers() {
    // Downtown high-rises on west side (x: -160 to -280)
    const towerConfigs = [
      { x: -180, z: -150, w: 35, d: 35, h: 90, color: 0x1b2838, neon: 0x00f0ff },
      { x: -240, z: -120, w: 40, d: 40, h: 120, color: 0x16222f, neon: 0xff007f },
      { x: -190, z: -50, w: 32, d: 32, h: 75, color: 0x22313f, neon: 0x00ffff },
      { x: -250, z: 20, w: 38, d: 38, h: 110, color: 0x1a252f, neon: 0xffd700 },
      { x: -180, z: 90, w: 36, d: 36, h: 85, color: 0x2c3e50, neon: 0x00f0ff },
      { x: -240, z: 160, w: 42, d: 42, h: 130, color: 0x1b2838, neon: 0xff0055 },
    ];

    const winMat = new THREE.MeshStandardMaterial({
      color: 0x2a3b4c,
      roughness: 0.2,
      metalness: 0.8,
    });

    for (const t of towerConfigs) {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(t.x, 0, t.z);

      // Glass tower main shaft
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const mesh = new THREE.Mesh(geo, winMat);
      mesh.position.y = t.h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      towerGroup.add(mesh);

      // Glowing Neon Rooftop Spire & Edge Outline
      const edgeGeo = new THREE.BoxGeometry(t.w + 0.5, 2, t.d + 0.5);
      const edgeMat = new THREE.MeshBasicMaterial({ color: t.neon });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.y = t.h;
      towerGroup.add(edge);

      // Spire antenna
      const spireGeo = new THREE.ConeGeometry(1.2, 18, 8);
      const spire = new THREE.Mesh(spireGeo, edgeMat);
      spire.position.y = t.h + 9;
      towerGroup.add(spire);

      this.root.add(towerGroup);

      // Collider
      this.colliders.push({
        minX: t.x - t.w / 2,
        maxX: t.x + t.w / 2,
        minZ: t.z - t.d / 2,
        maxZ: t.z + t.d / 2,
        height: t.h,
      });
    }
  }

  private buildCanyonCliffs() {
    // Dramatic red/magenta cliff wall backdrop as prominently featured in the user's images!
    // Stretches along the north perimeter (z: -320 to -380)
    const cliffGroup = new THREE.Group();
    cliffGroup.position.set(0, 0, -320);

    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0xbf364f, // Reddish pink cliff rock from user's image
      roughness: 0.9,
      metalness: 0.1,
    });

    const segments = 12;
    for (let i = -segments; i <= segments; i++) {
      const rockGeo = new THREE.BoxGeometry(32 + Math.random() * 8, 55 + Math.random() * 25, 28);
      const rock = new THREE.Mesh(rockGeo, cliffMat);
      rock.position.set(i * 26, 25, (Math.random() - 0.5) * 15);
      rock.rotation.y = (Math.random() - 0.5) * 0.4;
      rock.rotation.z = (Math.random() - 0.5) * 0.1;
      rock.castShadow = true;
      cliffGroup.add(rock);

      this.colliders.push({
        minX: rock.position.x - 16,
        maxX: rock.position.x + 16,
        minZ: -320 - 14,
        maxZ: -320 + 14,
        height: 60,
      });
    }

    // Huge Stylized Billboard displaying the user's car artwork in 80s synthwave glory
    const billboardGroup = new THREE.Group();
    billboardGroup.position.set(0, 18, -280);

    const boardMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.5 });
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(42, 22, 1), boardMat);
    billboardGroup.add(boardFrame);

    // Stanchion poles
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 12), poleMat);
    pole1.position.set(-12, -10, 0);
    billboardGroup.add(pole1);
    const pole2 = pole1.clone();
    pole2.position.x = 12;
    billboardGroup.add(pole2);

    // Procedural synthwave artwork canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Sunset gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#ff1361');
    grad.addColorStop(0.5, '#fff800');
    grad.addColorStop(0.51, '#1b003a');
    grad.addColorStop(1, '#0b001a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // 80s grid perspective
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(512, 260);
      ctx.lineTo((x - 512) * 3 + 512, 512);
      ctx.stroke();
    }
    for (let y = 260; y <= 512; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Text
    ctx.font = 'italic bold 64px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48cfad'; // Car mint color
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 24;
    ctx.fillText('VICE CITY CRUISER', 512, 140);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('M-POWER SPORT TURBO · FREE ROAM', 512, 210);

    const bbTexture = new THREE.CanvasTexture(canvas);
    bbTexture.colorSpace = THREE.SRGBColorSpace;
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: bbTexture }));
    poster.position.z = 0.55;
    billboardGroup.add(poster);

    this.root.add(billboardGroup);
    this.root.add(cliffGroup);
  }

  private buildPalmTrees() {
    // Instanced or grouped palm trees along Ocean Drive
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.6 });

    const palmTrunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 9, 8);
    const leafGeo = new THREE.ConeGeometry(2.4, 1.2, 5);

    // Row on West sidewalk (x: -17) and East sidewalk (x: 17)
    for (let z = -260; z <= 260; z += 30) {
      for (const x of [-17, 17]) {
        const palm = new THREE.Group();
        palm.position.set(x, 0, z);

        const trunk = new THREE.Mesh(palmTrunkGeo, trunkMat);
        trunk.position.y = 4.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.12;
        palm.add(trunk);

        // Palm frond crown
        for (let a = 0; a < 6; a++) {
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(0, 9, 0);
          leaf.rotation.y = (a * Math.PI) / 3;
          leaf.rotation.x = 0.6;
          palm.add(leaf);
        }

        this.root.add(palm);

        // Thin collider for trunk
        this.colliders.push({
          minX: x - 0.5,
          maxX: x + 0.5,
          minZ: z - 0.5,
          maxZ: z + 0.5,
          height: 9,
        });
      }
    }
  }

  private buildStreetLights() {
    // Street lights along the boulevard
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });

    for (let z = -240; z <= 240; z += 40) {
      for (const x of [-16, 16]) {
        const lightGroup = new THREE.Group();
        lightGroup.position.set(x, 0, z);

        // Vertical pole
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), poleMat);
        pole.position.y = 4;
        lightGroup.add(pole);

        // Overhanging arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), poleMat);
        arm.position.set(x > 0 ? -1 : 1, 8, 0);
        lightGroup.add(arm);

        // Lamp head
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.3, 8), lightGlowMat);
        lamp.position.set(x > 0 ? -2 : 2, 7.8, 0);
        lightGroup.add(lamp);

        this.root.add(lightGroup);
      }
    }
  }

  private buildStuntRamps() {
    // 1. Massive Stunt Ramp jumping over the intersection (x: 0, z: -100)
    this.createRamp(0, -90, 16, 22, 6.5, 0); // Jump going south
    this.createRamp(0, 90, 16, 22, 6.5, Math.PI); // Jump going north

    // 2. High Stunt Ramp over water canal on the East (x: 80, z: 0)
    this.createRamp(70, -30, 14, 20, 8.0, 0);

    // 3. Downtown Super Spiral Launch (x: -120, z: 120)
    this.createRamp(-120, 90, 12, 18, 5.0, 0);
  }

  private createRamp(x: number, z: number, width: number, length: number, height: number, angle: number) {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(x, 0, z);
    rampGroup.rotation.y = angle;

    // Wedge slope geometry
    const shape = new THREE.Shape();
    shape.moveTo(-length / 2, 0);
    shape.lineTo(length / 2, 0);
    shape.lineTo(length / 2, height);
    shape.closePath();

    const extrudeSettings = {
      depth: width,
      bevelEnabled: false,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    // Fluorescent yellow & black hazard stripes on ramp surface
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#111111';
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 32, 128);
      ctx.lineTo(i + 48, 128);
      ctx.lineTo(i + 16, 0);
      ctx.fill();
    }
    const rampTex = new THREE.CanvasTexture(canvas);
    rampTex.wrapS = THREE.RepeatWrapping;
    rampTex.wrapT = THREE.RepeatWrapping;
    rampTex.repeat.set(2, 6);
    rampTex.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshStandardMaterial({
      map: rampTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.rotation.y = Math.PI / 2;
    rampGroup.add(mesh);

    this.root.add(rampGroup);

    // Register ramp physics
    this.ramps.push({
      x,
      z,
      width,
      length,
      height,
      angle,
      slope: height / length,
    });
  }

  private buildInteractiveProps() {
    // Dynamic breakable cones and highway barrels scattered near ramps and corners
    const coneGeo = new THREE.ConeGeometry(0.3, 0.75, 12);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.5 });

    const barrelGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.0, 14);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });

    // Spawn 20 cones near ramps
    for (let i = 0; i < 20; i++) {
      const px = (Math.random() - 0.5) * 12;
      const pz = -75 + (Math.random() - 0.5) * 20;
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(px, 0.38, pz);
      cone.castShadow = true;
      this.root.add(cone);

      this.dynamicProps.push({
        mesh: cone,
        position: cone.position,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        radius: 0.4,
        knocked: false,
      });
    }

    // Spawn 10 barrels
    for (let i = 0; i < 10; i++) {
      const px = 65 + (Math.random() - 0.5) * 8;
      const pz = -15 + (Math.random() - 0.5) * 15;
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(px, 0.5, pz);
      barrel.castShadow = true;
      this.root.add(barrel);

      this.dynamicProps.push({
        mesh: barrel,
        position: barrel.position,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        radius: 0.55,
        knocked: false,
      });
    }
  }

  /**
   * Ground elevation query for physics engine (handles flat road + stunt ramps)
   */
  public getGroundHeight(x: number, z: number): GroundQuery {
    // Check if on any ramp
    for (const ramp of this.ramps) {
      const dx = x - ramp.x;
      const dz = z - ramp.z;

      // Rotate point into ramp local space
      const cosA = Math.cos(-ramp.angle);
      const sinA = Math.sin(-ramp.angle);
      const localX = dx * cosA - dz * sinA;
      const localZ = dx * sinA + dz * cosA;

      const halfW = ramp.width / 2;
      const halfL = ramp.length / 2;

      if (Math.abs(localX) <= halfW && localZ >= -halfL && localZ <= halfL) {
        // Linear height ramp from 0 at -halfL to ramp.height at halfL
        const progress = (localZ + halfL) / ramp.length;
        const rampHeight = progress * ramp.height;
        return {
          height: rampHeight,
          normal: new THREE.Vector3(0, 1, 0),
          surface: 'ramp',
        };
      }
    }

    return {
      height: 0,
      normal: new THREE.Vector3(0, 1, 0),
      surface: 'road',
    };
  }

  /**
   * Check collision against city buildings and barriers
   */
  public checkCollision(x: number, z: number, radius: number): { collided: boolean; normalX: number; normalZ: number; pushDist: number } | null {
    for (const box of this.colliders) {
      if (
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      ) {
        // Calculate penetration depths
        const overlapLeft = (x + radius) - box.minX;
        const overlapRight = box.maxX - (x - radius);
        const overlapTop = (z + radius) - box.minZ;
        const overlapBottom = box.maxZ - (z - radius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        let nx = 0;
        let nz = 0;
        if (minOverlap === overlapLeft) nx = -1;
        else if (minOverlap === overlapRight) nx = 1;
        else if (minOverlap === overlapTop) nz = -1;
        else nz = 1;

        return {
          collided: true,
          normalX: nx,
          normalZ: nz,
          pushDist: minOverlap,
        };
      }
    }
    return null;
  }

  /**
   * Update dynamic breakable street props when hit by car
   */
  public updateProps(carPos: THREE.Vector3, carVel: THREE.Vector3, dt: number) {
    const carSpeed = carVel.length();

    for (const prop of this.dynamicProps) {
      if (!prop.knocked) {
        const distSq = (carPos.x - prop.position.x) ** 2 + (carPos.z - prop.position.z) ** 2;
        if (distSq < (prop.radius + 1.2) ** 2 && carSpeed > 4) {
          // Impact! Send prop flying with car momentum
          prop.knocked = true;
          prop.velocity.copy(carVel).multiplyScalar(1.2);
          prop.velocity.y = 4.0 + Math.random() * 5.0;
          prop.angularVelocity.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          );
        }
      } else {
        // Animate flying knocked prop
        prop.position.addScaledVector(prop.velocity, dt);
        prop.velocity.y -= 18.0 * dt; // Gravity
        prop.mesh.rotation.x += prop.angularVelocity.x * dt;
        prop.mesh.rotation.y += prop.angularVelocity.y * dt;
        prop.mesh.rotation.z += prop.angularVelocity.z * dt;

        // Bounce on ground
        if (prop.position.y < prop.radius) {
          prop.position.y = prop.radius;
          prop.velocity.y = -prop.velocity.y * 0.45;
          prop.velocity.x *= 0.7;
          prop.velocity.z *= 0.7;
        }
      }
    }
  }

  public getNearestSpawnPoint(x: number, z: number): { x: number; y: number; z: number; yaw: number } {
    // Nearest clear lane on Ocean Drive
    return {
      x: 0,
      y: 0.4,
      z: Math.min(Math.max(z, -240), 240),
      yaw: 0,
    };
  }
}
