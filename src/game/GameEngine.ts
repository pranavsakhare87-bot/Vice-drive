import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraMode, CarStyle, ControlsState, GameState, HandlingMode } from '../types';
import { CarModel } from './CarModel';
import { CarPhysics } from './CarPhysics';
import { CityWorld } from './CityWorld';
import { ParticleSystem } from './Particles';
import { TireTracks } from './TireTracks';
import { soundEngine } from '../audio/SoundSystem';
import { haptics } from '../utils/haptics';

// Pre-allocate module-scoped math helpers to ensure 0 GC during game loop
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _carForward = new THREE.Vector3();
const _carRight = new THREE.Vector3();
const _rearLeftPos = new THREE.Vector3();
const _rearRightPos = new THREE.Vector3();
const _exhaustLPos = new THREE.Vector3();
const _exhaustRPos = new THREE.Vector3();

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public carModel: CarModel;
  public physics: CarPhysics;
  public cityWorld: CityWorld;
  public particles: ParticleSystem;
  public tireTracks: TireTracks;

  public cameraMode: CameraMode = 'chase';
  public gameState: GameState = 'title';

  private container: HTMLElement;
  private frameId = 0;
  private isSoftwareGl = false;
  private clock = new THREE.Clock();

  // Controls state
  public controls: ControlsState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
    horn: false,
  };

  // Callback to push telemetry to UI
  public onTelemetryUpdate?: () => void;

  // Title screen orbit angle
  private titleOrbitAngle = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect software WebGL as per Three.js directives
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    const maxPixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : maxPixelRatio);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    // 80s Vice City twilight/sunset purple fog matching horizon
    this.scene.fog = new THREE.FogExp2(0x281236, 0.0035);

    // 4. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 3, -7);

    // 5. Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Sky & Atmospheric Lighting
    this.setupSkyAndLighting();

    // 7. World, Car, Particles & Tracks
    this.cityWorld = new CityWorld(this.scene);
    this.carModel = new CarModel('modern');
    this.scene.add(this.carModel.root);

    this.particles = new ParticleSystem(this.scene);
    this.tireTracks = new TireTracks(this.scene);

    // 8. Connect Physics to World Ground & Collisions
    this.physics = new CarPhysics();
    this.physics.groundHeightFn = (x, z) => this.cityWorld.getGroundHeight(x, z);
    this.physics.collisionCheckFn = (x, z, r) => this.cityWorld.checkCollision(x, z, r);

    // Wire up sound & haptic events
    this.physics.onGearShift = () => {
      soundEngine.playBlowOff();
      haptics.gearShift();
    };
    this.physics.onBackfire = () => {
      soundEngine.playBackfirePop();
      // Backfire particles from exhaust
      this.getExhaustPositions(_exhaustLPos, _exhaustRPos);
      this.getCarForward(_carForward);
      this.particles.emitBackfire(_exhaustLPos, _exhaustRPos, _carForward);
    };
    this.physics.onCrash = (speed) => {
      soundEngine.playCrash(speed);
      haptics.crash();
      this.getCarForward(_carForward);
      this.particles.emitSparks(this.physics.position, _carForward);
    };
    this.physics.onLanding = (impact) => {
      soundEngine.playLanding(impact);
      haptics.landing();
    };

    // 9. Input Listeners
    this.setupInputListeners();

    // 10. Start Animation Loop
    this.startLoop();
  }

  private setupSkyAndLighting() {
    // 80s Synthwave Sunset Sky Dome
    const skyGeo = new THREE.SphereGeometry(700, 32, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#10002b'); // Deep night purple zenith
    grad.addColorStop(0.35, '#3c096c'); // Rich magenta
    grad.addColorStop(0.65, '#ff5400'); // Sunset orange horizon
    grad.addColorStop(0.85, '#ff0054'); // Hot pink glow
    grad.addColorStop(1, '#ffbd00'); // Golden sun rim
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Draw giant glowing sunset sun low on horizon
    ctx.fillStyle = '#ffeaa7';
    ctx.shadowColor = '#ff7675';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(256, 380, 54, 0, Math.PI * 2);
    ctx.fill();

    // 80s sun horizontal blinds slices
    ctx.fillStyle = '#ff5400';
    for (let y = 350; y < 440; y += 10) {
      ctx.fillRect(180, y, 150, 4);
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);

    // Balanced 3-Point Lighting Rig
    // 1. Warm Key Sun Light
    const sunLight = new THREE.DirectionalLight(0xffaa66, 2.8);
    sunLight.position.set(120, 140, 180);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 400;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // 2. Cool Sky / Ground Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x9d4edd, 0x1b1b2f, 1.4);
    this.scene.add(hemiLight);

    // 3. Synthwave Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    rimLight.position.set(-150, 80, -120);
    this.scene.add(rimLight);
  }

  private setupInputListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Avoid capturing inputs if typing in an input element
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    soundEngine.init();
    soundEngine.resume();

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.controls.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.controls.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.controls.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.controls.right = true;
        break;
      case 'Space':
        this.controls.handbrake = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.controls.nitro = true;
        break;
      case 'KeyH':
        this.controls.horn = true;
        soundEngine.setHorn(true);
        break;
      case 'KeyL':
        this.carModel.toggleHeadlights();
        break;
      case 'KeyC':
        this.cycleCamera();
        break;
      case 'KeyR':
        this.resetCar();
        break;
      case 'KeyU':
        this.carModel.toggleUnderglow();
        break;
      case 'BracketRight':
        soundEngine.nextStation();
        break;
      case 'BracketLeft':
        soundEngine.prevStation();
        break;
      case 'KeyM':
        soundEngine.toggleMute();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.controls.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.controls.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.controls.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.controls.right = false;
        break;
      case 'Space':
        this.controls.handbrake = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.controls.nitro = false;
        break;
      case 'KeyH':
        this.controls.horn = false;
        soundEngine.setHorn(false);
        break;
    }
  };

  private handleBlur = () => {
    // Clear all keys on window blur to avoid stuck throttle
    this.controls.forward = false;
    this.controls.backward = false;
    this.controls.left = false;
    this.controls.right = false;
    this.controls.handbrake = false;
    this.controls.nitro = false;
    this.controls.horn = false;
    soundEngine.setHorn(false);
  };

  public handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public cycleCamera() {
    const modes: CameraMode[] = ['chase', 'hood', 'bumper', 'cinematic'];
    const idx = modes.indexOf(this.cameraMode);
    this.cameraMode = modes[(idx + 1) % modes.length];
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public setHandlingMode(mode: HandlingMode) {
    this.physics.handlingMode = mode;
  }

  public setCarStyle(style: CarStyle) {
    this.carModel.setCarStyle(style);
  }

  public resetCar() {
    const spawn = this.cityWorld.getNearestSpawnPoint(this.physics.position.x, this.physics.position.z);
    this.physics.reset(spawn.x, spawn.y, spawn.z, spawn.yaw);
    this.tireTracks.clear();
  }

  private startLoop() {
    // Software WebGL pacing helper from Three.js skill
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private update(dt: number) {
    if (this.gameState === 'title') {
      // Cinematic orbiting camera around the mint green sports sedan on Title Screen
      this.titleOrbitAngle += dt * 0.45;
      const camRadius = 7.5;
      const camH = 2.2 + Math.sin(this.titleOrbitAngle * 0.5) * 0.6;
      this.camera.position.set(
        Math.sin(this.titleOrbitAngle) * camRadius,
        camH,
        Math.cos(this.titleOrbitAngle) * camRadius
      );
      this.camera.lookAt(0, 0.9, 0);

      // Car parked at origin
      this.carModel.root.position.set(0, 0, 0);
      this.carModel.root.rotation.set(0, -0.4, 0);
      this.carModel.updateVisuals(0, 0, 0, 0, false, false);
      return;
    }

    if (this.gameState === 'paused') {
      return;
    }

    // --- GAMEPLAY UPDATE ---
    // 1. Advance vehicle physics
    this.physics.update(dt, this.controls);

    // 2. Synchronize 3D model with physics
    this.carModel.root.position.copy(this.physics.position);
    this.carModel.root.rotation.y = this.physics.yaw;

    // 3. Wheel steering, spin, suspension roll and pitch
    this.carModel.updateVisuals(
      this.physics.steerAngle,
      this.physics.wheelRotation,
      this.physics.suspensionRoll,
      this.physics.suspensionPitch,
      this.controls.backward && this.physics.speedKmh > 1,
      this.physics.isReversing
    );

    // 4. Update Web Audio Engine
    const isThrottle = this.controls.forward;
    soundEngine.updateEngine(
      this.physics.rpm,
      isThrottle ? 1 : 0,
      this.physics.speedKmh,
      this.physics.isNitroActive
    );
    soundEngine.updateTireScreech(
      this.physics.isDrifting ? this.physics.slipAngle : (this.controls.handbrake ? 0.7 : 0),
      this.physics.speedKmh
    );

    // 5. Dynamic tire smoke & skid marks
    this.getRearWheelPositions(_rearLeftPos, _rearRightPos);
    if (this.physics.isDrifting || (this.controls.forward && this.controls.handbrake)) {
      this.particles.emitTireSmoke(_rearLeftPos, this.physics.slipAngle * 1.5 + 0.5);
      this.particles.emitTireSmoke(_rearRightPos, this.physics.slipAngle * 1.5 + 0.5);
      this.tireTracks.addMark(_rearLeftPos, _rearRightPos, 0, this.physics.slipAngle * 1.5 + 0.5);
    }

    // 6. Nitro boost flame particles
    if (this.physics.isNitroActive) {
      this.getExhaustPositions(_exhaustLPos, _exhaustRPos);
      this.getCarForward(_carForward);
      this.particles.emitNitroFlame(_exhaustLPos, _exhaustRPos, _carForward);
    }

    // 7. Update Particles & Props
    this.particles.update(dt);
    this.cityWorld.updateProps(this.physics.position, this.physics.velocity, dt);

    // 8. Update Camera Follow
    this.updateCamera(dt);

    // 9. Fire telemetry callback
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate();
    }
  }

  private updateCamera(dt: number) {
    const carPos = this.physics.position;
    const carYaw = this.physics.yaw;
    _carForward.set(Math.sin(carYaw), 0, Math.cos(carYaw));
    _carRight.set(_carForward.z, 0, -_carForward.x);

    switch (this.cameraMode) {
      case 'chase': {
        // Dynamic chase cam with speed zoom and drift lag
        const speedRatio = Math.min(this.physics.speedKmh / 260, 1.0);
        const distance = 6.2 + speedRatio * 1.8;
        const height = 2.4 + speedRatio * 0.4;

        // Target camera position behind car
        _camPos.set(
          carPos.x - _carForward.x * distance + _carRight.x * (this.physics.suspensionRoll * 2.0),
          carPos.y + height,
          carPos.z - _carForward.z * distance + _carRight.z * (this.physics.suspensionRoll * 2.0)
        );

        // Smooth exponential damping
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camPos.x, 10, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camPos.y, 8, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camPos.z, 10, dt);

        // Look at point ahead of car
        _camTarget.set(
          carPos.x + _carForward.x * 3.5,
          carPos.y + 1.1,
          carPos.z + _carForward.z * 3.5
        );
        this.camera.lookAt(_camTarget);

        // Dynamic FOV with speed and nitro
        const targetFov = 60 + speedRatio * 14 + (this.physics.isNitroActive ? 8 : 0);
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, dt);
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'hood': {
        // Mounted right on top of hood
        _camPos.set(
          carPos.x + _carForward.x * 0.8,
          carPos.y + 0.95,
          carPos.z + _carForward.z * 0.8
        );
        this.camera.position.copy(_camPos);
        _camTarget.set(
          carPos.x + _carForward.x * 25,
          carPos.y + 0.85,
          carPos.z + _carForward.z * 25
        );
        this.camera.lookAt(_camTarget);
        this.camera.fov = 72;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'bumper': {
        // Low to ground
        _camPos.set(
          carPos.x + _carForward.x * 2.2,
          carPos.y + 0.45,
          carPos.z + _carForward.z * 2.2
        );
        this.camera.position.copy(_camPos);
        _camTarget.set(
          carPos.x + _carForward.x * 35,
          carPos.y + 0.45,
          carPos.z + _carForward.z * 35
        );
        this.camera.lookAt(_camTarget);
        this.camera.fov = 80;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'cinematic': {
        // Orbiting drone camera around active car
        this.titleOrbitAngle += dt * 0.5;
        _camPos.set(
          carPos.x + Math.sin(this.titleOrbitAngle) * 8,
          carPos.y + 2.5,
          carPos.z + Math.cos(this.titleOrbitAngle) * 8
        );
        this.camera.position.copy(_camPos);
        _camTarget.set(carPos.x, carPos.y + 0.8, carPos.z);
        this.camera.lookAt(_camTarget);
        break;
      }
    }
  }

  private getRearWheelPositions(outL: THREE.Vector3, outR: THREE.Vector3) {
    const yaw = this.physics.yaw;
    const px = this.physics.position.x;
    const pz = this.physics.position.z;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    // Rear left wheel is at (-0.94, y, -1.45) in car space
    const rxL = -0.94 * cosY - (-1.45) * sinY;
    const rzL = -0.94 * sinY + (-1.45) * cosY;
    outL.set(px + rxL, this.physics.position.y, pz + rzL);

    // Rear right wheel is at (0.94, y, -1.45) in car space
    const rxR = 0.94 * cosY - (-1.45) * sinY;
    const rzR = 0.94 * sinY + (-1.45) * cosY;
    outR.set(px + rxR, this.physics.position.y, pz + rzR);
  }

  private getExhaustPositions(outL: THREE.Vector3, outR: THREE.Vector3) {
    const yaw = this.physics.yaw;
    const px = this.physics.position.x;
    const py = this.physics.position.y;
    const pz = this.physics.position.z;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const rxL = -0.54 * cosY - (-2.38) * sinY;
    const rzL = -0.54 * sinY + (-2.38) * cosY;
    outL.set(px + rxL, py + 0.24, pz + rzL);

    const rxR = 0.54 * cosY - (-2.38) * sinY;
    const rzR = 0.54 * sinY + (-2.38) * cosY;
    outR.set(px + rxR, py + 0.24, pz + rzR);
  }

  private getCarForward(out: THREE.Vector3) {
    out.set(Math.sin(this.physics.yaw), 0, Math.cos(this.physics.yaw));
  }

  public startGame() {
    this.gameState = 'playing';
    soundEngine.init();
    soundEngine.resume();
  }

  public pauseGame() {
    this.gameState = 'paused';
  }

  public resumeGame() {
    this.gameState = 'playing';
  }

  public returnToTitle() {
    this.gameState = 'title';
    this.physics.reset(0, 0.4, 0, 0);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);

    this.particles.dispose();
    this.tireTracks.dispose();
    this.renderer.dispose();
  }
}
