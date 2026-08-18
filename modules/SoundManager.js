/**
 * SoundManager — 音效管理模块
 * 使用 Web Audio API 播放按键、升级、成就解锁音效
 * @module modules/SoundManager
 */

class SoundManager {
  constructor() {
    this._enabled = true;
    this._audioContext = null;
    this._initialized = false;
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(fn => fn(data));
  }

  isAvailable() {
    return typeof window !== 'undefined' && window.AudioContext !== undefined;
  }

  init() {
    if (this._initialized || !this.isAvailable()) return;

    try {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (error) {
      console.warn('[SoundManager] Failed to initialize AudioContext:', error);
      this._initialized = false;
    }
  }

  setEnabled(enabled) {
    this._enabled = enabled;
  }

  is_enabled() {
    return this._enabled && this._initialized;
  }

  playCorrect() {
    if (!this.is_enabled()) return;

    try {
      const ctx = this._audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (error) {
      console.warn('[SoundManager] Failed to play correct sound:', error);
    }
  }

  playWrong() {
    if (!this.is_enabled()) return;

    try {
      const ctx = this._audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.warn('[SoundManager] Failed to play wrong sound:', error);
    }
  }

  playLevelUp() {
    if (!this.is_enabled()) return;

    try {
      const ctx = this._audioContext;
      const notes = [523, 659, 784, 1047];

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.1);

        oscillator.start(ctx.currentTime + i * 0.1);
        oscillator.stop(ctx.currentTime + i * 0.1 + 0.1);
      });
    } catch (error) {
      console.warn('[SoundManager] Failed to play level up sound:', error);
    }
  }

  playAchievementUnlocked() {
    if (!this.is_enabled()) return;

    try {
      const ctx = this._audioContext;
      const notes = [784, 988, 1175, 1319, 1568];

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.12);

        oscillator.start(ctx.currentTime + i * 0.08);
        oscillator.stop(ctx.currentTime + i * 0.08 + 0.12);
      });
    } catch (error) {
      console.warn('[SoundManager] Failed to play achievement sound:', error);
    }
  }

  destroy() {
    if (this._audioContext) {
      this._audioContext.close().catch(() => {});
      this._audioContext = null;
      this._initialized = false;
    }
  }
}

export default SoundManager;
