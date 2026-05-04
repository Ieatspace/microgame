export type GameSound = "correct" | "wrong" | "coin" | "attack" | "boss";

let audioContext: AudioContext | undefined;

export function playGameSound(sound: GameSound) {
  if (typeof window === "undefined") {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const sequence = getSoundSequence(sound);

  for (const note of sequence) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, now + note.delay);
    gain.gain.setValueAtTime(0.0001, now + note.delay);
    gain.gain.exponentialRampToValueAtTime(note.volume, now + note.delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.delay + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + note.delay);
    oscillator.stop(now + note.delay + note.duration + 0.02);
  }
}

function getAudioContext() {
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function getSoundSequence(sound: GameSound) {
  if (sound === "correct") {
    return [
      note(660, 0, 0.08, 0.04, "square"),
      note(880, 0.08, 0.11, 0.035, "square")
    ];
  }

  if (sound === "wrong") {
    return [
      note(220, 0, 0.12, 0.05, "sawtooth"),
      note(150, 0.09, 0.18, 0.04, "sawtooth")
    ];
  }

  if (sound === "coin") {
    return [
      note(988, 0, 0.05, 0.025, "triangle"),
      note(1320, 0.05, 0.08, 0.022, "triangle")
    ];
  }

  if (sound === "boss") {
    return [
      note(86, 0, 0.32, 0.07, "sawtooth"),
      note(58, 0.12, 0.42, 0.055, "sawtooth")
    ];
  }

  return [note(340, 0, 0.07, 0.028, "square")];
}

function note(
  frequency: number,
  delay: number,
  duration: number,
  volume: number,
  type: OscillatorType
) {
  return { frequency, delay, duration, volume, type };
}
