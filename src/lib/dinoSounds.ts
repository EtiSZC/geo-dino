// Simple dinosaur roar sound generator using Web Audio API
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playDinoRoar(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillators for a deep, rumbling roar
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
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

    // Deep base frequency (main roar)
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(80, now);
    oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.6);

    // Mid frequency for texture
    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(120, now);
    oscillator2.frequency.exponentialRampToValueAtTime(70, now + 0.5);

    // High frequency for attack
    oscillator3.type = 'triangle';
    oscillator3.frequency.setValueAtTime(200, now);
    oscillator3.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    // Envelope for main oscillator
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode1.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    // Envelope for texture oscillator
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Envelope for attack oscillator
    gainNode3.gain.setValueAtTime(0.2, now);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

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
    
    oscillator1.stop(now + 0.9);
    oscillator2.stop(now + 0.6);
    oscillator3.stop(now + 0.3);

  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
}
