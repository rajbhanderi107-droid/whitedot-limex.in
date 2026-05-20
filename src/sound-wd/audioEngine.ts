// White Dot LLP — Mineral Sound System: AudioPlayer singleton.
// One shared AudioContext, master volume 0.30, resumed inside a user gesture.
// Mute state persists to localStorage ("wd_audio", default "off").
// Removable via `npm run remove:sound:wd`.

import { playCue } from "./cues";
import type { CueName } from "./cues";

const STORAGE_KEY = "wd_audio";
const MASTER_VOLUME = 0.3;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = readStoredState();

function readStoredState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function persistState(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage unavailable — runtime state still applies for this session.
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
    masterGain = ctx.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export const audioEngine = {
  isEnabled(): boolean {
    return enabled;
  },

  setEnabled(on: boolean) {
    enabled = on;
    persistState(on);
    if (on) {
      // Warm up the context inside the toggle gesture so the first real cue
      // plays without latency on iOS Safari.
      ensureContext();
    }
  },

  toggle(): boolean {
    this.setEnabled(!enabled);
    return enabled;
  },

  play(cue: CueName) {
    if (!enabled) return;
    // navigator.userActivation: only sound after a genuine user interaction.
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    if (activation && !activation.hasBeenActive) return;

    const context = ensureContext();
    if (!context || !masterGain) return;
    if (context.state === "suspended") {
      void context.resume();
    }
    playCue(context, masterGain, cue);
  },
};
