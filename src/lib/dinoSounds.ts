// Dinosaur sound generator using Web Audio API with unique realistic sounds per species
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume context if suspended (needed for some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

type DinoSoundConfig = {
  baseFreq: number;
  endFreq: number;
  duration: number;
  filterFreq: number;
  filterEnd: number;
  filterQ: number;
  waveType: OscillatorType;
  subWaveType: OscillatorType;
  noiseAmount: number;
  tremoloRate: number;
  tremoloDepth: number;
  attack: number;
  decay: number;
  rumble: boolean;
  screech: boolean;
  screechFreq?: number;
};

const dinoSoundConfigs: Record<string, DinoSoundConfig> = {
  // T-Rex: Deep, powerful, earth-shaking roar with rumble
  'T-Rex': {
    baseFreq: 55,
    endFreq: 30,
    duration: 1.8,
    filterFreq: 800,
    filterEnd: 120,
    filterQ: 2,
    waveType: 'sawtooth',
    subWaveType: 'square',
    noiseAmount: 0.25,
    tremoloRate: 8,
    tremoloDepth: 0.3,
    attack: 0.08,
    decay: 0.6,
    rumble: true,
    screech: false,
  },
  // Brachiosaurus: Deep, long, mournful bellowing like a whale
  'Brachiosaurus': {
    baseFreq: 45,
    endFreq: 35,
    duration: 2.2,
    filterFreq: 350,
    filterEnd: 80,
    filterQ: 1.5,
    waveType: 'sine',
    subWaveType: 'triangle',
    noiseAmount: 0.08,
    tremoloRate: 2,
    tremoloDepth: 0.15,
    attack: 0.25,
    decay: 0.8,
    rumble: true,
    screech: false,
  },
  // Velociraptor: Sharp, aggressive, bird-like screech/bark
  'Velociraptor': {
    baseFreq: 600,
    endFreq: 350,
    duration: 0.45,
    filterFreq: 3500,
    filterEnd: 1200,
    filterQ: 4,
    waveType: 'sawtooth',
    subWaveType: 'square',
    noiseAmount: 0.35,
    tremoloRate: 25,
    tremoloDepth: 0.5,
    attack: 0.01,
    decay: 0.15,
    rumble: false,
    screech: true,
    screechFreq: 2000,
  },
  // Pterodactyl: High-pitched pterosaur screech
  'Pterodactyl': {
    baseFreq: 800,
    endFreq: 500,
    duration: 0.7,
    filterFreq: 4000,
    filterEnd: 1500,
    filterQ: 5,
    waveType: 'triangle',
    subWaveType: 'sawtooth',
    noiseAmount: 0.3,
    tremoloRate: 15,
    tremoloDepth: 0.4,
    attack: 0.02,
    decay: 0.2,
    rumble: false,
    screech: true,
    screechFreq: 2500,
  },
  // Triceratops: Deep bellowing grunt like a rhino/elephant
  'Triceratops': {
    baseFreq: 90,
    endFreq: 50,
    duration: 1.4,
    filterFreq: 700,
    filterEnd: 150,
    filterQ: 2.5,
    waveType: 'sawtooth',
    subWaveType: 'square',
    noiseAmount: 0.2,
    tremoloRate: 6,
    tremoloDepth: 0.25,
    attack: 0.1,
    decay: 0.5,
    rumble: true,
    screech: false,
  },
  // Stegosaurus: Low rumbling grunt
  'Stegosaurus': {
    baseFreq: 70,
    endFreq: 45,
    duration: 1.1,
    filterFreq: 500,
    filterEnd: 150,
    filterQ: 2,
    waveType: 'triangle',
    subWaveType: 'sine',
    noiseAmount: 0.12,
    tremoloRate: 4,
    tremoloDepth: 0.2,
    attack: 0.12,
    decay: 0.4,
    rumble: true,
    screech: false,
  },
  // Spinosaurus: Deep aggressive roar with water-like resonance
  'Spinosaurus': {
    baseFreq: 65,
    endFreq: 35,
    duration: 1.6,
    filterFreq: 850,
    filterEnd: 140,
    filterQ: 3,
    waveType: 'sawtooth',
    subWaveType: 'square',
    noiseAmount: 0.28,
    tremoloRate: 10,
    tremoloDepth: 0.35,
    attack: 0.05,
    decay: 0.55,
    rumble: true,
    screech: false,
  },
  // Ankylosaurus: Low grunt/rumble with armor-like resonance
  'Ankylosaurus': {
    baseFreq: 85,
    endFreq: 55,
    duration: 0.8,
    filterFreq: 400,
    filterEnd: 120,
    filterQ: 3.5,
    waveType: 'square',
    subWaveType: 'sine',
    noiseAmount: 0.15,
    tremoloRate: 5,
    tremoloDepth: 0.2,
    attack: 0.08,
    decay: 0.3,
    rumble: true,
    screech: false,
  },
};

// Default config for unknown dinosaurs
const defaultConfig: DinoSoundConfig = {
  baseFreq: 80,
  endFreq: 50,
  duration: 1.0,
  filterFreq: 800,
  filterEnd: 200,
  filterQ: 2,
  waveType: 'sawtooth',
  subWaveType: 'square',
  noiseAmount: 0.2,
  tremoloRate: 6,
  tremoloDepth: 0.25,
  attack: 0.05,
  decay: 0.4,
  rumble: true,
  screech: false,
};

// Create white noise buffer
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    // Brown noise (more natural for animal sounds)
    data[i] = (Math.random() * 2 - 1) * 0.5;
    if (i > 0) {
      data[i] = (data[i] + data[i - 1] * 0.98) / 1.02;
    }
  }
  
  return buffer;
}

// Audio files for specific dinosaurs (use French names from DINO_TYPES)
const dinoAudioFiles: Record<string, string> = {
  'T-Rex': '/sounds/t-rex-roar.mp3',
  'Brachiosaure': '/sounds/brachiosaurus-roar.mp3',
  'Tricératops': '/sounds/triceratops-roar.mp3',
  'Ankylosaure': '/sounds/ankylosaurus-roar.mp3',
  'Spinosaure': '/sounds/spinosaurus-roar.mp3',
};

export function playDinoRoar(dinoType?: string): void {
  try {
    // Check if we have an audio file for this dinosaur
    if (dinoType && dinoAudioFiles[dinoType]) {
      const audio = new Audio(dinoAudioFiles[dinoType]);
      audio.volume = 0.6;
      audio.play().catch(err => console.log('Audio playback failed:', err));
      return;
    }

    // Fall back to synthesized sound for other dinosaurs
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Get the sound config for this dinosaur type
    const config = dinoType ? (dinoSoundConfigs[dinoType] || defaultConfig) : defaultConfig;

    // Master output
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.connect(ctx.destination);

    // Main low-pass filter
    const mainFilter = ctx.createBiquadFilter();
    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(config.filterFreq, now);
    mainFilter.frequency.exponentialRampToValueAtTime(config.filterEnd, now + config.duration * 0.8);
    mainFilter.Q.setValueAtTime(config.filterQ, now);
    mainFilter.connect(masterGain);

    // Tremolo LFO for natural vibration
    const tremoloOsc = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    tremoloOsc.type = 'sine';
    tremoloOsc.frequency.setValueAtTime(config.tremoloRate, now);
    tremoloGain.gain.setValueAtTime(config.tremoloDepth, now);
    tremoloGain.gain.linearRampToValueAtTime(config.tremoloDepth * 0.3, now + config.duration);
    tremoloOsc.connect(tremoloGain);

    // === MAIN OSCILLATOR (core roar) ===
    const mainOsc = ctx.createOscillator();
    const mainGain = ctx.createGain();
    mainOsc.type = config.waveType;
    mainOsc.frequency.setValueAtTime(config.baseFreq, now);
    mainOsc.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration * 0.7);
    
    // Connect tremolo to main gain
    tremoloGain.connect(mainGain.gain);
    
    // Envelope
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.4, now + config.attack);
    mainGain.gain.setValueAtTime(0.4, now + config.attack);
    mainGain.gain.linearRampToValueAtTime(0.3, now + config.attack + config.decay);
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
    
    mainOsc.connect(mainGain);
    mainGain.connect(mainFilter);

    // === SUB OSCILLATOR (adds body) ===
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = config.subWaveType;
    subOsc.frequency.setValueAtTime(config.baseFreq * 0.5, now);
    subOsc.frequency.exponentialRampToValueAtTime(config.endFreq * 0.5, now + config.duration * 0.6);
    
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + config.attack * 1.2);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration * 0.9);
    
    subOsc.connect(subGain);
    subGain.connect(mainFilter);

    // === HARMONICS OSCILLATOR (adds character) ===
    const harmOsc = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harmOsc.type = 'sawtooth';
    harmOsc.frequency.setValueAtTime(config.baseFreq * 2, now);
    harmOsc.frequency.exponentialRampToValueAtTime(config.endFreq * 1.5, now + config.duration * 0.5);
    
    harmGain.gain.setValueAtTime(0, now);
    harmGain.gain.linearRampToValueAtTime(0.08, now + config.attack * 0.5);
    harmGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration * 0.4);
    
    harmOsc.connect(harmGain);
    harmGain.connect(mainFilter);

    // === NOISE (adds texture/breath) ===
    if (config.noiseAmount > 0) {
      const noiseBuffer = createNoiseBuffer(ctx, config.duration + 0.5);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(config.baseFreq * 3, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(config.endFreq * 2, now + config.duration * 0.6);
      noiseFilter.Q.setValueAtTime(1.5, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(config.noiseAmount, now + config.attack);
      noiseGain.gain.linearRampToValueAtTime(config.noiseAmount * 0.7, now + config.duration * 0.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(mainFilter);
      
      noiseSource.start(now);
      noiseSource.stop(now + config.duration + 0.2);
    }

    // === RUMBLE (low frequency shake) ===
    if (config.rumble) {
      const rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(25, now);
      rumbleOsc.frequency.exponentialRampToValueAtTime(15, now + config.duration);
      
      rumbleGain.gain.setValueAtTime(0, now);
      rumbleGain.gain.linearRampToValueAtTime(0.15, now + config.attack * 1.5);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
      
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      
      rumbleOsc.start(now);
      rumbleOsc.stop(now + config.duration + 0.1);
    }

    // === SCREECH (for raptors/pterosaurs) ===
    if (config.screech && config.screechFreq) {
      const screechOsc = ctx.createOscillator();
      const screechGain = ctx.createGain();
      const screechFilter = ctx.createBiquadFilter();
      
      screechOsc.type = 'sawtooth';
      screechOsc.frequency.setValueAtTime(config.screechFreq, now);
      screechOsc.frequency.exponentialRampToValueAtTime(config.screechFreq * 0.6, now + config.duration * 0.4);
      
      screechFilter.type = 'bandpass';
      screechFilter.frequency.setValueAtTime(config.screechFreq, now);
      screechFilter.Q.setValueAtTime(6, now);
      
      screechGain.gain.setValueAtTime(0, now);
      screechGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      screechGain.gain.exponentialRampToValueAtTime(0.01, now + config.duration * 0.3);
      
      screechOsc.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(masterGain);
      
      screechOsc.start(now);
      screechOsc.stop(now + config.duration * 0.4);
    }

    // Start oscillators
    tremoloOsc.start(now);
    mainOsc.start(now);
    subOsc.start(now);
    harmOsc.start(now);

    // Stop oscillators
    const stopTime = now + config.duration + 0.2;
    tremoloOsc.stop(stopTime);
    mainOsc.stop(stopTime);
    subOsc.stop(now + config.duration * 0.95);
    harmOsc.stop(now + config.duration * 0.5);

  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
}
