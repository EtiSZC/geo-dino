// Dinosaur sound generator using Web Audio API with unique sounds per species
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

type DinoSoundConfig = {
  baseFreq: number;
  endFreq: number;
  duration: number;
  filterFreq: number;
  filterEnd: number;
  waveType: OscillatorType;
  texture: OscillatorType;
  attack: number;
};

const dinoSoundConfigs: Record<string, DinoSoundConfig> = {
  // T-Rex: Deep, powerful roar
  'T-Rex': {
    baseFreq: 60,
    endFreq: 35,
    duration: 1.0,
    filterFreq: 600,
    filterEnd: 150,
    waveType: 'sawtooth',
    texture: 'square',
    attack: 0.05,
  },
  // Brachiosaurus: Low, long bellowing
  'Brachiosaurus': {
    baseFreq: 50,
    endFreq: 40,
    duration: 1.4,
    filterFreq: 400,
    filterEnd: 100,
    waveType: 'sine',
    texture: 'triangle',
    attack: 0.15,
  },
  // Velociraptor: Sharp, high-pitched screech
  'Velociraptor': {
    baseFreq: 400,
    endFreq: 250,
    duration: 0.5,
    filterFreq: 2000,
    filterEnd: 800,
    waveType: 'sawtooth',
    texture: 'square',
    attack: 0.02,
  },
  // Pterodactyl: High-pitched screech
  'Pterodactyl': {
    baseFreq: 500,
    endFreq: 350,
    duration: 0.6,
    filterFreq: 2500,
    filterEnd: 1000,
    waveType: 'triangle',
    texture: 'sawtooth',
    attack: 0.03,
  },
  // Triceratops: Medium grunt
  'Triceratops': {
    baseFreq: 100,
    endFreq: 70,
    duration: 0.7,
    filterFreq: 800,
    filterEnd: 300,
    waveType: 'square',
    texture: 'triangle',
    attack: 0.04,
  },
  // Stegosaurus: Low rumble
  'Stegosaurus': {
    baseFreq: 80,
    endFreq: 50,
    duration: 0.9,
    filterFreq: 500,
    filterEnd: 200,
    waveType: 'triangle',
    texture: 'sine',
    attack: 0.08,
  },
  // Spinosaurus: Deep aggressive roar
  'Spinosaurus': {
    baseFreq: 70,
    endFreq: 40,
    duration: 1.1,
    filterFreq: 700,
    filterEnd: 180,
    waveType: 'sawtooth',
    texture: 'square',
    attack: 0.04,
  },
  // Ankylosaurus: Low grunt/rumble
  'Ankylosaurus': {
    baseFreq: 90,
    endFreq: 55,
    duration: 0.6,
    filterFreq: 450,
    filterEnd: 150,
    waveType: 'square',
    texture: 'sine',
    attack: 0.06,
  },
};

// Default config for unknown dinosaurs
const defaultConfig: DinoSoundConfig = {
  baseFreq: 80,
  endFreq: 50,
  duration: 0.8,
  filterFreq: 800,
  filterEnd: 200,
  waveType: 'sawtooth',
  texture: 'square',
  attack: 0.05,
};

export function playDinoRoar(dinoType?: string): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Get the sound config for this dinosaur type
    const config = dinoType ? (dinoSoundConfigs[dinoType] || defaultConfig) : defaultConfig;

    // Create oscillators
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const oscillator3 = ctx.createOscillator();
    
    // Gain nodes for volume control
    const gainNode1 = ctx.createGain();
    const gainNode2 = ctx.createGain();
    const gainNode3 = ctx.createGain();
    const masterGain = ctx.createGain();

    // Create a low-pass filter for a more natural sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.filterFreq, now);
    filter.frequency.exponentialRampToValueAtTime(config.filterEnd, now + config.duration);

    // Main frequency oscillator
    oscillator1.type = config.waveType;
    oscillator1.frequency.setValueAtTime(config.baseFreq, now);
    oscillator1.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration * 0.7);

    // Texture oscillator
    oscillator2.type = config.texture;
    oscillator2.frequency.setValueAtTime(config.baseFreq * 1.5, now);
    oscillator2.frequency.exponentialRampToValueAtTime(config.endFreq * 1.4, now + config.duration * 0.6);

    // Attack/high frequency oscillator
    oscillator3.type = 'triangle';
    oscillator3.frequency.setValueAtTime(config.baseFreq * 2.5, now);
    oscillator3.frequency.exponentialRampToValueAtTime(config.endFreq * 2, now + config.duration * 0.3);

    // Envelope for main oscillator
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.3, now + config.attack);
    gainNode1.gain.linearRampToValueAtTime(0.2, now + config.duration * 0.4);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + config.duration);

    // Envelope for texture oscillator
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.15, now + config.attack * 0.6);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + config.duration * 0.6);

    // Envelope for attack oscillator
    gainNode3.gain.setValueAtTime(0.2, now);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, now + config.duration * 0.25);

    // Master volume
    masterGain.gain.setValueAtTime(0.4, now);

    // Connect the audio graph
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    oscillator3.connect(gainNode3);
    
    gainNode1.connect(filter);
    gainNode2.connect(filter);
    gainNode3.connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start and stop oscillators
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);
    
    oscillator1.stop(now + config.duration + 0.1);
    oscillator2.stop(now + config.duration * 0.7);
    oscillator3.stop(now + config.duration * 0.35);

  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
}
