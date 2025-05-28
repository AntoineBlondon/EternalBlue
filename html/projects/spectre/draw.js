let x = 0;

/**
 * Initializes drawing context and settings
 * @param {HTMLCanvasElement} c 
 * @param {AnalyserNode} a 
 * @param {Array<number|null>} pitchHist 
 * @param {object} options 
 */
function initDrawing(c, a, pitchHist, options = {}) {
  canvas = c;
  ctx = canvas.getContext('2d');
  analyser = a;
  pitchHistory = pitchHist;
  Object.assign(config, options);
  x = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw one frame of the spectrogram
 */
function drawSpectrogram() {
    console.log("Drawing frame", x);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const nyquist = analyser.context.sampleRate / 2;
  const binSize = nyquist / bufferLength;

  const { minFreq, maxFreq, scale, axisWidth } = config;

  // Clear vertical slice at x position (excluding axis)
  ctx.clearRect(axisWidth + x, 0, 1, canvas.height);

  for (let i = 0; i < bufferLength; i++) {
    const freq = i * binSize;
    if (freq < minFreq || freq > maxFreq) continue;

    const y = freqToY(freq, canvas.height, scale, minFreq, maxFreq);
    const val = dataArray[i];
    ctx.fillStyle = getColorForValue(val);
    ctx.fillRect(axisWidth + x, y, 1, 1);
  }

  // Draw pitch curve
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  for (let i = 0; i < pitchHistory.length; i++) {
    const pitch = pitchHistory[i];
    if (!pitch || pitch < minFreq || pitch > maxFreq) continue;

    const y = freqToY(pitch, canvas.height, scale, minFreq, maxFreq);
    const px = axisWidth + i;
    if (i === 0 || !pitchHistory[i - 1]) {
      ctx.moveTo(px, y);
    } else {
      ctx.lineTo(px, y);
    }
  }
  ctx.stroke();

  // Draw frequency axis
  drawAxis();

  x = (x + 1) % (canvas.width - axisWidth);
  requestAnimationFrame(drawSpectrogram);
}

function drawAxis() {
  const { minFreq, maxFreq, scale, axisWidth } = config;

  ctx.clearRect(0, 0, axisWidth, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "12px Azeret Mono";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const freqs = scale === 'log'
    ? [50, 100, 200, 500, 1000, 2000, 5000, 10000]
    : Array.from({ length: 11 }, (_, i) => i * (maxFreq / 10));

  for (const hz of freqs) {
    const y = freqToY(hz, canvas.height, scale, minFreq, maxFreq);

    // Skip labels that are too close to the edges
    if (y < 10 || y > canvas.height - 10) continue;

    ctx.fillText(`${Math.round(hz)} Hz`, axisWidth - 4, y);
    ctx.beginPath();
    ctx.moveTo(axisWidth - 2, y);
    ctx.lineTo(axisWidth, y);
    ctx.stroke();
  }
}


let animationId;

/**
 * Starts the spectrogram drawing loop.
 * @param {AnalyserNode} analyserNode
 * @param {Array<number|null>} pitchHist
 * @param {number} minFreq
 * @param {number} maxFreq
 * @param {'log'|'linear'} scale
 */
function startDrawing(analyserNode, pitchHist, minFreq, maxFreq, scale) {
  initDrawing(canvas, analyserNode, pitchHist, {
    minFreq,
    maxFreq,
    scale
  });
  animationId = requestAnimationFrame(drawSpectrogram);
}

/**
 * Stops the spectrogram drawing loop.
 */
function stopDrawing() {
  cancelAnimationFrame(animationId);
}


/**
 * Maps a frequency magnitude (0–255) to a color.
 * Blue (low) → Green → Red (high).
 * @param {number} val - Magnitude from getByteFrequencyData (0–255)
 * @returns {string} - HSL color string
 */
function getColorForValue(val) {
  const hue = 240 - (val * 240) / 255; // 240 (blue) to 0 (red)
  return `hsl(${hue}, 100%, 50%)`;
}
