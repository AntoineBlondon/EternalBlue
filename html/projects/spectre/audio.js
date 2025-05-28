

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
  await audioContext.audioWorklet.addModule('pitch-processor.js'); // ⬅️ Load the processor file

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
