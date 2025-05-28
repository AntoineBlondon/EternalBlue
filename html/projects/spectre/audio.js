let audioContext;
let analyser;
let source;
let processor;
let recorder;
let mediaStream;
let pitchHistory = [];
let chunks = [];

async function setupAudio() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Set up recording
  recorder = new MediaRecorder(mediaStream);
  chunks = [];

  // Set up audio context and nodes
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;

  const bufferLength = analyser.frequencyBinCount;
  const inputBuffer = new Float32Array(bufferLength);

  source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  // Pitch detection
  processor = audioContext.createScriptProcessor(2048, 1, 1);
  source.connect(processor);
  processor.connect(audioContext.destination);

  pitchHistory = [];

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const pitch = detectPitch(input, audioContext.sampleRate);
    pitchHistory.push(pitch ?? null);
    if (pitchHistory.length > 1024) pitchHistory.shift();
  };

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
  if (processor) processor.disconnect();
}
