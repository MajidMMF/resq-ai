/**
 * Premium Web Audio API notification sounds
 * Produces crisp, beautiful bell/chime confirmation sounds
 * (similar to Uber ride confirmed or Apple Pay success chime)
 * Works without external MP3 asset downloads.
 */

let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Beautiful two-tone glass chime (D5 -> A5 with soft bell harmonics)
 * Perfect for ride accepted, arrival OTP ready, paramedic arrived
 */
export function playPrettyChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master volume control
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.22, now);
    masterGain.connect(ctx.destination);

    // Note 1: D5 (587.33 Hz) - soft warm start
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.65, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.46);

    // Note 2: A5 (880.00 Hz) - crystalline bright chime 110ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.11);

    gain2.gain.setValueAtTime(0.001, now + 0.11);
    gain2.gain.linearRampToValueAtTime(0.85, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.76);

    // Shimmer harmonic: E6 (1318.5 Hz) soft glass overtone
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = "sine";
    oscHarmonic.frequency.setValueAtTime(1318.5, now + 0.12);

    gainHarmonic.gain.setValueAtTime(0.001, now + 0.12);
    gainHarmonic.gain.linearRampToValueAtTime(0.18, now + 0.14);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(masterGain);
    oscHarmonic.start(now + 0.12);
    oscHarmonic.stop(now + 0.56);
  } catch (e) {
    console.warn("Could not play pretty chime:", e);
  }
}

/**
 * Ascending triumphal harmonic chime (C5 -> E5 -> G5 -> C6)
 * Plays when emergency ride completes and patient is successfully admitted
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.24, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.35 },  // C5
      { freq: 659.25, time: 0.09, dur: 0.35 }, // E5
      { freq: 783.99, time: 0.18, dur: 0.45 }, // G5
      { freq: 1046.5, time: 0.27, dur: 0.85 }, // C6 (long bell ring)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(0.7, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.01);
    });
  } catch (e) {
    console.warn("Could not play success chime:", e);
  }
}

export default {
  playPrettyChime,
  playSuccessChime,
};

