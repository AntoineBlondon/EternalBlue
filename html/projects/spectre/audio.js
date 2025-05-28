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



let audioContext;
let analyser;
let source;
let pitchNode;
let recorder;
let mediaStream;
let pitchHistory = [];
let chunks = [];

async function setupAudio() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(mediaStream);
  chunks = [];

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;

  source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  await audioContext.audioWorklet.addModule('pitch-processor.js');

  pitchNode = new AudioWorkletNode(audioContext, 'pitch-processor');
  source.connect(pitchNode);
  pitchNode.connect(audioContext.destination);

  pitchHistory = [];

  pitchNode.port.onmessage = (event) => {
    const pitch = event.data;
    pitchHistory.push(pitch);
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
  if (pitchNode) pitchNode.disconnect();
}
