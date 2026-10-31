export type GameState = 'title' | 'playing' | 'paused';

export type CameraMode = 'chase' | 'hood' | 'bumper' | 'cinematic';

export type CarStyle = 'modern' | 'classic'; // Modern F90 look (image 1) vs Classic E39 look (image 2)

export type HandlingMode = 'vice_arcade' | 'realistic_drift' | 'stunt_master';

export type TouchControlMode = 'buttons' | 'joystick' | 'tilt';

export interface ControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
  horn: boolean;
  analogSteer?: number; // -1.0 to 1.0 for smooth joystick or gyro steering
  analogThrottle?: number; // 0 to 1.0
}

export interface CarTelemetry {
  speedKmh: number;
  speedMph: number;
  rpm: number;
  gear: number;
  isReversing: boolean;
  driftAngle: number;
  isDrifting: boolean;
  driftScore: number;
  driftCombo: number;
  nitroPercent: number;
  airtimeSeconds: number;
  highestJump: number;
  topSpeed: number;
  stuntLabel: string;
  headlightsOn: boolean;
  underglowOn: boolean;
  carPosition: { x: number; y: number; z: number };
  carRotationY: number;
}

export interface AudioSettings {
  masterMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  currentStation: number;
}
