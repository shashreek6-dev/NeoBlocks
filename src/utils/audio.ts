// Web Audio API Synth Effects for Arcade retro style

let audioCtx: AudioContext | null = null;
let soundVolume = 0.25;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setVolume(val: number) {
  soundVolume = Math.max(0, Math.min(1, val));
}

export function playSelectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Play a short rising chime
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(soundVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
}

export function playPlaceSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Woody, punchy pop sound using standard triangle oscillator
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(soundVolume * 1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
}

export function playClearSound(linesClearedCount: number = 1) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Scale pitch based on lines cleared count (pitch shift upward for combos)
    const pitchFactor = 1 + (linesClearedCount - 1) * 0.15;
    const baseNotes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const notes = baseNotes.map(f => f * pitchFactor);
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      const startTime = now + (idx * 0.06);
      
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.setValueAtTime(freq * 1.01, startTime + 0.12);
      
      gain.gain.setValueAtTime(0, now);
      // Boost gain slightly for combos
      const volumeScale = linesClearedCount > 1 ? 1.4 : 1.0;
      gain.gain.setValueAtTime(soundVolume * volumeScale, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
}

export function playGameOverSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Sad, descending minor scale beep
    const notes = [440.0, 415.3, 392.0, 349.2, 311.1]; // A, G#, G, F, D#
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      const startTime = now + (idx * 0.1);
      
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(soundVolume * 0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
}

export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play an energetic, uplifting chord arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      const startTime = now + (idx * 0.08);
      
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, startTime + 0.25);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(soundVolume * 1.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
}

