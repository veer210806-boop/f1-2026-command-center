// ============================================================
// f1AudioEngine.js — Authentic Formula 1 Web Audio Synthesizer
// Zero external files, zero 404s. Synthesizes genuine F1 radio beeps,
// radio static filter, 350kW MGU-K engine whine, and steward alerts.
// ============================================================

class F1AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // ── Authentic F1 Team Radio Beep (Two-Tone "BEEP-BOOP") ──
  playRadioBeep() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // 880Hz
      osc.frequency.setValueAtTime(1320, now + 0.05); // 1320Hz

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  // ── 350kW MGU-K Electric Motor Whine + Turbo Rev ──────────
  playMguKBoost() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // High-pitch electric whine climbing from 1200Hz to 3200Hz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(3400, now + 0.6);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      // Lowpass filter to smooth the harsh sawtooth
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (_) {}
  }

  // ── Overtake Broadcast Chime ─────────────────────────────
  playOvertakeChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch (_) {}
  }

  // ── Safety Car / Virtual Safety Car Siren Alert ───────────
  playSafetyCarAlert() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.15);
      osc.frequency.setValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (_) {}
  }

  // ── Synthesize Team Radio Transmission with Voice ─────────
  speakRadioMessage(driverName, message) {
    if (this.isMuted) return;
    this.playRadioBeep();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.15; // Fast pit-wall tempo
          utterance.pitch = 1.05;
          utterance.volume = 0.85;

          utterance.onend = () => {
            this.playRadioBeep(); // Closing radio click
          };

          window.speechSynthesis.speak(utterance);
        } catch (_) {}
      }, 120);
    }
  }
}

export const f1Audio = new F1AudioEngine();
