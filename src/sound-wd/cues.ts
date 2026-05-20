// White Dot LLP — Mineral Sound System: procedural cue generators.
// Sound is built from filtered-noise modal resonance (a short noise burst
// exciting high-Q resonant filters) — the timbre of a struck stone, NOT an
// oscillator. No synth waveforms, no beeps, per brand rules.
// Removable via `npm run remove:sound:wd`.

export type CueName = "stoneTap" | "settle" | "confirmation" | "continuity";

function noiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// A single struck-stone resonance: noise burst → stacked resonant bandpass
// filters tuned to inharmonic partials (mineral character) → gain envelope.
function struck(
  ctx: AudioContext,
  destination: AudioNode,
  freq: number,
  start: number,
  duration: number,
  amp: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, duration);

  // Inharmonic partial ratios give a stone/marimba-like body, not a pure tone.
  const partials = [1, 2.76, 5.4];
  const partialGain = [1, 0.42, 0.2];

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(amp, start + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  envelope.connect(destination);

  partials.forEach((ratio, index) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq * ratio;
    filter.Q.value = 9 + index * 3;
    const gain = ctx.createGain();
    gain.gain.value = partialGain[index];
    source.connect(filter).connect(gain).connect(envelope);
  });

  source.start(start);
  source.stop(start + duration + 0.02);
}

// A dry granular tick: short band-limited noise burst with fast decay.
function tick(
  ctx: AudioContext,
  destination: AudioNode,
  centerFreq: number,
  start: number,
  duration: number,
  amp: number,
  q = 4,
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = centerFreq;
  filter.Q.value = q;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(amp, start + 0.003);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(envelope).connect(destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

const NOTE = {
  C5: 523.25,
  G5: 783.99,
  A3: 220.0,
  GsharP3: 207.65,
};

export function playCue(ctx: AudioContext, destination: AudioNode, cue: CueName) {
  const now = ctx.currentTime;

  switch (cue) {
    case "stoneTap": {
      // 70ms pebble tick, ±2 semitone random pitch.
      const semitones = Math.random() * 4 - 2;
      const center = 2200 * Math.pow(2, semitones / 12);
      tick(ctx, destination, center, now, 0.07, 0.85);
      break;
    }
    case "settle": {
      // 180ms granular settle, no reverb — two soft low grains.
      tick(ctx, destination, 900, now, 0.12, 0.5, 2.5);
      tick(ctx, destination, 620, now + 0.05, 0.13, 0.4, 2.5);
      break;
    }
    case "confirmation": {
      // 450ms tuned-stone rising interval C5 → G5. The signature sound.
      struck(ctx, destination, NOTE.C5, now, 0.26, 0.7);
      struck(ctx, destination, NOTE.G5, now + 0.14, 0.32, 0.8);
      break;
    }
    case "continuity": {
      // 300ms warm descending half-step, lower register.
      struck(ctx, destination, NOTE.A3, now, 0.18, 0.6);
      struck(ctx, destination, NOTE.GsharP3, now + 0.1, 0.2, 0.6);
      break;
    }
    default:
      break;
  }
}
