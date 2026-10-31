/**
 * 100% Procedural Web Audio Engine for Vice City Cruiser.
 * Simulates high-rev twin-turbo V8 sports car engine, tire drift screech,
 * turbo blow-off flutter, nitro, horn, collisions, and 4 authentic 80s Vice City synthwave radio stations.
 */

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine audio nodes
  private engineRunning = false;
  private oscBase: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscHigh: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire screech nodes
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechNoise: AudioBufferSourceNode | null = null;

  // Nitro nodes
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;

  // Horn
  private hornGain: GainNode | null = null;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;

  // Radio
  private currentStationIndex = 0;
  private radioInterval: number | null = null;
  private radioStep = 0;
  public static readonly STATIONS = [
    { name: 'Flash FM', genre: '80s Synthpop / Electro', bpm: 120 },
    { name: 'Wave 103', genre: 'Dark Outrun / New Wave', bpm: 126 },
    { name: 'Emotion 98.3', genre: 'Lush Sunset Synth Ballad', bpm: 104 },
    { name: 'V-Rock 105.7', genre: '80s Drive Synth Rock', bpm: 132 },
    { name: 'Radio Off', genre: 'Muted', bpm: 0 },
  ];

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngine();
      this.setupScreech();
      this.setupNitro();
      this.startRadio();
    } catch {
      // AudioContext blocked or unsupported
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngine() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // Wave shaper for roaring sports exhaust growl
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(20);
    distortion.oversample = '2x';

    // Base cylinder oscillator
    this.oscBase = this.ctx.createOscillator();
    this.oscBase.type = 'sawtooth';
    this.oscBase.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Sub rumble oscillator
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    // High harmonic buzz
    this.oscHigh = this.ctx.createOscillator();
    this.oscHigh.type = 'sawtooth';
    this.oscHigh.frequency.setValueAtTime(90, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

    const highGain = this.ctx.createGain();
    highGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.oscBase.connect(distortion);
    this.oscSub.connect(subGain);
    subGain.connect(distortion);
    this.oscHigh.connect(highGain);
    highGain.connect(distortion);

    distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    // Turbo spool whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(900, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.sfxGain);

    this.oscBase.start();
    this.oscSub.start();
    this.oscHigh.start();
    this.turboOsc.start();
    this.engineRunning = true;
  }

  private setupScreech() {
    if (!this.ctx || !this.sfxGain) return;

    // Screech noise buffer (looped white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.screechNoise = this.ctx.createBufferSource();
    this.screechNoise.buffer = noiseBuffer;
    this.screechNoise.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.screechNoise.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxGain);

    this.screechNoise.start();
  }

  private setupNitro() {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.nitroNoise = this.ctx.createBufferSource();
    this.nitroNoise.buffer = noiseBuffer;
    this.nitroNoise.loop = true;

    const nitroFilter = this.ctx.createBiquadFilter();
    nitroFilter.type = 'lowpass';
    nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.nitroNoise.connect(nitroFilter);
    nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    this.nitroNoise.start();
  }

  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Update engine sound based on real car telemetry
   */
  public updateEngine(rpm: number, throttle: number, speedKmh: number, isNitro: boolean) {
    if (!this.ctx || !this.engineGain || !this.oscBase || !this.oscSub || !this.oscHigh || !this.engineFilter || !this.turboOsc || !this.turboGain) return;

    const now = this.ctx.currentTime;
    // Map RPM (800 to 7500) to base frequency (35Hz to 160Hz)
    const normRpm = Math.min(Math.max((rpm - 800) / (7500 - 800), 0), 1);
    const baseFreq = 35 + normRpm * 130;

    this.oscBase.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
    this.oscHigh.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.05);

    // Filter opens up as throttle and RPM increase
    const filterFreq = 350 + normRpm * 2200 + (throttle > 0 ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

    // Engine volume
    const targetGain = 0.2 + normRpm * 0.35 + (throttle > 0 ? 0.2 : 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.06);

    // Turbo spool sound
    const turboFreq = 800 + normRpm * 2800;
    this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.08);
    const turboVol = (throttle > 0.3 && speedKmh > 20) ? Math.min((speedKmh / 160) * 0.12, 0.12) : 0.0001;
    this.turboGain.gain.setTargetAtTime(turboVol, now, 0.08);

    // Nitro sound
    if (this.nitroGain) {
      this.nitroGain.gain.setTargetAtTime(isNitro ? 0.35 : 0.0001, now, 0.05);
    }
  }

  /**
   * Blow-off valve flutter ("pssshh-chu-chu") on gear shifts / throttle cuts
   */
  public playBlowOff() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.35, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(now);
  }

  /**
   * Exhaust backfire pop on aggressive shifts
   */
  public playBackfirePop() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Modulate tire screech when drifting or braking hard
   */
  public updateTireScreech(slipIntensity: number, speedKmh: number) {
    if (!this.ctx || !this.screechGain || !this.screechFilter) return;
    const now = this.ctx.currentTime;

    if (slipIntensity > 0.15 && speedKmh > 10) {
      const vol = Math.min(slipIntensity * 0.45, 0.45);
      const freq = 900 + slipIntensity * 900;
      this.screechGain.gain.setTargetAtTime(vol, now, 0.04);
      this.screechFilter.frequency.setTargetAtTime(freq, now, 0.05);
    } else {
      this.screechGain.gain.setTargetAtTime(0.0001, now, 0.06);
    }
  }

  /**
   * Crash collision sound
   */
  public playCrash(impactSpeed: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const intensity = Math.min(impactSpeed / 60, 1.0);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Crunch noise
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(intensity * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
    noise.start(now);
  }

  /**
   * Stunt jump landing thud
   */
  public playLanding(impact: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(impact * 0.35, 0.4), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Dual-tone 80s car horn
   */
  public setHorn(active: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (active) {
      if (!this.hornGain) {
        this.hornGain = this.ctx.createGain();
        this.hornGain.gain.setValueAtTime(0.001, now);
        this.hornGain.connect(this.sfxGain);

        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc1.type = 'sawtooth';
        this.hornOsc1.frequency.setValueAtTime(430, now); // F4 approx

        this.hornOsc2 = this.ctx.createOscillator();
        this.hornOsc2.type = 'sawtooth';
        this.hornOsc2.frequency.setValueAtTime(340, now); // F3/A3 blend

        this.hornOsc1.connect(this.hornGain);
        this.hornOsc2.connect(this.hornGain);
        this.hornOsc1.start();
        this.hornOsc2.start();
      }
      this.hornGain.gain.setTargetAtTime(0.35, now, 0.02);
    } else if (this.hornGain) {
      this.hornGain.gain.setTargetAtTime(0.0001, now, 0.03);
    }
  }

  /**
   * Procedural 80s Synthwave Radio Player
   */
  private startRadio() {
    if (this.radioInterval) clearInterval(this.radioInterval);
    const stepDuration = 125; // 120-130 BPM 16th notes
    this.radioInterval = window.setInterval(() => {
      this.tickRadioBeat();
    }, stepDuration);
  }

  private tickRadioBeat() {
    if (!this.ctx || !this.musicGain || this.currentStationIndex === 4 || this.isMuted) return;

    this.radioStep = (this.radioStep + 1) % 32;
    const step = this.radioStep;
    const now = this.ctx.currentTime;

    // Station chords & bass notes
    switch (this.currentStationIndex) {
      case 0: // Flash FM - Upbeat electro synthpop (Am - F - C - G)
        this.playFlashFMStep(step, now);
        break;
      case 1: // Wave 103 - Dark Outrun (Dm - Bb - C - Dm)
        this.playWave103Step(step, now);
        break;
      case 2: // Emotion 98.3 - Lush Sunset Synth (Fmaj7 - Em7 - Dm7 - C)
        this.playEmotionStep(step, now);
        break;
      case 3: // V-Rock 105.7 - 80s Synth Rock (E - G - A - B)
        this.playVRockStep(step, now);
        break;
    }
  }

  private playTone(freq: number, type: OscillatorType, dur: number, vol: number, filterFreq = 1800, time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private playDrum(type: 'kick' | 'snare' | 'hihat', time: number) {
    if (!this.ctx || !this.musicGain) return;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.18);
    } else if (type === 'snare') {
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      src.connect(gain);
      gain.connect(this.musicGain);
      src.start(time);
    } else if (type === 'hihat') {
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      src.start(time);
    }
  }

  private playFlashFMStep(step: number, now: number) {
    // 4 on floor kick
    if (step % 4 === 0) this.playDrum('kick', now);
    if (step % 8 === 4) this.playDrum('snare', now);
    if (step % 2 === 0) this.playDrum('hihat', now);

    // Funky bassline: Am (55Hz), F (43.6Hz), C (65.4Hz), G (49Hz)
    const chords = [110, 87.3, 130.8, 98];
    const chordIdx = Math.floor(step / 8);
    const root = chords[chordIdx];

    if (step % 2 === 0) {
      const oct = (step % 4 === 2) ? 1.5 : 1.0;
      this.playTone(root * oct, 'sawtooth', 0.18, 0.28, 900, now);
    }

    // Bright 80s lead synth arpeggio
    const arpNotes = [440, 523.25, 659.25, 783.99, 880];
    const note = arpNotes[step % arpNotes.length];
    if (step % 2 === 1) {
      this.playTone(note, 'square', 0.12, 0.08, 2200, now);
    }
  }

  private playWave103Step(step: number, now: number) {
    // Outrun electro beat
    if (step % 4 === 0) this.playDrum('kick', now);
    if (step % 8 === 4) this.playDrum('snare', now);
    this.playDrum('hihat', now);

    // Rolling 16th bass in D minor
    const dmRoots = [73.42, 58.27, 65.41, 73.42]; // D, Bb, C, D
    const root = dmRoots[Math.floor(step / 8)];
    const octave = step % 4 === 1 || step % 4 === 3 ? 2 : 1;
    this.playTone(root * octave, 'sawtooth', 0.11, 0.25, 750, now);

    // Retro poly synth chords
    if (step % 8 === 0) {
      this.playTone(root * 4, 'sawtooth', 0.5, 0.12, 1400, now);
      this.playTone(root * 4 * 1.2, 'sawtooth', 0.5, 0.1, 1400, now);
      this.playTone(root * 4 * 1.5, 'sawtooth', 0.5, 0.1, 1400, now);
    }
  }

  private playEmotionStep(step: number, now: number) {
    // Slow smooth sunset ballad
    if (step % 8 === 0) this.playDrum('kick', now);
    if (step % 16 === 8) this.playDrum('snare', now);
    if (step % 4 === 2) this.playDrum('hihat', now);

    // Warm Rhodes/synth chords: Fmaj7 (87.3) -> Em7 (82.4) -> Dm7 (73.4) -> C (65.4)
    const roots = [87.3, 82.4, 73.4, 65.4];
    const root = roots[Math.floor(step / 8)];
    if (step % 4 === 0) {
      this.playTone(root, 'triangle', 0.35, 0.3, 500, now);
      this.playTone(root * 3, 'sine', 0.45, 0.15, 1200, now);
      this.playTone(root * 3.6, 'sine', 0.45, 0.12, 1200, now);
    }
  }

  private playVRockStep(step: number, now: number) {
    // Punchy drive rock
    if (step % 4 === 0) this.playDrum('kick', now);
    if (step % 8 === 4) this.playDrum('snare', now);
    this.playDrum('hihat', now);

    // Heavy guitar-like distorted synth riff: E (82.4Hz), G (98Hz), A (110Hz), B (123.5Hz)
    const notes = [82.4, 82.4, 98, 110, 82.4, 123.5, 110, 98];
    const note = notes[step % notes.length];
    this.playTone(note, 'sawtooth', 0.14, 0.32, 2800, now);
    this.playTone(note * 1.5, 'sawtooth', 0.14, 0.22, 2800, now); // Fifth chord
  }

  /**
   * Switch radio station with realistic analog radio static burst
   */
  public nextStation(): number {
    this.currentStationIndex = (this.currentStationIndex + 1) % SoundSystem.STATIONS.length;
    this.playStaticBurst();
    return this.currentStationIndex;
  }

  public prevStation(): number {
    this.currentStationIndex = (this.currentStationIndex - 1 + SoundSystem.STATIONS.length) % SoundSystem.STATIONS.length;
    this.playStaticBurst();
    return this.currentStationIndex;
  }

  public setStation(index: number) {
    if (index >= 0 && index < SoundSystem.STATIONS.length) {
      this.currentStationIndex = index;
      this.playStaticBurst();
    }
  }

  public getCurrentStation() {
    return SoundSystem.STATIONS[this.currentStationIndex];
  }

  public getCurrentStationIndex() {
    return this.currentStationIndex;
  }

  private playStaticBurst() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.16, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(music: number, sfx: number) {
    if (!this.ctx) return;
    if (this.musicGain) this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
  }

  public dispose() {
    if (this.radioInterval) clearInterval(this.radioInterval);
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const soundEngine = new SoundSystem();
