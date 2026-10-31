import * as THREE from 'three';
import { CarStyle } from '../types';

/**
 * High-fidelity 3D procedural vehicle model replicating the user's
 * Mint Green / Seafoam Turquoise Sports Sedan (M5 styled) with deep-dish
 * bronze mesh wheels, twin kidney grilles, angel eyes, carbon splitter,
 * quad exhaust, illuminated lights, and animated suspension/steering.
 */

export class CarModel {
  public root: THREE.Group;
  public chassisGroup: THREE.Group;
  public interiorGroup: THREE.Group;
  public steeringWheelMesh: THREE.Mesh | null = null;

  // Wheel groups for rotation & steering
  public frontLeftWheelGroup: THREE.Group;
  public frontRightWheelGroup: THREE.Group;
  public rearLeftWheelGroup: THREE.Group;
  public rearRightWheelGroup: THREE.Group;

  // Front wheel steering pivots (pivot around Y for steering, then inner wheel spins around X)
  public frontLeftSteerPivot: THREE.Group;
  public frontRightSteerPivot: THREE.Group;

  // Lights
  public headlightsLeft: THREE.Group | null = null;
  public headlightsRight: THREE.Group | null = null;
  public taillightsLeft: THREE.Mesh | null = null;
  public taillightsRight: THREE.Mesh | null = null;
  public leftSpotlight: THREE.SpotLight | null = null;
  public rightSpotlight: THREE.SpotLight | null = null;
  public underglowLight: THREE.PointLight | null = null;
  public underglowMesh: THREE.Mesh | null = null;

  // Exhaust positions for particle effects
  public exhaustLeftPos = new THREE.Vector3();
  public exhaustRightPos = new THREE.Vector3();

  // Materials
  private bodyMaterial: THREE.MeshPhysicalMaterial;
  private carbonMaterial: THREE.MeshStandardMaterial;
  private glassMaterial: THREE.MeshPhysicalMaterial;
  private chromeMaterial: THREE.MeshStandardMaterial;
  private rimBronzeMaterial: THREE.MeshStandardMaterial;
  private tireMaterial: THREE.MeshStandardMaterial;
  private brakeCaliperMaterial: THREE.MeshStandardMaterial;
  private headlightMaterial: THREE.MeshStandardMaterial;
  private taillightMaterial: THREE.MeshStandardMaterial;
  private underglowMaterial: THREE.MeshBasicMaterial;

  private currentStyle: CarStyle = 'modern';
  private headlightsActive = true;
  private underglowActive = true;

  constructor(style: CarStyle = 'modern') {
    this.currentStyle = style;
    this.root = new THREE.Group();
    this.root.name = 'CarRoot';

    this.chassisGroup = new THREE.Group();
    this.chassisGroup.name = 'ChassisGroup';
    this.root.add(this.chassisGroup);

    this.interiorGroup = new THREE.Group();
    this.interiorGroup.name = 'InteriorGroup';
    this.chassisGroup.add(this.interiorGroup);

    // Initialize materials
    this.bodyMaterial = this.createBodyMaterial();
    this.carbonMaterial = this.createCarbonMaterial();
    this.glassMaterial = this.createGlassMaterial();
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.95,
      roughness: 0.1,
    });
    this.rimBronzeMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58249, // Bronze / champagne gold as in user's image
      metalness: 0.85,
      roughness: 0.25,
    });
    this.tireMaterial = this.createTireMaterial();
    this.brakeCaliperMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd1122, // Red Brembo style calipers
      metalness: 0.4,
      roughness: 0.3,
    });
    this.headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x99ddff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.1,
    });
    this.taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0x990000,
      emissive: 0xff1122,
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.1,
    });
    this.underglowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    // Build wheel structures
    this.frontLeftSteerPivot = new THREE.Group();
    this.frontRightSteerPivot = new THREE.Group();
    this.frontLeftWheelGroup = new THREE.Group();
    this.frontRightWheelGroup = new THREE.Group();
    this.rearLeftWheelGroup = new THREE.Group();
    this.rearRightWheelGroup = new THREE.Group();

    this.buildCar();
    this.setupLighting();
  }

  private createBodyMaterial(): THREE.MeshPhysicalMaterial {
    // Exact mint green / seafoam turquoise paint from the user's images (#42cf9e / #3ec99b)
    return new THREE.MeshPhysicalMaterial({
      color: 0x41cc9c,
      roughness: 0.2,
      metalness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
    });
  }

  private createCarbonMaterial(): THREE.MeshStandardMaterial {
    // Procedural carbon fiber weave pattern
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#262626';
    for (let x = 0; x < 64; x += 8) {
      for (let y = 0; y < 64; y += 8) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x222222,
      roughness: 0.35,
      metalness: 0.4,
    });
  }

  private createGlassMaterial(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x111c22,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.52,
    });
  }

  private createTireMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, 64, 128);
    // Tire tread grooves
    ctx.strokeStyle = '#0e0e0e';
    ctx.lineWidth = 4;
    for (let y = 0; y < 128; y += 12) {
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.lineTo(32, y + 6);
      ctx.lineTo(56, y);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    texture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x222222,
      roughness: 0.75,
      metalness: 0.1,
    });
  }

  private buildCar() {
    // Car dimensions (sports sedan: length ~4.8m, width ~1.95m, height ~1.35m)
    // Pivot is at bottom center of the car (ground height 0)
    const carBody = this.chassisGroup;

    // 1. MAIN LOWER HULL & SILLS
    const lowerHullGeo = new THREE.BoxGeometry(1.88, 0.42, 4.4);
    const lowerHull = new THREE.Mesh(lowerHullGeo, this.bodyMaterial);
    lowerHull.position.set(0, 0.42, 0);
    lowerHull.castShadow = true;
    lowerHull.receiveShadow = true;
    carBody.add(lowerHull);

    // Side skirts / rocker panels in carbon
    const sideSkirtLGeo = new THREE.BoxGeometry(0.08, 0.08, 2.7);
    const sideSkirtL = new THREE.Mesh(sideSkirtLGeo, this.carbonMaterial);
    sideSkirtL.position.set(-0.96, 0.24, 0);
    carBody.add(sideSkirtL);

    const sideSkirtR = sideSkirtL.clone();
    sideSkirtR.position.x = 0.96;
    carBody.add(sideSkirtR);

    // 2. SCULPTED HOOD WITH POWER CREASES
    const hoodGeo = new THREE.BoxGeometry(1.78, 0.16, 1.45);
    const hood = new THREE.Mesh(hoodGeo, this.bodyMaterial);
    hood.position.set(0, 0.64, 1.35);
    hood.rotation.x = -0.04;
    hood.castShadow = true;
    carBody.add(hood);

    // Hood power bulge lines
    const bulgeGeo = new THREE.BoxGeometry(0.12, 0.04, 1.15);
    const bulgeL = new THREE.Mesh(bulgeGeo, this.bodyMaterial);
    bulgeL.position.set(-0.35, 0.74, 1.32);
    bulgeL.rotation.x = -0.04;
    carBody.add(bulgeL);

    const bulgeR = bulgeL.clone();
    bulgeR.position.x = 0.35;
    carBody.add(bulgeR);

    // 3. FRONT NOSE & ICONIC BMW KIDNEY GRILLES
    const noseGeo = new THREE.BoxGeometry(1.82, 0.38, 0.45);
    const nose = new THREE.Mesh(noseGeo, this.bodyMaterial);
    nose.position.set(0, 0.48, 2.15);
    carBody.add(nose);

    // Split Kidney Grille Frame (Chrome/Black surround)
    const grilleFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const grilleL = this.createKidneyGrille(grilleFrameMat);
    grilleL.position.set(-0.24, 0.52, 2.38);
    carBody.add(grilleL);

    const grilleR = this.createKidneyGrille(grilleFrameMat);
    grilleR.position.set(0.24, 0.52, 2.38);
    carBody.add(grilleR);

    // BMW Roundel Emblem on Hood
    const emblemGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16);
    const emblemMat = new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0.5, roughness: 0.3 });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.position.set(0, 0.69, 2.05);
    emblem.rotation.x = -0.1;
    carBody.add(emblem);

    // 4. FRONT LOWER BUMPER & CARBON SPLITTER
    // Wide honeycomb lower air intake
    const lowerIntakeGeo = new THREE.BoxGeometry(1.4, 0.18, 0.2);
    const meshMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 });
    const lowerIntake = new THREE.Mesh(lowerIntakeGeo, meshMat);
    lowerIntake.position.set(0, 0.3, 2.32);
    carBody.add(lowerIntake);

    // Front Carbon Chin Splitter (Extends out aggressively as in image)
    const splitterGeo = new THREE.BoxGeometry(1.88, 0.045, 0.42);
    const splitter = new THREE.Mesh(splitterGeo, this.carbonMaterial);
    splitter.position.set(0, 0.19, 2.24);
    splitter.castShadow = true;
    carBody.add(splitter);

    // Splitter aero winglets on the sides
    const wingletGeo = new THREE.BoxGeometry(0.04, 0.12, 0.2);
    const wingletL = new THREE.Mesh(wingletGeo, this.carbonMaterial);
    wingletL.position.set(-0.94, 0.25, 2.2);
    carBody.add(wingletL);

    const wingletR = wingletL.clone();
    wingletR.position.x = 0.94;
    carBody.add(wingletR);

    // 5. HEADLIGHT CLUSTERS (Iconic Angel Eye / DRL Projectors)
    const headlightGeo = new THREE.BoxGeometry(0.38, 0.14, 0.18);
    const headlightGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x112233,
      transparent: true,
      opacity: 0.8,
      roughness: 0.05,
    });

    const headlightLeftHousing = new THREE.Mesh(headlightGeo, headlightGlassMat);
    headlightLeftHousing.position.set(-0.64, 0.54, 2.28);
    headlightLeftHousing.rotation.y = 0.12;
    carBody.add(headlightLeftHousing);

    const headlightRightHousing = headlightLeftHousing.clone();
    headlightRightHousing.position.x = 0.64;
    headlightRightHousing.rotation.y = -0.12;
    carBody.add(headlightRightHousing);

    // Angel Eye Rings / LED Projectors inside housing
    this.headlightsLeft = this.createAngelEyeCluster();
    this.headlightsLeft.position.set(-0.64, 0.54, 2.32);
    this.headlightsLeft.rotation.y = 0.12;
    carBody.add(this.headlightsLeft);

    this.headlightsRight = this.createAngelEyeCluster();
    this.headlightsRight.position.set(0.64, 0.54, 2.32);
    this.headlightsRight.rotation.y = -0.12;
    carBody.add(this.headlightsRight);

    // 6. CABIN GREENHOUSE, ROOF & TINTED WINDOWS
    const cabinGeo = new THREE.BoxGeometry(1.62, 0.54, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, this.bodyMaterial);
    cabin.position.set(0, 0.89, -0.15);
    carBody.add(cabin);

    // Windshield (Raked angle)
    const windshieldGeo = new THREE.BoxGeometry(1.56, 0.52, 0.06);
    const windshield = new THREE.Mesh(windshieldGeo, this.glassMaterial);
    windshield.position.set(0, 0.88, 0.76);
    windshield.rotation.x = -0.58;
    carBody.add(windshield);

    // Rear Windshield
    const rearWindowGeo = new THREE.BoxGeometry(1.54, 0.5, 0.06);
    const rearWindow = new THREE.Mesh(rearWindowGeo, this.glassMaterial);
    rearWindow.position.set(0, 0.88, -1.05);
    rearWindow.rotation.x = 0.52;
    carBody.add(rearWindow);

    // Side Windows
    const sideWindowGeo = new THREE.BoxGeometry(0.04, 0.36, 1.6);
    const sideWindowL = new THREE.Mesh(sideWindowGeo, this.glassMaterial);
    sideWindowL.position.set(-0.82, 0.88, -0.12);
    carBody.add(sideWindowL);

    const sideWindowR = sideWindowL.clone();
    sideWindowR.position.x = 0.82;
    carBody.add(sideWindowR);

    // Shark Fin Antenna on Roof
    const sharkFinGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    const sharkFin = new THREE.Mesh(sharkFinGeo, this.bodyMaterial);
    sharkFin.position.set(0, 1.2, -0.85);
    sharkFin.rotation.x = -0.4;
    carBody.add(sharkFin);

    // Side aero mirrors
    const mirrorL = this.createSideMirror();
    mirrorL.position.set(-0.95, 0.78, 0.55);
    carBody.add(mirrorL);

    const mirrorR = this.createSideMirror();
    mirrorR.position.set(0.95, 0.78, 0.55);
    mirrorR.scale.x = -1;
    carBody.add(mirrorR);

    // Front Fender M-Gills (Side Vents)
    const gillGeo = new THREE.BoxGeometry(0.02, 0.08, 0.16);
    const gillL = new THREE.Mesh(gillGeo, this.carbonMaterial);
    gillL.position.set(-0.95, 0.54, 1.15);
    carBody.add(gillL);

    const gillR = gillL.clone();
    gillR.position.x = 0.95;
    carBody.add(gillR);

    // 7. REAR TRUNK, SPOILER & DIFFUSER
    const trunkGeo = new THREE.BoxGeometry(1.74, 0.22, 1.1);
    const trunk = new THREE.Mesh(trunkGeo, this.bodyMaterial);
    trunk.position.set(0, 0.62, -1.6);
    trunk.castShadow = true;
    carBody.add(trunk);

    // Carbon Ducktail Trunk Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.6, 0.06, 0.16);
    const spoiler = new THREE.Mesh(spoilerGeo, this.carbonMaterial);
    spoiler.position.set(0, 0.74, -2.12);
    spoiler.rotation.x = 0.15;
    carBody.add(spoiler);

    // Rear Bumper
    const rearBumperGeo = new THREE.BoxGeometry(1.84, 0.42, 0.35);
    const rearBumper = new THREE.Mesh(rearBumperGeo, this.bodyMaterial);
    rearBumper.position.set(0, 0.44, -2.18);
    carBody.add(rearBumper);

    // Rear Diffuser with vertical fins
    const diffuserGeo = new THREE.BoxGeometry(1.5, 0.14, 0.28);
    const diffuser = new THREE.Mesh(diffuserGeo, this.carbonMaterial);
    diffuser.position.set(0, 0.23, -2.25);
    carBody.add(diffuser);

    // Rear Taillights (L-shaped sleek lightbars)
    const taillightGeo = new THREE.BoxGeometry(0.42, 0.1, 0.08);
    this.taillightsLeft = new THREE.Mesh(taillightGeo, this.taillightMaterial);
    this.taillightsLeft.position.set(-0.62, 0.56, -2.28);
    carBody.add(this.taillightsLeft);

    this.taillightsRight = this.taillightsLeft.clone();
    this.taillightsRight.position.x = 0.62;
    carBody.add(this.taillightsRight);

    // Quad Exhaust Tips (Dual chrome pipes on left and right)
    const exhaustL = this.createDualExhaustPipes();
    exhaustL.position.set(-0.54, 0.24, -2.34);
    carBody.add(exhaustL);

    const exhaustR = this.createDualExhaustPipes();
    exhaustR.position.set(0.54, 0.24, -2.34);
    carBody.add(exhaustR);

    // Save exhaust emitter positions
    this.exhaustLeftPos.set(-0.54, 0.24, -2.4);
    this.exhaustRightPos.set(0.54, 0.24, -2.4);

    // 8. INTERIOR DETAILS
    this.buildInterior();

    // 9. WHEELS & SUSPENSION
    this.buildWheels();

    // 10. NEON UNDERGLOW MESH
    const underglowPlaneGeo = new THREE.PlaneGeometry(1.6, 3.4);
    this.underglowMesh = new THREE.Mesh(underglowPlaneGeo, this.underglowMaterial);
    this.underglowMesh.rotation.x = -Math.PI / 2;
    this.underglowMesh.position.set(0, 0.06, 0);
    this.root.add(this.underglowMesh);
  }

  private createKidneyGrille(surroundMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    // Outer frame
    const frameGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
    frameGeo.scale(1.2, 0.5, 1.8);
    const frame = new THREE.Mesh(frameGeo, surroundMat);
    frame.rotation.x = Math.PI / 2;
    group.add(frame);

    // Vertical black slats inside
    const slatMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 });
    for (let i = -3; i <= 3; i++) {
      const slatGeo = new THREE.BoxGeometry(0.015, 0.22, 0.03);
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.x = i * 0.04;
      group.add(slat);
    }

    return group;
  }

  private createAngelEyeCluster(): THREE.Group {
    const group = new THREE.Group();

    // Dual circular halo rings (angel eyes)
    const ringGeo = new THREE.TorusGeometry(0.048, 0.009, 8, 24);
    const ringL = new THREE.Mesh(ringGeo, this.headlightMaterial);
    ringL.position.x = -0.07;
    group.add(ringL);

    const ringR = new THREE.Mesh(ringGeo, this.headlightMaterial);
    ringR.position.x = 0.07;
    group.add(ringR);

    // Center projector lenses
    const lensGeo = new THREE.SphereGeometry(0.026, 12, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lensL = new THREE.Mesh(lensGeo, lensMat);
    lensL.position.set(-0.07, 0, -0.01);
    group.add(lensL);

    const lensR = lensL.clone();
    lensR.position.x = 0.07;
    group.add(lensR);

    return group;
  }

  private createSideMirror(): THREE.Group {
    const group = new THREE.Group();
    const stemGeo = new THREE.BoxGeometry(0.08, 0.03, 0.04);
    const stem = new THREE.Mesh(stemGeo, this.carbonMaterial);
    group.add(stem);

    const capGeo = new THREE.BoxGeometry(0.16, 0.09, 0.12);
    const cap = new THREE.Mesh(capGeo, this.bodyMaterial);
    cap.position.set(-0.06, 0.02, 0);
    group.add(cap);

    const glassGeo = new THREE.PlaneGeometry(0.13, 0.07);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.05,
    });
    const glass = new THREE.Mesh(glassGeo, mirrorGlassMat);
    glass.position.set(-0.06, 0.02, -0.061);
    glass.rotation.y = Math.PI;
    group.add(glass);

    return group;
  }

  private createDualExhaustPipes(): THREE.Group {
    const group = new THREE.Group();
    const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16, 1, true);

    const pipe1 = new THREE.Mesh(pipeGeo, this.chromeMaterial);
    pipe1.rotation.x = Math.PI / 2;
    pipe1.position.x = -0.06;
    group.add(pipe1);

    const pipe2 = pipe1.clone();
    pipe2.position.x = 0.06;
    group.add(pipe2);

    return group;
  }

  private buildInterior() {
    // Sport dashboard
    const dashGeo = new THREE.BoxGeometry(1.5, 0.28, 0.5);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.78, 0.45);
    this.interiorGroup.add(dash);

    // Digital instrument cluster screen
    const clusterGeo = new THREE.PlaneGeometry(0.24, 0.08);
    const clusterMat = new THREE.MeshBasicMaterial({ color: 0x00e1d9 });
    const cluster = new THREE.Mesh(clusterGeo, clusterMat);
    cluster.position.set(-0.35, 0.84, 0.25);
    cluster.rotation.x = -0.3;
    this.interiorGroup.add(cluster);

    // Sport 3-Spoke Steering Wheel
    const steerGroup = new THREE.Group();
    steerGroup.position.set(-0.35, 0.8, 0.18);
    steerGroup.rotation.x = -0.4;

    const rimGeo = new THREE.TorusGeometry(0.14, 0.016, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    this.steeringWheelMesh = new THREE.Mesh(rimGeo, rimMat);
    steerGroup.add(this.steeringWheelMesh);

    // Center hub
    const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const hub = new THREE.Mesh(hubGeo, this.carbonMaterial);
    hub.rotation.x = Math.PI / 2;
    steerGroup.add(hub);

    this.interiorGroup.add(steerGroup);

    // Front bucket seats (Driver & Passenger)
    const seatL = this.createBucketSeat();
    seatL.position.set(-0.38, 0.62, -0.15);
    this.interiorGroup.add(seatL);

    const seatR = this.createBucketSeat();
    seatR.position.set(0.38, 0.62, -0.15);
    this.interiorGroup.add(seatR);
  }

  private createBucketSeat(): THREE.Group {
    const group = new THREE.Group();
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });

    const baseGeo = new THREE.BoxGeometry(0.44, 0.12, 0.48);
    const base = new THREE.Mesh(baseGeo, leatherMat);
    group.add(base);

    const backGeo = new THREE.BoxGeometry(0.42, 0.58, 0.12);
    const back = new THREE.Mesh(backGeo, leatherMat);
    back.position.set(0, 0.32, -0.18);
    back.rotation.x = -0.18;
    group.add(back);

    const headrestGeo = new THREE.BoxGeometry(0.24, 0.16, 0.1);
    const headrest = new THREE.Mesh(headrestGeo, leatherMat);
    headrest.position.set(0, 0.65, -0.22);
    group.add(headrest);

    return group;
  }

  private buildWheels() {
    // Wheel positions
    // Wheelbase: 2.85m, Track width: 1.84m, Wheel radius: ~0.35m
    const xPos = 0.94;
    const yPos = 0.35;
    const zFront = 1.35;
    const zRear = -1.45;

    // Front Left
    this.frontLeftSteerPivot.position.set(-xPos, yPos, zFront);
    this.frontLeftWheelGroup = this.createDeepDishWheel(true);
    this.frontLeftSteerPivot.add(this.frontLeftWheelGroup);
    this.root.add(this.frontLeftSteerPivot);

    // Front Right
    this.frontRightSteerPivot.position.set(xPos, yPos, zFront);
    this.frontRightWheelGroup = this.createDeepDishWheel(false);
    this.frontRightSteerPivot.add(this.frontRightWheelGroup);
    this.root.add(this.frontRightSteerPivot);

    // Rear Left
    this.rearLeftWheelGroup = this.createDeepDishWheel(true);
    this.rearLeftWheelGroup.position.set(-xPos, yPos, zRear);
    this.root.add(this.rearLeftWheelGroup);

    // Rear Right
    this.rearRightWheelGroup = this.createDeepDishWheel(false);
    this.rearRightWheelGroup.position.set(xPos, yPos, zRear);
    this.root.add(this.rearRightWheelGroup);
  }

  /**
   * High-fidelity bronze mesh multi-spoke deep-dish wheel
   * with stepped chrome polished lip, slotted brake disc & red caliper
   */
  private createDeepDishWheel(isLeft: boolean): THREE.Group {
    const wheelGroup = new THREE.Group();

    // 1. Rubber Tire (275/30 R20 profile)
    // Radius 0.35, width 0.28
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 24, 1, false);
    const tire = new THREE.Mesh(tireGeo, this.tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // 2. Stepped Polished Chrome Deep Lip (Outer barrel)
    const lipGeo = new THREE.CylinderGeometry(0.29, 0.26, 0.12, 24, 1, true);
    const lip = new THREE.Mesh(lipGeo, this.chromeMaterial);
    lip.rotation.z = Math.PI / 2;
    lip.position.x = isLeft ? -0.07 : 0.07;
    wheelGroup.add(lip);

    // 3. Bronze Multi-Spoke Center Mesh (As clearly shown in the user's images)
    const spokeGroup = new THREE.Group();
    const spokeCount = 10;
    const spokeGeo = new THREE.BoxGeometry(0.028, 0.24, 0.024);

    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI) / (spokeCount / 2);
      const spoke1 = new THREE.Mesh(spokeGeo, this.rimBronzeMaterial);
      spoke1.rotation.y = angle;
      spokeGroup.add(spoke1);

      // Cross mesh spoke for classic BBS / multi-spoke geometry
      const spoke2 = new THREE.Mesh(spokeGeo, this.rimBronzeMaterial);
      spoke2.rotation.y = angle + 0.16;
      spokeGroup.add(spoke2);
    }

    // Center hub cap with lug bolts
    const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16);
    const hub = new THREE.Mesh(hubGeo, this.rimBronzeMaterial);
    hub.rotation.z = Math.PI / 2;
    spokeGroup.add(hub);

    // Center cap emblem
    const capEmblemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.035, 12);
    const capEmblem = new THREE.Mesh(capEmblemGeo, this.chromeMaterial);
    capEmblem.rotation.z = Math.PI / 2;
    spokeGroup.add(capEmblem);

    spokeGroup.rotation.z = Math.PI / 2;
    spokeGroup.position.x = isLeft ? -0.09 : 0.09;
    wheelGroup.add(spokeGroup);

    // 4. Slotted Brake Rotor & Red Brembo Caliper (Stationary relative to axle)
    const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 20);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.25,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = isLeft ? -0.01 : 0.01;
    wheelGroup.add(disc);

    const caliperGeo = new THREE.BoxGeometry(0.05, 0.12, 0.09);
    const caliper = new THREE.Mesh(caliperGeo, this.brakeCaliperMaterial);
    caliper.position.set(isLeft ? -0.02 : 0.02, 0.16, 0.06);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  private setupLighting() {
    // Dual forward high-beam spotlights attached to car
    this.leftSpotlight = new THREE.SpotLight(0xfff8ee, 3.5, 65, Math.PI / 6, 0.4, 1.2);
    this.leftSpotlight.position.set(-0.64, 0.54, 2.3);
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(-0.64, 0.1, 35);
    this.chassisGroup.add(leftTarget);
    this.leftSpotlight.target = leftTarget;
    this.chassisGroup.add(this.leftSpotlight);

    this.rightSpotlight = new THREE.SpotLight(0xfff8ee, 3.5, 65, Math.PI / 6, 0.4, 1.2);
    this.rightSpotlight.position.set(0.64, 0.54, 2.3);
    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(0.64, 0.1, 35);
    this.chassisGroup.add(rightTarget);
    this.rightSpotlight.target = rightTarget;
    this.chassisGroup.add(this.rightSpotlight);

    // Neon underglow point light
    this.underglowLight = new THREE.PointLight(0x00f0ff, 2.0, 5, 2.0);
    this.underglowLight.position.set(0, 0.15, 0);
    this.chassisGroup.add(this.underglowLight);
  }

  /**
   * Update wheel rotation, steering angle, suspension pitch and roll
   */
  public updateVisuals(
    steerAngle: number,
    wheelRotation: number,
    suspensionRoll: number,
    suspensionPitch: number,
    isBraking: boolean,
    isReversing: boolean
  ) {
    // 1. Steer front wheels
    this.frontLeftSteerPivot.rotation.y = steerAngle;
    this.frontRightSteerPivot.rotation.y = steerAngle;

    // 2. Spin all 4 wheels around their axle (X axis)
    this.frontLeftWheelGroup.rotation.x = wheelRotation;
    this.frontRightWheelGroup.rotation.x = wheelRotation;
    this.rearLeftWheelGroup.rotation.x = wheelRotation;
    this.rearRightWheelGroup.rotation.x = wheelRotation;

    // 3. Turn steering wheel inside cabin
    if (this.steeringWheelMesh) {
      this.steeringWheelMesh.rotation.z = -steerAngle * 2.8;
    }

    // 4. Chassis body roll and pitch from suspension physics
    this.chassisGroup.rotation.z = suspensionRoll;
    this.chassisGroup.rotation.x = suspensionPitch;

    // 5. Dynamic brake lights
    if (this.taillightsLeft && this.taillightsRight) {
      if (isBraking) {
        this.taillightMaterial.emissiveIntensity = 4.0;
        this.taillightMaterial.color.setHex(0xff0022);
      } else if (isReversing) {
        this.taillightMaterial.emissiveIntensity = 2.5;
        this.taillightMaterial.color.setHex(0xffffff);
      } else {
        this.taillightMaterial.emissiveIntensity = 1.0;
        this.taillightMaterial.color.setHex(0x990000);
      }
    }
  }

  public toggleHeadlights(): boolean {
    this.headlightsActive = !this.headlightsActive;
    if (this.leftSpotlight && this.rightSpotlight) {
      this.leftSpotlight.intensity = this.headlightsActive ? 3.5 : 0;
      this.rightSpotlight.intensity = this.headlightsActive ? 3.5 : 0;
    }
    this.headlightMaterial.emissiveIntensity = this.headlightsActive ? 2.5 : 0.2;
    return this.headlightsActive;
  }

  public toggleUnderglow(): boolean {
    this.underglowActive = !this.underglowActive;
    if (this.underglowLight && this.underglowMesh) {
      this.underglowLight.intensity = this.underglowActive ? 2.0 : 0;
      this.underglowMesh.visible = this.underglowActive;
    }
    return this.underglowActive;
  }

  public setUnderglowColor(hex: number) {
    this.underglowMaterial.color.setHex(hex);
    if (this.underglowLight) {
      this.underglowLight.color.setHex(hex);
    }
  }

  public setCarStyle(style: CarStyle) {
    this.currentStyle = style;
    if (style === 'classic') {
      // Classic E39 M5 style: round fog lights, classic stance, slightly warmer mint
      this.bodyMaterial.color.setHex(0x48d2a4);
    } else {
      // Modern F90 style: aggressive aero, deep seafoam
      this.bodyMaterial.color.setHex(0x3ebd90);
    }
  }

  public getCarStyle(): CarStyle {
    return this.currentStyle;
  }
}
