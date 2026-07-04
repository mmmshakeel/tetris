export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = true;
  private isMusicPlaying: boolean = false;
  private timerId: any = null;
  private currentStep: number = 0;

  // Korobeiniki (Classic Tetris theme)
  // Frequency in Hz, duration in milliseconds
  private MELODY = [
    { freq: 659.25, dur: 300 }, // E5
    { freq: 493.88, dur: 150 }, // B4
    { freq: 523.25, dur: 150 }, // C5
    { freq: 587.33, dur: 300 }, // D5
    { freq: 523.25, dur: 150 }, // C5
    { freq: 493.88, dur: 150 }, // B4
    { freq: 440.00, dur: 300 }, // A4
    { freq: 440.00, dur: 150 }, // A4
    { freq: 523.25, dur: 150 }, // C5
    { freq: 659.25, dur: 300 }, // E5
    { freq: 587.33, dur: 150 }, // D5
    { freq: 523.25, dur: 150 }, // C5
    { freq: 493.88, dur: 450 }, // B4
    { freq: 523.25, dur: 150 }, // C5
    { freq: 587.33, dur: 300 }, // D5
    { freq: 659.25, dur: 300 }, // E5
    { freq: 523.25, dur: 300 }, // C5
    { freq: 440.00, dur: 300 }, // A4
    { freq: 440.00, dur: 450 }, // A4
    { freq: 0, dur: 150 },      // Rest

    { freq: 587.33, dur: 450 }, // D5
    { freq: 698.46, dur: 150 }, // F5
    { freq: 880.00, dur: 300 }, // A5
    { freq: 783.99, dur: 150 }, // G5
    { freq: 698.46, dur: 150 }, // F5
    { freq: 659.25, dur: 450 }, // E5
    { freq: 523.25, dur: 150 }, // C5
    { freq: 659.25, dur: 300 }, // E5
    { freq: 587.33, dur: 150 }, // D5
    { freq: 523.25, dur: 150 }, // C5
    { freq: 493.88, dur: 300 }, // B4
    { freq: 493.88, dur: 150 }, // B4
    { freq: 523.25, dur: 150 }, // C5
    { freq: 587.33, dur: 300 }, // D5
    { freq: 659.25, dur: 300 }, // E5
    { freq: 523.25, dur: 300 }, // C5
    { freq: 440.00, dur: 300 }, // A4
    { freq: 440.00, dur: 450 }, // A4
    { freq: 0, dur: 150 }       // Rest
  ];

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser policies
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.enabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  getMusicEnabled() {
    return this.musicEnabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (freq === 0) return; // Rest note

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  startMusic() {
    if (!this.enabled || !this.musicEnabled || this.isMusicPlaying) return;
    this.init();
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.playMusicStep();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private playMusicStep() {
    if (!this.isMusicPlaying || !this.enabled || !this.musicEnabled) {
      this.isMusicPlaying = false;
      return;
    }

    const currentNote = this.MELODY[this.currentStep];
    const durInSeconds = currentNote.dur / 1000;

    // Play with a soft triangle wave as background music so it's not piercing
    this.playTone(currentNote.freq, 'triangle', durInSeconds, 0.025);

    this.currentStep = (this.currentStep + 1) % this.MELODY.length;

    this.timerId = setTimeout(() => {
      this.playMusicStep();
    }, currentNote.dur);
  }

  playMove() {
    this.playTone(150, 'square', 0.05, 0.03);
  }

  playRotate() {
    this.playTone(300, 'triangle', 0.08, 0.03);
  }

  playDrop() {
    this.playTone(100, 'square', 0.1, 0.05);
  }

  playLineClear() {
    this.playTone(600, 'sine', 0.2, 0.08);
    setTimeout(() => this.playTone(800, 'sine', 0.2, 0.08), 100);
  }

  playTetris() {
    const now = this.ctx?.currentTime || 0;
    [400, 500, 600, 800].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.3, 0.08), i * 100);
    });
  }

  playLevelUp() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.4, 0.03), i * 150);
    });
  }

  playGameOver() {
    this.stopMusic();
    [400, 300, 200, 150].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.5, 0.03), i * 200);
    });
  }
}
