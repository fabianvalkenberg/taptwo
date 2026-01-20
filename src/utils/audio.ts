// Audio utility using Web Audio API for game sounds

// Create a shared AudioContext
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Resume context if it's suspended (required by browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
};

// Pickup sound - short ascending plop
export const playPickupSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
};

// Correct match sound - pleasant chime
export const playCorrectSound = () => {
  const ctx = getAudioContext();

  // Create two oscillators for a richer sound
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Major third interval (C and E)
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

  gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.3);
  osc2.stop(ctx.currentTime + 0.3);
};

// Wrong match sound - descending buzzer
export const playWrongSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.25);
};

// Tile return sound - whoosh effect
export const playReturnSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
};

// Game start sound - upbeat start tone
export const playGameStartSound = () => {
  const ctx = getAudioContext();

  // Play a quick ascending arpeggio
  const notes = [261.63, 329.63, 392.00]; // C4, E4, G4

  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    const startTime = ctx.currentTime + (index * 0.1);
    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  });
};

// Game over sound - completion fanfare
export const playGameOverSound = () => {
  const ctx = getAudioContext();

  // Play a victorious chord progression
  const chord1 = [261.63, 329.63, 392.00]; // C major
  const chord2 = [293.66, 369.99, 440.00]; // D major

  [chord1, chord2].forEach((chord, chordIndex) => {
    chord.forEach((freq) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + (chordIndex * 0.2);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  });
};
