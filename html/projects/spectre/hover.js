let canvas, hoverCanvas, hoverCtx, config, displayElement;

/**
 * Initializes hover effect on the spectrogram canvas.
 * @param {HTMLCanvasElement} mainCanvas - The main canvas.
 * @param {HTMLCanvasElement} overlayCanvas - Transparent overlay for drawing hover line.
 * @param {HTMLElement} outputElement - Element to display the frequency/note.
 * @param {object} options - Configuration (minFreq, maxFreq, scale).
 */
export function initHover(mainCanvas, overlayCanvas, outputElement, options = {}) {
  canvas = mainCanvas;
  hoverCanvas = overlayCanvas;
  hoverCtx = hoverCanvas.getContext("2d");
  displayElement = outputElement;
  config = Object.assign({
    minFreq: 50,
    maxFreq: 10000,
    scale: 'log'
  }, options);

  mainCanvas.addEventListener("mousemove", handleHover);
  mainCanvas.addEventListener("mouseleave", clearHover);
}

function handleHover(event) {
  const rect = canvas.getBoundingClientRect();
  const y = event.clientY - rect.top;

  // Clear previous hover line
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

  // Draw hover line
  hoverCtx.beginPath();
  hoverCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  hoverCtx.lineWidth = 1;
  hoverCtx.moveTo(0, y);
  hoverCtx.lineTo(hoverCanvas.width, y);
  hoverCtx.stroke();

  const freq = yToFreq(y, canvas.height, config.scale, config.minFreq, config.maxFreq);
  const note = pitchToNote(freq);
  displayElement.textContent = `Hover Pitch: ${freq.toFixed(1)} Hz (${note})`;
}

function clearHover() {
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  displayElement.textContent = "";
}
