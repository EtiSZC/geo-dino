// Celebration feedback utilities for egg discovery

// Trigger vibration if supported
export function triggerVibration() {
  if ('vibrate' in navigator) {
    // Pattern: short-pause-long (celebratory pattern)
    navigator.vibrate([100, 50, 200]);
  }
}

// Play a celebration sound using Web Audio API
export function playCelebrationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a cheerful ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.12;
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + (index * noteDuration);
      const endTime = startTime + noteDuration * 1.5;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
    
    // Add a final "sparkle" sound
    setTimeout(() => {
      const sparkle = audioContext.createOscillator();
      const sparkleGain = audioContext.createGain();
      
      sparkle.connect(sparkleGain);
      sparkleGain.connect(audioContext.destination);
      
      sparkle.frequency.value = 1318.51; // E6
      sparkle.type = 'sine';
      
      sparkleGain.gain.setValueAtTime(0.2, audioContext.currentTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      sparkle.start();
      sparkle.stop(audioContext.currentTime + 0.3);
    }, notes.length * noteDuration * 1000);
    
  } catch (error) {
    console.log('Audio playback not supported:', error);
  }
}

// Combined celebration effect
export function celebrateEggFound() {
  triggerVibration();
  playCelebrationSound();
}
