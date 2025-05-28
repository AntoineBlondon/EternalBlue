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

