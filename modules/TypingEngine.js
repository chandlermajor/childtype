/**
 * TypingEngine — 打字判定引擎
 * 处理按键判定、目标生成、WPM/准确率/连击计算
 * @module modules/TypingEngine
 */

import words from '../data/words.js';
import sentences from '../data/sentences.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const DIFFICULTY_MODIFIERS = { easy: 0.8, normal: 1.0, hard: 1.5 };

class TypingEngine {
  constructor(options = {}) {
    this._mode = options.mode || 'letters';
    this._difficulty = options.difficulty || 'normal';
    this._fingerId = options.fingerId || null;
    this._isActive = false;
    this._isPaused = false;
    this._startTime = null;
    this._pausedTime = 0;
    this._lastKeyTime = null;
    this._totalKeystrokes = 0;
    this._correctKeystrokes = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._errors = 0;
    this._currentTarget = null;
    this._currentIndex = 0;
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

  start() {
    this._isActive = true;
    this._isPaused = false;
    this._startTime = null;
    this._pausedTime = 0;
    this._lastKeyTime = null;
    this._totalKeystrokes = 0;
    this._correctKeystrokes = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._errors = 0;
    this._currentIndex = 0;

    this._setNextTarget();
    return true;
  }

  stop() {
    this._isActive = false;
    return {
      wpm: this._calculateWPM(),
      accuracy: this._getAccuracy(),
      streak: this._streak,
      maxStreak: this._maxStreak,
      totalKeystrokes: this._totalKeystrokes,
      correctKeystrokes: this._correctKeystrokes,
      errors: this._errors,
      elapsedSeconds: this._getElapsedSeconds(),
      mode: this._mode
    };
  }

  pause() {
    if (!this._isActive || this._isPaused) return false;
    this._isPaused = true;
    this._pausedTime += Date.now() - this._pauseStart;
    return true;
  }

  resume() {
    if (!this._isPaused) return false;
    this._isPaused = false;
    this._pauseStart = Date.now();
    return true;
  }

  submitKey(pressedKey, code) {
    if (!this._isActive || this._isPaused) {
      return { correct: false, expected: null, actual: pressedKey, message: 'Session not active' };
    }

    if (!this._startTime) {
      this._startTime = Date.now();
    }

    this._totalKeystrokes++;
    this._lastKeyTime = Date.now();

    const expected = this._getExpectedChar();

    if (expected === null) {
      this._setNextTarget();
      return { correct: null, expected: null, actual: pressedKey, message: 'Skip target' };
    }

    const isCorrect = pressedKey.toLowerCase() === expected.toLowerCase();

    if (isCorrect) {
      this._correctKeystrokes++;
      this._streak++;
      if (this._streak > this._maxStreak) this._maxStreak = this._streak;

      this._advanceInTarget();

      return {
        correct: true,
        expected,
        actual: pressedKey,
        target: this._currentTarget,
        wpm: this._calculateWPM(),
        accuracy: this._getAccuracy(),
        streak: this._streak,
        maxStreak: this._maxStreak,
        totalKeystrokes: this._totalKeystrokes,
        correctKeystrokes: this._correctKeystrokes,
        elapsedSeconds: this._getElapsedSeconds(),
        sessionActive: this._isActive
      };
    } else {
      this._errors++;
      this._streak = 0;

      return {
        correct: false,
        expected,
        actual: pressedKey,
        target: this._currentTarget,
        wpm: this._calculateWPM(),
        accuracy: this._getAccuracy(),
        streak: 0,
        maxStreak: this._maxStreak,
        totalKeystrokes: this._totalKeystrokes,
        correctKeystrokes: this._correctKeystrokes,
        elapsedSeconds: this._getElapsedSeconds(),
        sessionActive: this._isActive
      };
    }
  }

  resetCurrentTarget() {
    this._setNextTarget();
  }

  switchMode(mode, data) {
    this._mode = mode;
    if (data) {
      this._customData = data;
    }
    this._currentIndex = 0;
    this._setNextTarget();
  }

  setDifficulty(difficulty) {
    this._difficulty = difficulty;
  }

  _setNextTarget() {
    switch (this._mode) {
      case 'letters':
        this._currentTarget = this._getRandomLetter();
        this._currentIndex = 0;
        break;
      case 'words':
        this._currentTarget = this._getRandomWord();
        this._currentIndex = 0;
        break;
      case 'sentences':
        this._currentTarget = this._getRandomSentence();
        this._currentIndex = 0;
        break;
      case 'free':
        this._currentTarget = null;
        break;
      case 'finger':
        this._currentTarget = this._getRandomLetter();
        this._currentIndex = 0;
        break;
      default:
        this._currentTarget = this._getRandomLetter();
        this._currentIndex = 0;
    }
  }

  _getExpectedChar() {
    if (!this._currentTarget) return null;

    if (typeof this._currentTarget === 'string') {
      return this._currentTarget;
    }

    if (this._currentTarget.text) {
      const text = this._currentTarget.text;
      if (this._currentIndex < text.length) {
        return text[this._currentIndex];
      }
      return null;
    }

    return null;
  }

  _advanceInTarget() {
    if (this._mode === 'letters') {
      this._setNextTarget();
    } else if (this._currentTarget && this._currentTarget.text) {
      this._currentIndex++;
      if (this._currentIndex >= this._currentTarget.text.length) {
        this._setNextTarget();
      }
    } else if (this._mode !== 'free') {
      this._setNextTarget();
    }
  }

  _getRandomLetter() {
    return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  _getRandomWord() {
    let pool;
    switch (this._difficulty) {
      case 'easy': pool = words.easy; break;
      case 'hard': pool = words.hard; break;
      default: pool = Math.random() < 0.5 ? words.easy.concat(words.medium) : words.medium;
    }
    const text = pool[Math.floor(Math.random() * pool.length)];
    return { text, difficulty: this._difficulty };
  }

  _getRandomSentence() {
    let pool;
    switch (this._difficulty) {
      case 'easy': pool = sentences.easy; break;
      case 'hard': pool = sentences.hard; break;
      default: pool = Math.random() < 0.5 ? sentences.easy : sentences.medium;
    }
    const text = pool[Math.floor(Math.random() * pool.length)];
    return { text, difficulty: this._difficulty };
  }

  _calculateWPM() {
    if (!this._startTime || this._totalKeystrokes < 5) return 0;
    const elapsed = this._getElapsedSeconds();
    if (elapsed <= 0) return 0;
    const words = this._correctKeystrokes / 5;
    const minutes = elapsed / 60;
    return Math.round((words / minutes) * 10) / 10;
  }

  _getAccuracy() {
    if (this._totalKeystrokes === 0) return 0;
    return Math.round((this._correctKeystrokes / this._totalKeystrokes) * 1000) / 10;
  }

  _getElapsedSeconds() {
    if (!this._startTime) return 0;
    return (Date.now() - this._startTime - this._pausedTime) / 1000;
  }

  getStats() {
    return {
      wpm: this._calculateWPM(),
      accuracy: this._getAccuracy(),
      streak: this._streak,
      maxStreak: this._maxStreak,
      totalKeystrokes: this._totalKeystrokes,
      correctKeystrokes: this._correctKeystrokes,
      errors: this._errors,
      elapsedSeconds: this._getElapsedSeconds(),
      mode: this._mode
    };
  }

  getCurrentTarget() {
    return this._currentTarget;
  }

  isPaused() {
    return this._isPaused;
  }

  isActive() {
    return this._isActive;
  }

  getMode() {
    return this._mode;
  }
}

export default TypingEngine;
