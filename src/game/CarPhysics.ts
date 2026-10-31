import * as THREE from 'three';
import { ControlsState, CarTelemetry, HandlingMode } from '../types';

/**
 * Arcade-Sim Car Physics Engine inspired by GTA Vice City.
 * Features 6-speed transmission, realistic drift dynamics, suspension roll & pitch,
 * nitro boost, stunt detection, and collision handling.
 */

// Reusable math objects at module scope to ensure ZERO Garbage Collection in tick loop
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _velocityLocal = new THREE.Vector3();
const _tempVec = new THREE.Vector3();

export interface GroundQuery {
  height: number;
  normal: THREE.Vector3;
  surface: 'road' | 'grass' | 'ramp' | 'sand';
}

export class CarPhysics {
  // World transform
  public position = new THREE.Vector3(0, 0.4, 0);
  public velocity = new THREE.Vector3(0, 0, 0);
  public yaw = 0; // Heading in radians
  public pitch = 0;
  public roll = 0;
  public angularVelocity = 0;

  // Steering & wheels
  public steerAngle = 0;
  public wheelRotation = 0;
  public suspensionRoll = 0;
  public suspensionPitch = 0;

  // Transmission & Engine
  public speedKmh = 0;
  public speedMph = 0;
  public rpm = 900;
  public gear = 1;
  public isReversing = false;
  private shiftTimer = 0;
  private isShifting = false;

  // Drift dynamics
  public slipAngle = 0;
  public isDrifting = false;
  public driftScore = 0;
  public driftMultiplier = 1;
  public driftDuration = 0;
  public totalDriftPoints = 0;

  // Nitro
  public nitroPercent = 100;
  public isNitroActive = false;

  // Stunts & Airtime
  public isGrounded = true;
  public airtimeSeconds = 0;
  public highestJump = 0;
  public airRotation = 0;
  public stuntLabel = '';
  public topSpeed = 0;

  // Handling parameters
  public handlingMode: HandlingMode = 'vice_arcade';
  public enginePower = 880; // HP equivalent acceleration
  public topSpeedMax = 320; // km/h
  public mass = 1750; // kg
  public gravity = 22.0; // m/s² (snappy GTA-style gravity)

  // Callbacks
  public onGearShift?: (gear: number) => void;
  public onBackfire?: () => void;
  public onCrash?: (impactSpeed: number) => void;
  public onLanding?: (impact: number) => void;

  // Ground check function supplied by CityWorld
  public groundHeightFn: (x: number, z: number) => GroundQuery = () => ({
    height: 0,
    normal: new THREE.Vector3(0, 1, 0),
    surface: 'road',
  });

  // Collision obstacles check
  public collisionCheckFn: (x: number, z: number, radius: number) => { collided: boolean; normalX: number; normalZ: number; pushDist: number } | null = () => null;

  constructor() {
    this.reset(0, 0.4, 0, 0);
  }

  public reset(x = 0, y = 0.4, z = 0, yaw = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.roll = 0;
    this.angularVelocity = 0;
    this.steerAngle = 0;
    this.wheelRotation = 0;
    this.suspensionRoll = 0;
    this.suspensionPitch = 0;
    this.speedKmh = 0;
    this.rpm = 900;
    this.gear = 1;
    this.isReversing = false;
    this.isDrifting = false;
    this.driftScore = 0;
    this.driftMultiplier = 1;
    this.airtimeSeconds = 0;
    this.stuntLabel = '';
    this.isGrounded = true;
  }

  public update(dt: number, controls: ControlsState) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Heading directions
    _forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    _right.set(_forward.z, 0, -_forward.x); // Perpendicular

    // Decompose velocity into longitudinal (forward/back) and lateral (sideways)
    const forwardSpeed = this.velocity.dot(_forward);
    const lateralSpeed = this.velocity.dot(_right);
    this.speedKmh = Math.abs(forwardSpeed) * 3.6;
    this.speedMph = this.speedKmh * 0.621371;
    if (this.speedKmh > this.topSpeed) this.topSpeed = this.speedKmh;

    // 2. Steering input (handles digital buttons, analog joystick, and gyro tilt)
    const maxSteer = Math.max(0.65 - (this.speedKmh / 260) * 0.45, 0.2); // Speed-sensitive steering
    let targetSteer = 0;
    if (controls.analogSteer !== undefined && Math.abs(controls.analogSteer) > 0.01) {
      targetSteer = controls.analogSteer * maxSteer;
    } else {
      if (controls.left) targetSteer += maxSteer;
      if (controls.right) targetSteer -= maxSteer;
    }

    // Smooth steering wheel return
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 16, clampedDt);

    // 3. Ground detection & elevation
    const ground = this.groundHeightFn(this.position.x, this.position.z);
    const carBottomY = this.position.y;
    const distanceToGround = carBottomY - ground.height;

    const wasGrounded = this.isGrounded;
    this.isGrounded = distanceToGround <= 0.15;

    // Airtime / Stunt tracking
    if (!this.isGrounded) {
      this.airtimeSeconds += clampedDt;
      this.airRotation += Math.abs(this.angularVelocity) * clampedDt;

      if (this.airtimeSeconds > 0.8) {
        if (this.airRotation > Math.PI * 1.8) {
          this.stuntLabel = 'INSANE 360 SPIN! +1000';
        } else {
          this.stuntLabel = `BIG AIR: ${this.airtimeSeconds.toFixed(1)}s!`;
        }
      }
      if (this.position.y > this.highestJump) {
        this.highestJump = this.position.y;
      }
    } else {
      if (!wasGrounded && this.airtimeSeconds > 0.4) {
        // Landing event
        const verticalImpact = Math.abs(this.velocity.y);
        if (this.onLanding && verticalImpact > 2.0) {
          this.onLanding(verticalImpact);
        }
        this.suspensionPitch = -Math.min(verticalImpact * 0.05, 0.25);
      }
      this.airtimeSeconds = 0;
      this.airRotation = 0;
    }

    // 4. Nitro Boost
    this.isNitroActive = controls.nitro && this.nitroPercent > 1.0;
    let nitroForce = 0;
    if (this.isNitroActive) {
      nitroForce = 22.0;
      this.nitroPercent = Math.max(0, this.nitroPercent - 28.0 * clampedDt);
    } else {
      // Regenerate nitro slowly
      this.nitroPercent = Math.min(100, this.nitroPercent + 4.0 * clampedDt);
    }

    // 5. Powertrain: Throttle & Braking
    let driveForce = 0;
    let brakeForce = 0;
    const isThrottle = controls.forward;
    const isBraking = controls.backward;
    const isHandbrake = controls.handbrake;

    if (this.isGrounded) {
      if (isThrottle) {
        if (forwardSpeed < -0.5) {
          // Braking while going in reverse
          brakeForce = 28.0;
        } else {
          this.isReversing = false;
          // Power curve scaled with gear
          const gearMultiplier = [1.2, 1.0, 0.85, 0.72, 0.6, 0.5][this.gear - 1] || 0.5;
          const powerFactor = Math.max(0, 1 - this.speedKmh / this.topSpeedMax);
          driveForce = (26.0 * gearMultiplier * powerFactor) + nitroForce;
        }
      } else if (isBraking) {
        if (forwardSpeed > 0.8) {
          // Regular foot braking
          brakeForce = 34.0;
        } else {
          // Reverse drive
          this.isReversing = true;
          driveForce = -15.0;
        }
      }

      if (isHandbrake) {
        brakeForce = Math.max(brakeForce, 45.0);
      }
    }

    // 6. Gear & RPM Calculation
    this.updateGears(forwardSpeed, isThrottle, clampedDt);

    // 7. Lateral Grip, Friction & Drift Physics
    let lateralGrip = 8.5; // Base high-speed cornering grip
    if (this.handlingMode === 'realistic_drift') lateralGrip = 7.0;

    // Handbrake breaks rear traction instantly!
    if (isHandbrake) {
      lateralGrip = 1.8;
    } else if (controls.forward && isHandbrake) {
      // Burnout / Donut mode
      lateralGrip = 0.8;
    }

    // Calculate slip angle (difference between heading and travel vector)
    const totalSpeed = this.velocity.length();
    if (totalSpeed > 2.0) {
      this.slipAngle = Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed));
      this.isDrifting = this.isGrounded && this.slipAngle > 0.22 && this.speedKmh > 25;
    } else {
      this.slipAngle = 0;
      this.isDrifting = false;
    }

    // Drift scoring
    if (this.isDrifting) {
      this.driftDuration += clampedDt;
      const angleScore = Math.floor(this.slipAngle * (this.speedKmh / 15) * 50);
      this.driftScore += angleScore;
      this.driftMultiplier = Math.min(5, 1 + Math.floor(this.driftDuration / 1.5));
      this.totalDriftPoints += angleScore * this.driftMultiplier;
      // Drifting earns nitro!
      this.nitroPercent = Math.min(100, this.nitroPercent + 8.0 * clampedDt);
    } else {
      if (this.driftScore > 0) {
        this.driftScore = 0;
        this.driftMultiplier = 1;
        this.driftDuration = 0;
      }
    }

    // 8. Dynamic Acceleration & Yaw integration
    if (this.isGrounded) {
      // Drive acceleration along car forward vector
      const accelMag = driveForce - (brakeForce * Math.sign(forwardSpeed));
      this.velocity.addScaledVector(_forward, accelMag * clampedDt);

      // Tire lateral friction counteracts sideways sliding
      const lateralCorrection = -lateralSpeed * lateralGrip * clampedDt;
      this.velocity.addScaledVector(_right, lateralCorrection);

      // Aerodynamic rolling resistance & air drag
      const dragMag = (0.35 + (this.speedKmh * this.speedKmh) * 0.00008) * clampedDt;
      this.velocity.multiplyScalar(Math.max(0, 1 - dragMag));

      // Turning / Yaw rotation (Ackermann-like yaw rate)
      const turnSpeedFactor = Math.min(Math.abs(forwardSpeed) / 12, 1.0);
      let steerTorque = this.steerAngle * 2.8 * turnSpeedFactor * Math.sign(forwardSpeed);

      // Handbrake drift oversteer assist (snap the rear out!)
      if (isHandbrake && Math.abs(this.steerAngle) > 0.1 && this.speedKmh > 20) {
        steerTorque += Math.sign(this.steerAngle) * 2.4;
      }

      this.angularVelocity = THREE.MathUtils.damp(this.angularVelocity, steerTorque, 12, clampedDt);
      this.yaw += this.angularVelocity * clampedDt;

      // Stick flush to ground elevation with smooth suspension spring
      const targetY = ground.height + 0.38;
      this.position.y = THREE.MathUtils.damp(this.position.y, targetY, 20, clampedDt);
      this.velocity.y = 0;
    } else {
      // In air: apply gravity and air drag
      this.velocity.y -= this.gravity * clampedDt;
      this.yaw += this.angularVelocity * clampedDt * 0.7;
    }

    // 9. Update position
    this.position.addScaledVector(this.velocity, clampedDt);

    // 10. City Obstacle & Barrier Collisions
    const collision = this.collisionCheckFn(this.position.x, this.position.z, 1.25);
    if (collision && collision.collided) {
      // Push car back out of wall
      this.position.x += collision.normalX * collision.pushDist;
      this.position.z += collision.normalZ * collision.pushDist;

      // Reflect velocity vector with restitution
      _tempVec.set(collision.normalX, 0, collision.normalZ).normalize();
      const impactSpeed = this.velocity.dot(_tempVec);
      if (impactSpeed < 0) {
        this.velocity.addScaledVector(_tempVec, -impactSpeed * 1.4);
        if (this.onCrash && Math.abs(impactSpeed) * 3.6 > 15) {
          this.onCrash(Math.abs(impactSpeed) * 3.6);
        }
        // Crash cancels current drift combo
        this.driftScore = 0;
        this.driftMultiplier = 1;
      }
    }

    // 11. Suspension Roll and Pitch calculation
    const lateralAcc = lateralSpeed * 1.8;
    this.suspensionRoll = THREE.MathUtils.damp(this.suspensionRoll, -lateralAcc * 0.05, 12, clampedDt);
    const accelDecel = (driveForce - brakeForce) * 0.008;
    this.suspensionPitch = THREE.MathUtils.damp(this.suspensionPitch, accelDecel, 10, clampedDt);

    // 12. Wheel spinning around axle
    const wheelCircumference = 2 * Math.PI * 0.35; // ~2.2 meters per rotation
    const distanceTravelled = forwardSpeed * clampedDt;
    this.wheelRotation += distanceTravelled / (wheelCircumference / (2 * Math.PI));
  }

  private updateGears(forwardSpeed: number, isThrottle: boolean, dt: number) {
    if (this.isReversing) {
      this.gear = -1;
      this.rpm = 900 + Math.min(Math.abs(this.speedKmh) / 45, 1.0) * 4500;
      return;
    }

    // Gear shift thresholds in km/h
    const gearLimits = [52, 94, 142, 192, 245, 330];
    const prevGear = this.gear;

    if (this.isShifting) {
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        this.isShifting = false;
      }
      return;
    }

    // Auto upshift
    if (this.gear < 6 && this.speedKmh > gearLimits[this.gear - 1]) {
      this.gear++;
      this.isShifting = true;
      this.shiftTimer = 0.12;
      if (this.onGearShift) this.onGearShift(this.gear);
      if (this.onBackfire && Math.random() > 0.4) this.onBackfire();
    }
    // Auto downshift
    else if (this.gear > 1 && this.speedKmh < gearLimits[this.gear - 2] * 0.8) {
      this.gear--;
      this.isShifting = true;
      this.shiftTimer = 0.08;
      if (this.onGearShift) this.onGearShift(this.gear);
    }

    // Compute RPM curve for current gear
    const minSpeedForGear = this.gear === 1 ? 0 : gearLimits[this.gear - 2] * 0.75;
    const maxSpeedForGear = gearLimits[this.gear - 1];
    const gearSpan = Math.max(maxSpeedForGear - minSpeedForGear, 10);
    const speedInGear = Math.max(0, this.speedKmh - minSpeedForGear);
    const gearProgress = Math.min(speedInGear / gearSpan, 1.0);

    const idleRpm = 850;
    const redlineRpm = 7200;
    const targetRpm = idleRpm + gearProgress * (redlineRpm - idleRpm);

    this.rpm = THREE.MathUtils.damp(this.rpm, isThrottle ? targetRpm : Math.max(targetRpm * 0.8, idleRpm), 16, dt);
  }

  public getTelemetry(headlightsOn: boolean, underglowOn: boolean): CarTelemetry {
    return {
      speedKmh: Math.round(this.speedKmh),
      speedMph: Math.round(this.speedMph),
      rpm: Math.round(this.rpm),
      gear: this.gear,
      isReversing: this.isReversing,
      driftAngle: Math.round(this.slipAngle * (180 / Math.PI)),
      isDrifting: this.isDrifting,
      driftScore: this.driftScore,
      driftCombo: this.driftMultiplier,
      nitroPercent: Math.round(this.nitroPercent),
      airtimeSeconds: Number(this.airtimeSeconds.toFixed(1)),
      highestJump: Math.round(this.highestJump),
      topSpeed: Math.round(this.topSpeed),
      stuntLabel: this.stuntLabel,
      headlightsOn,
      underglowOn,
      carPosition: { x: this.position.x, y: this.position.y, z: this.position.z },
      carRotationY: this.yaw,
    };
  }
}
