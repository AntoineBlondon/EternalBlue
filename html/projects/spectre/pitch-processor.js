class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || input[0].length === 0) return true;

    const inputChannel = input[0]; // Mono input
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.writeIndex++] = inputChannel[i];
      if (this.writeIndex >= this.buffer.length) {
        this.port.postMessage(this.buffer.slice(0)); // send a copy
        this.writeIndex = 0;
      }
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
