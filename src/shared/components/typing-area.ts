/**
 * 打字输入区域组件
 * 逐字符对比显示，支持正确/错误/当前状态
 */
import type { TypingState } from '../lib/types';
import { calculateWPM, calculateAccuracy } from '../lib/utils';

export interface TypingAreaOptions {
  containerId: string;
  text: string;
  onResult?: (state: TypingState) => void;
  onKeyPress?: (key: string) => void;
}

export class TypingArea {
  private container: HTMLElement;
  private options: TypingAreaOptions;
  private chars: HTMLSpanElement[] = [];
  private currentIndex = 0;
  private correctCount = 0;
  private wrongCount = 0;
  private startTime = 0;
  private endTime = 0;
  private isComplete = false;

  constructor(options: TypingAreaOptions) {
    this.options = options;
    this.container = document.getElementById(options.containerId)!;
    this.init();
  }

  /** 初始化 */
  private init(): void {
    this.render();
    this.setupEventListeners();
  }

  /** 渲染字符 */
  private render(): void {
    this.container.innerHTML = '';
    this.chars = [];
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.isComplete = false;

    const text = this.options.text;
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      this.chars.push(span);
      this.container.appendChild(span);
    }

    if (this.chars.length > 0) {
      this.chars[0].classList.add('current');
    }
  }

  /** 设置事件监听 */
  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (this.isComplete) return;

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      if (this.startTime === 0) {
        this.startTime = Date.now();
      }

      if (key === 'Backspace') {
        this.handleBackspace();
        return;
      }

      if (key === ' ') {
        this.handleSpace();
        return;
      }

      if (key.length !== 1) return;

      this.handleKeyPress(key);
      if (this.options.onKeyPress) {
        this.options.onKeyPress(key);
      }
    });
  }

  /** 处理按键 */
  private handleKeyPress(key: string): void {
    if (this.currentIndex >= this.options.text.length) return;

    const expected = this.options.text[this.currentIndex];

    if (key === expected) {
      this.chars[this.currentIndex].classList.remove('current');
      this.chars[this.currentIndex].classList.add('correct');
      this.correctCount++;
    } else {
      this.chars[this.currentIndex].classList.remove('current');
      this.chars[this.currentIndex].classList.add('wrong');
      this.wrongCount++;
    }

    this.currentIndex++;

    if (this.currentIndex < this.chars.length) {
      this.chars[this.currentIndex].classList.add('current');
    } else {
      this.isComplete = true;
      this.endTime = Date.now();
      if (this.options.onResult) {
        const state: TypingState = {
          currentIndex: this.currentIndex,
          correctCount: this.correctCount,
          wrongCount: this.wrongCount,
          startTime: this.startTime,
          endTime: this.endTime,
          isComplete: true,
        };
        this.options.onResult(state);
      }
    }
  }

  /** 处理退格 */
  private handleBackspace(): void {
    if (this.currentIndex === 0) return;
    this.currentIndex--;
    this.chars[this.currentIndex].classList.remove('correct', 'wrong');
    this.chars[this.currentIndex].classList.add('current');
  }

  /** 处理空格键 */
  private handleSpace(): void {
    this.handleKeyPress(' ');
  }

  /** 重置 */
  reset(text: string): void {
    this.options.text = text;
    this.render();
  }

  /** 获取当前索引 */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** 获取当前文本 */
  getCurrentText(): string {
    return this.options.text;
  }

  /** 获取当前统计 */
  getCurrentStats(): { wpm: number; accuracy: number; duration: number } {
    const duration = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
    const wpm = calculateWPM(this.correctCount, duration);
    const accuracy = calculateAccuracy(this.correctCount, this.wrongCount);
    return { wpm, accuracy, duration };
  }
}
