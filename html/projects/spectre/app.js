const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const playBtn = document.getElementById("play");
const downloadBtn = document.getElementById("download");
const canvas = document.getElementById("spectrogram");
const pitchDisplay = document.getElementById("pitch");
const ctx = canvas.getContext("2d");

let audioContext;
let analyser;
let source;
let processor;
let recorder;
let chunks = [];
let mediaStream;
let animationId;
let x = 0;
let recordedBlob;

const pitchHistory = [];
const maxHistoryLength = canvas.width;

startBtn.onclick = async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  playBtn.disabled = true;
  downloadBtn.disabled = true;

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(mediaStream);
  chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    recordedBlob = new Blob(chunks, { type: 'audio/wav' });
    playBtn.disabled = false;
    downloadBtn.disabled = false;
  };
  recorder.start();

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  processor = audioContext.createScriptProcessor(2048, 1, 1);
  source.connect(processor);
  processor.connect(audioContext.destination);
  /*
  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const pitch = detectPitch(input, audioContext.sampleRate);
    if (pitch) {
      const note = pitchToNote(pitch);
      pitchDisplay.textContent = `Pitch: ${pitch.toFixed(1)} Hz (${note})`;
      pitchHistory.push(pitch);
    } else {
      pitchDisplay.textContent = `Pitch: -- Hz (--)`;
      pitchHistory.push(null);
    }
    if (pitchHistory.length > maxHistoryLength) pitchHistory.shift();
  };*/

  x = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  function drawSpectrogram() {
  analyser.getByteFrequencyData(dataArray);
  const height = canvas.height;

  // Define frequency mapping
  const nyquist = audioContext.sampleRate / 2;
  const freqBinSize = nyquist / dataArray.length;
  const maxFreq = 1000;
  const maxBin = Math.floor(maxFreq / freqBinSize);

  // Draw frequency bars
  for (let i = 0; i < maxBin; i++) {
    const val = dataArray[i];
    const hue = 240 - (val * 240) / 255;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

    // Map frequency bin to canvas height
    const y = canvas.height - (i / maxBin) * canvas.height;
    ctx.fillRect(x, y, 1, canvas.height / maxBin);
  }

  // Draw pitch curve
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  for (let i = 0; i < pitchHistory.length; i++) {
    const pitch = pitchHistory[i];
    if (!pitch || pitch > 1000) continue;

    const y = canvas.height - (pitch / maxFreq) * canvas.height;
    if (i === 0 || !pitchHistory[i - 1]) {
      ctx.moveTo(i, y);
    } else {
      ctx.lineTo(i, y);
    }
  }
  ctx.stroke();

  // Draw frequency axis (left side)
  ctx.fillStyle = "black";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  ctx.clearRect(0, 0, 30, canvas.height); // Clear left side for axis
  for (let hz = 0; hz <= maxFreq; hz += 200) {
    const y = canvas.height - (hz / maxFreq) * canvas.height;
    ctx.fillText(`${hz} Hz`, 28, y);
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(35, y);
    ctx.stroke();
  }

  x = (x + 1) % canvas.width;
  if (x === 0) {
    ctx.clearRect(30, 0, canvas.width - 30, canvas.height);
    x = 35; // Skip the axis margin
  }

  animationId = requestAnimationFrame(drawSpectrogram);
}


  drawSpectrogram();
};

stopBtn.onclick = () => {
  stopBtn.disabled = true;
  startBtn.disabled = false;
  cancelAnimationFrame(animationId);

  recorder.stop();
  audioContext.close();
  mediaStream.getTracks().forEach(track => track.stop());
};

playBtn.onclick = () => {
  if (!recordedBlob) return;
  const audio = new Audio(URL.createObjectURL(recordedBlob));
  audio.play();
};

downloadBtn.onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(recordedBlob);
  a.download = 'voice.wav';
  a.click();
};

// Pitch detection via autocorrelation
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
  if (rms < 0.01) return null;

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
  console.log(bestCorrelation, bestOffset);
  if (bestCorrelation > 0.9 && bestOffset !== -1) {
    return sampleRate / bestOffset;
  }
  return null;
}

// Converts frequency to closest note name
function pitchToNote(frequency) {
  const A4 = 440;
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const n = Math.round(12 * Math.log2(frequency / A4)) + 57;
  const octave = Math.floor(n / 12);
  const name = notes[n % 12];
  return `${name}${octave}`;
}

const hoverCanvas = document.getElementById("hoverLine");
const hoverCtx = hoverCanvas.getContext("2d");

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;

  // Clear previous hover line
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

  // Draw semi-opaque horizontal line
  hoverCtx.beginPath();
  hoverCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  hoverCtx.lineWidth = 1;
  hoverCtx.moveTo(0, y);
  hoverCtx.lineTo(hoverCanvas.width, y);
  hoverCtx.stroke();

  // Display pitch at this Y position
  const midi = 128 * (1 - y / canvas.height);
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  const note = pitchToNote(frequency);
  pitchDisplay.textContent = `Hover Pitch: ${frequency.toFixed(1)} Hz (${note})`;
});

canvas.addEventListener("mouseleave", () => {
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  pitchDisplay.textContent = ""; // Clear pitch display
});
