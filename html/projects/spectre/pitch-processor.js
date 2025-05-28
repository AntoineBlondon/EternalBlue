class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pitchHistory = [];
  }

  static get parameterDescriptors() {
    return [];
  }

  process(inputs) {
    const input = inputs[0][0];
    if (input) {
      const pitch = detectPitch(input, sampleRate);
      this.port.postMessage(pitch ?? null);
    }
    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);



/**
 * Detects the fundamental frequency (pitch) of a signal using autocorrelation.
 *
 * @param {Float32Array} buffer - The audio buffer from a microphone input.
 * @param {number} sampleRate - The sampling rate of the audio context.
 * @returns {number|null} - The detected pitch in Hz, or null if unclear.
 */
function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }

  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // signal too quiet

  let lastCorrelation = 1;
  for (let offset = 32; offset < 512; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }

    correlation /= SIZE;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }

    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.9 && bestOffset !== -1) {
    return sampleRate / bestOffset;
  }

  return null;
}
