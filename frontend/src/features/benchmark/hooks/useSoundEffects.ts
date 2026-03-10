import { useCallback, useRef } from "react";

const VOLUME = 0.25;

function createTone(freq: number, duration: number, type: OscillatorType = "sine", decay = true): () => void {
  return () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = VOLUME;
      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      osc.onended = () => ctx.close();
    } catch { /* audio not available */ }
  };
}

function createChord(freqs: number[], duration: number): () => void {
  return () => {
    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = VOLUME * 0.6;
      masterGain.connect(ctx.destination);

      for (const freq of freqs) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.3;
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }

      setTimeout(() => ctx.close(), duration * 1000 + 100);
    } catch { /* audio not available */ }
  };
}

function createArpeggio(freqs: number[], noteDuration: number): () => void {
  return () => {
    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = VOLUME * 0.7;
      masterGain.connect(ctx.destination);

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0;
        g.gain.setValueAtTime(0, ctx.currentTime + i * noteDuration);
        g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * noteDuration + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i + 1) * noteDuration);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + i * noteDuration);
        osc.stop(ctx.currentTime + (i + 1) * noteDuration + 0.1);
      });

      setTimeout(() => ctx.close(), (freqs.length * noteDuration + 0.5) * 1000);
    } catch { /* audio not available */ }
  };
}

export default function useSoundEffects() {
  const popFn = useRef(createTone(880, 0.12, "sine"));
  const whooshFn = useRef(createTone(440, 0.2, "triangle"));
  const cheerFn = useRef(createChord([523, 659, 784], 0.5));
  const completeFn = useRef(createChord([523, 659, 784, 1047], 0.8));
  const streakFn = useRef(createArpeggio([523, 659, 784, 1047, 1319], 0.1));

  const playPop = useCallback(() => popFn.current(), []);
  const playWhoosh = useCallback(() => whooshFn.current(), []);
  const playCheer = useCallback(() => cheerFn.current(), []);
  const playComplete = useCallback(() => completeFn.current(), []);
  const playStreak = useCallback(() => streakFn.current(), []);

  return { playPop, playWhoosh, playCheer, playComplete, playStreak };
}
