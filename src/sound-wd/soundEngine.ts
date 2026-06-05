// White Dot LLP — Mineral Sound System: procedural Web Audio API synthesizer.
// Synthesizes high-end industrial/organic sounds completely in code:
//   - stone-tap: short, sharp bandpass-filtered mineral transient.
//   - settle: low, warm, deep dual-oscillator resonant background hum.
//   - confirmation: ascending clean harmonic crystal ring chime.
//   - continuity: soft warning hum for offline connectivity changes.
//
// Respects the VITE_WD_AUDIO_ENABLED master env flag.
// Default MUTED by browser policy and client spec (unmutes via footer toggle).
// Removable via `npm run remove:assistant:wd` or similar.

const AUDIO_ENABLED = import.meta.env.VITE_WD_AUDIO_ENABLED !== "false";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!AUDIO_ENABLED) return null;
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

export type SoundCue = "stone-tap" | "settle" | "confirmation" | "continuity";

// Read persisted mute state from localStorage. Default is muted (true) unless explicitly set to "unmuted".
let globalMuted = true;
try {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("wd_audio");
    globalMuted = saved !== "unmuted";
  }
} catch {
  // Ignore localStorage errors
}

const listeners = new Set<(muted: boolean) => void>();

export const soundEngine = {
  isMuted(): boolean {
    return globalMuted;
  },

  setMuted(muted: boolean) {
    globalMuted = muted;
    try {
      localStorage.setItem("wd_audio", muted ? "muted" : "unmuted");
    } catch {
      // Ignore
    }
    listeners.forEach((l) => l(muted));

    // Warm up/resume AudioContext on user action
    if (!muted) {
      getAudioContext();
    }
  },

  toggleMute(): boolean {
    const nextMuted = !globalMuted;
    this.setMuted(nextMuted);
    return nextMuted;
  },

  subscribe(callback: (muted: boolean) => void) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  play(cue: SoundCue) {
    if (globalMuted || !AUDIO_ENABLED) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    // Safety check for suspended context
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    try {
      switch (cue) {
        case "stone-tap":
          playStoneTap(ctx);
          break;
        case "settle":
          playSettle(ctx);
          break;
        case "confirmation":
          playConfirmation(ctx);
          break;
        case "continuity":
          playContinuity(ctx);
          break;
      }
    } catch {
      // Fail silently to never crash UI on audio thread blockages
    }
  },
};

/**
 * 1. Stone Tap: Sharp mineral transient
 * Combines a bandpass-filtered short sine wave with a burst of filtered white noise
 * for the limestone "contact" click.
 */
function playStoneTap(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Master output gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0, now);
  masterGain.gain.linearRampToValueAtTime(0.3, now + 0.002);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  // Bandpass filter for the stone tone
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(12, now);

  // Primary tone oscillator
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1380, now);
  // Pitch decay for organic tap signature
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);

  // Transient noise buffer for the click
  const noiseSize = ctx.sampleRate * 0.015; // 15ms buffer
  const buffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(2000, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

  // Wires
  osc.connect(filter);
  filter.connect(masterGain);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  masterGain.connect(ctx.destination);

  // Start/Stop
  osc.start(now);
  osc.stop(now + 0.1);
  noise.start(now);
  noise.stop(now + 0.02);
}

/**
 * 2. Settle: Deep, atmospheric dual-oscillator hum
 * Slow attack and decay lowpass-filtered rumble. Represents background settle.
 */
function playSettle(ctx: AudioContext) {
  const now = ctx.currentTime;
  const duration = 1.2;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0, now);
  // Slow elegant attack
  masterGain.gain.linearRampToValueAtTime(0.26, now + 0.35);
  masterGain.gain.setValueAtTime(0.26, now + 0.5);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(110, now);
  filter.frequency.exponentialRampToValueAtTime(70, now + duration);

  // Beating oscillators
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(76, now);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(77.5, now); // slightly detuned for chorus warmth

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * 3. Confirmation: Ascending crystal chime
 * Clean dual-harmonic C5 -> E5 chime with highpass and delay ring out.
 */
function playConfirmation(ctx: AudioContext) {
  const now = ctx.currentTime;

  const playNote = (freq: number, startTime: number, vol: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(450, startTime);

    osc.connect(hpFilter);
    hpFilter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.7);
  };

  // C5 note (523.25 Hz)
  playNote(523.25, now, 0.22);
  // E5 note (659.25 Hz) 120ms later
  playNote(659.25, now + 0.12, 0.22);
}

/**
 * 4. Continuity: Soft warning connection warning chime
 * Gentle alternate low tones.
 */
function playContinuity(ctx: AudioContext) {
  const now = ctx.currentTime;
  const duration = 1.0;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0, now);
  masterGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(240, now);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now); // A3
  osc.frequency.linearRampToValueAtTime(164.81, now + duration); // glide to E3

  osc.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
