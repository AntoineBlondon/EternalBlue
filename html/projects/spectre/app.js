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

  const minFreq = 50;
  const maxFreq = 10000;
  const axisWidth = 100;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);

  x = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  function freqToY(freq) {
    return canvas.height - (Math.log10(freq) - logMin) / (logMax - logMin) * canvas.height;
  }

  function drawSpectrogram() {
    analyser.getByteFrequencyData(dataArray);

    const nyquist = audioContext.sampleRate / 2;
    const freqBinSize = nyquist / dataArray.length;

    ctx.clearRect(axisWidth + x, 0, 1, canvas.height);

    for (let i = 1; i < dataArray.length; i++) {
      const freq = i * freqBinSize;
      if (freq < minFreq || freq > maxFreq) continue;

      const y = freqToY(freq);
      const val = dataArray[i];
      const hue = 240 - (val * 240) / 255;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(axisWidth + x, y, 1, 1);
    }

    // Pitch curve
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    for (let i = 0; i < pitchHistory.length; i++) {
      const pitch = pitchHistory[i];
      if (!pitch || pitch < minFreq || pitch > maxFreq) continue;

      const y = freqToY(pitch);
      const px = axisWidth + i;
      if (i === 0 || !pitchHistory[i - 1]) {
        ctx.moveTo(px, y);
      } else {
        ctx.lineTo(px, y);
      }
    }
    ctx.stroke();

    // Frequency axis
    ctx.clearRect(0, 0, axisWidth, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "12px Azeret Mono";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const freqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
    for (let hz of freqs) {
      const y = freqToY(hz);
      ctx.fillText(`${hz} Hz`, axisWidth - 4, y);
      ctx.beginPath();
      ctx.moveTo(axisWidth - 2, y);
      ctx.lineTo(axisWidth, y);
      ctx.stroke();
    }

    x = (x + 1) % (canvas.width - axisWidth);
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

// Hover logic
const hoverCanvas = document.getElementById("hoverLine");
const hoverCtx = hoverCanvas.getContext("2d");

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;

  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  hoverCtx.beginPath();
  hoverCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  hoverCtx.lineWidth = 1;
  hoverCtx.moveTo(0, y);
  hoverCtx.lineTo(hoverCanvas.width, y);
  hoverCtx.stroke();

  const minFreq = 50;
  const maxFreq = 10000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const frequency = Math.pow(10, logMax - (y / canvas.height) * (logMax - logMin));
  const note = pitchToNote(frequency);
  pitchDisplay.textContent = `Hover Pitch: ${frequency.toFixed(1)} Hz (${note})`;
});

canvas.addEventListener("mouseleave", () => {
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  pitchDisplay.textContent = "";
});
