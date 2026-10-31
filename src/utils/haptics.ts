/**
 * Android Haptic Feedback Helper using Web Vibration API.
 * Provides subtle tactile rumble for mobile driving:
 * - Button presses
 * - Gear shifts
 * - Drifting tire snap
 * - High-speed crash impacts
 * - Nitro boost initiation
 */

class HapticsService {
  private enabled = true;

  constructor() {
    // Check if vibration is supported
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      this.enabled = false;
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) this.tap();
    return this.enabled;
  }

  public tap() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(12);
    } catch {
      // Ignore security errors
    }
  }

  public buttonPress() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(16);
    } catch {}
  }

  public gearShift() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate([10, 15, 10]);
    } catch {}
  }

  public driftSnap() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(28);
    } catch {}
  }

  public nitroBoost() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate([20, 20, 20]);
    } catch {}
  }

  public landing() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(35);
    } catch {}
  }

  public crash() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate([50, 30, 50]);
    } catch {}
  }
}

export const haptics = new HapticsService();
