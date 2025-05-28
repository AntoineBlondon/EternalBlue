

let audioContext;
let analyser;
let source;
let pitchNode;
let recorder;
let pitchHistory = [];
let chunks = [];

async function setupAudio() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Set up recording
  recorder = new MediaRecorder(mediaStream);
  chunks = [];

  // Set up audio context and nodes
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  await audioContext.audioWorklet.addModule('spectre/pitch-processor.js'); // Load the processor file

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;

  const bufferLength = analyser.frequencyBinCount;
  source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  // Pitch detection with AudioWorklet
  const pitchNode = new AudioWorkletNode(audioContext, 'pitch-processor');
  pitchHistory = [];

  pitchNode.port.onmessage = (event) => {
    const input = event.data;
    const pitch = detectPitch(input, audioContext.sampleRate);
    pitchHistory.push(pitch ?? null);
    if (pitchHistory.length > 1024) pitchHistory.shift();
  };

  source.connect(pitchNode).connect(audioContext.destination);

  return { recorder, audioContext };
}


function getAnalyser() {
  return analyser;
}

function getPitchStream() {
  return pitchHistory;
}

function stopAudio() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
  if (audioContext && audioContext.state !== 'closed') audioContext.close();
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  if (pitchNode) pitchNode.disconnect();
}

/**
 * Detects the pitch (fundamental frequency) of a signal using autocorrelation.
 * @param {Float32Array} buffer - The input audio buffer.
 * @param {number} sampleRate - The sampling rate of the audio.
 * @returns {number|null} - Detected pitch in Hz, or null if no strong pitch is found.
 */
function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // too quiet

  let bestOffset = -1;
  let bestCorrelation = 0;
  const correlations = new Array(SIZE).fill(0);

  for (let offset = 32; offset < 512; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }

    correlation = correlation / (SIZE - offset);
    correlations[offset] = correlation;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.9) {
    const estimatedPeriod = bestOffset;
    const frequency = sampleRate / estimatedPeriod;
    return frequency;
  }

  return null;
}
