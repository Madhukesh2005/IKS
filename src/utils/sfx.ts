const STORAGE_KEY = 'ganita-sfx';
let audioContext: AudioContext | null = null;
let lastHoverAt = 0;

export function isSfxEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Audio remains usable if browser storage is unavailable.
  }
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined);
  return audioContext;
}

function tone(
  frequency: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
  delay = 0,
) {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + Math.min(0.003, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.005);
  } catch {
    // Audio is decorative; unsupported or blocked audio must not break UI actions.
  }
}

export function playClick() {
  tone(1200, 0.014, 0.035, 'sine', 320);
}

export function playHoverTick() {
  const now = typeof performance === 'undefined' ? Date.now() : performance.now();
  if (now - lastHoverAt < 45) return;
  lastHoverAt = now;
  tone(2400, 0.008, 0.025);
}

export function playSolveChime() {
  tone(587, 0.16, 0.035);
  tone(880, 0.16, 0.03, 'sine', 880, 0.07);
}

export function playSuccess() {
  tone(523, 0.13, 0.045);
  tone(784, 0.17, 0.04, 'sine', 784, 0.07);
}

export function playError() {
  tone(190, 0.09, 0.045, 'triangle');
  tone(140, 0.11, 0.035, 'triangle', 140, 0.12);
}

export function playToggle(enabled: boolean) {
  tone(enabled ? 900 : 1200, 0.055, 0.035, 'sine', enabled ? 1400 : 700);
}
