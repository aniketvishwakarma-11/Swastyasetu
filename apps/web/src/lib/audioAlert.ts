/**
 * Clinical Web Audio API synthesizer for emergency referral alerts.
 * Synthesizes crisp, professional hospital-grade alert chimes directly in the browser.
 * Zero external audio files required — immune to network lag or 404 missing asset errors.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const isEmergencyAudioEnabled = (): boolean => {
  try {
    return localStorage.getItem('swasthya_emergency_sound_enabled') !== 'false';
  } catch {
    return true;
  }
};

export const setEmergencyAudioEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem('swasthya_emergency_sound_enabled', enabled ? 'true' : 'false');
  } catch {}
};

/**
 * Plays a distinct two-tone clinical chime (D5 -> A5)
 * Cadence: 587.33 Hz (120ms) -> 880.00 Hz (280ms)
 */
export function playEmergencyAlertSound(): void {
  if (!isEmergencyAudioEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Tone 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.15);
    gain2.gain.setValueAtTime(0.001, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('[AudioAlert] Web Audio play prevented or not supported:', err);
  }
}
