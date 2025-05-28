
// Buttons and UI elements
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const playBtn = document.getElementById("play");
const downloadBtn = document.getElementById("download");
const scaleSelector = document.getElementById("scale");
const pitchDisplay = document.getElementById("pitch");

let recordedBlob = null;
let pitchStream = [];
let scale = 'log';
const minFreq = 50;
const maxFreq = 10000;
let config = {
  minFreq: 50,
  maxFreq: 10000,
  scale: 'log', // 'log' or 'linear'
  axisWidth: 100
};


// Setup hover behavior
const mainCanvas = document.getElementById("spectrogram");
const overlayCanvas = document.getElementById("hoverLine");
initHover(mainCanvas, overlayCanvas, pitchDisplay);


// Handle start
startBtn.onclick = async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  playBtn.disabled = true;
  downloadBtn.disabled = true;

  const { recorder, audioContext } = await setupAudio();
  pitchStream = getPitchStream();

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    recordedBlob = new Blob(chunks, { type: 'audio/wav' });
    playBtn.disabled = false;
    downloadBtn.disabled = false;
  };
  recorder.start();

  setScale(scale);
  setBounds(minFreq, maxFreq);
  startDrawing(getAnalyser(), pitchStream, minFreq, maxFreq, scale);
};

// Handle stop
stopBtn.onclick = () => {
  stopBtn.disabled = true;
  startBtn.disabled = false;
  stopAudio();
  stopDrawing();
};

// Handle play
playBtn.onclick = () => {
  if (!recordedBlob) return;
  const audio = new Audio(URL.createObjectURL(recordedBlob));
  audio.play();
};

// Handle download
downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(recordedBlob);
  a.download = "voice.wav";
  a.click();
};

// Handle scale switch
scaleSelector.onchange = (e) => {
  scale = e.target.value;
  setScale(scale);
};
