/**
 * Convert a frequency (Hz) to a vertical Y position on the canvas.
 * Supports 'log' and 'linear' scales.
 * @param {number} freq - Frequency in Hz
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} minFreq - Minimum frequency (Hz)
 * @param {number} maxFreq - Maximum frequency (Hz)
 * @param {'log'|'linear'} scale - Scale type
 * @returns {number} y position on canvas
 */
function freqToY(freq, canvasHeight, minFreq, maxFreq, scale = 'log') {
  if (scale === 'log') {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(freq);
    const norm = (logFreq - logMin) / (logMax - logMin);
    return canvasHeight * (1 - norm);
  } else {
    const norm = (freq - minFreq) / (maxFreq - minFreq);
    return canvasHeight * (1 - norm);
  }
}

/**
 * Convert a Y position on the canvas to frequency (Hz).
 * Supports 'log' and 'linear' scales.
 * @param {number} y - Y position
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} minFreq - Minimum frequency (Hz)
 * @param {number} maxFreq - Maximum frequency (Hz)
 * @param {'log'|'linear'} scale - Scale type
 * @returns {number} Frequency in Hz
 */
function yToFreq(y, canvasHeight, minFreq, maxFreq, scale = 'log') {
    console.log(y, canvasHeight, minFreq, maxFreq, scale);
  const norm = 1 - (y / canvasHeight);
  if (scale === 'log') {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = logMin + norm * (logMax - logMin);
    return Math.pow(10, logFreq);
  } else {
    return minFreq + norm * (maxFreq - minFreq);
  }
}

/**
 * Converts a frequency to the closest musical note name and octave.
 * @param {number} frequency - Frequency in Hz
 * @returns {string} Note name (e.g., "A4")
 */
function pitchToNote(frequency) {
  const A4 = 440;
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const n = Math.round(12 * Math.log2(frequency / A4)) + 57;
  const octave = Math.floor(n / 12);
  const name = notes[n % 12];
  return `${name}${octave}`;
}

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
