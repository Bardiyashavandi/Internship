// Web Audio API Synthesizer for football sounds

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a realistic high-frequency referee whistle sound (double blast)
 */
export function playWhistle() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playBlast = (startTime: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      // Golden ratio frequencies for piercing referee whistle
      osc1.frequency.setValueAtTime(2800, startTime);
      osc2.frequency.setValueAtTime(3200, startTime);

      // Add slight vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(45, startTime);
      lfoGain.gain.setValueAtTime(300, startTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Connect filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, startTime);
      filter.Q.setValueAtTime(2, startTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Gain Envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.start(startTime);
      osc2.start(startTime);
      lfo.start(startTime);

      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
      lfo.stop(startTime + duration);
    };

    // Ref double-blast: blast, gap, longer blast
    playBlast(now, 0.15);
    playBlast(now + 0.22, 0.35);
  } catch (error) {
    console.warn("Audio Context failed to start (interaction needed)", error);
  }
}

/**
 * Simulates a crowd cheer with white noise bandpass filtered to mid-range
 */
export function playCrowdCheer(isHuge: boolean = false) {
  try {
    const ctx = getAudioContext();
    const duration = isHuge ? 4.5 : 2.5;
    const now = ctx.currentTime;

    // Create noise buffer
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Populate with white/pinkish noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation for a warmer, roaring feel
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // normalise pink noise
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Add filter to simulate crowd room/distance
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(1000, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(500, now + duration);
    filter.Q.setValueAtTime(1.2, now);

    // Gain node for roar envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isHuge ? 0.9 : 0.6, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + 1.5);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Add a slight sine wave rumble for stadium depth
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.linearRampToValueAtTime(110, now + 0.8);
    subOsc.frequency.linearRampToValueAtTime(70, now + duration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.4);
    subGain.gain.linearRampToValueAtTime(0.001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    noiseSource.start(now);
    subOsc.start(now);

    noiseSource.stop(now + duration);
    subOsc.stop(now + duration);
  } catch (error) {
    console.warn("Audio Context cheer failed", error);
  }
}
