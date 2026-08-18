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
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

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

  /** 移除旧的事件监听器 */
  private removeOldListener(): void {
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
  }

  /** 设置事件监听 */
  private setupEventListeners(): void {
    // 先移除可能存在的旧监听器，防止累积
    this.removeOldListener();

    this.boundKeyHandler = (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    };

    document.addEventListener('keydown', this.boundKeyHandler);
  }

  /** 销毁组件（公开方法） */
  public destroy(): void {
    this.removeOldListener();
    this.container.innerHTML = '';
  }

  /** 按键事件处理 */
  private handleKeyDown(e: KeyboardEvent): void {
    // 如果课程已完成，忽略所有按键
    if (this.isComplete) {
      console.log('[TypingArea] 课程已完成，忽略按键');
      return;
    }

    // 忽略修饰键组合
    if (e.ctrlKey || e.altKey || e.metaKey) {
      console.log('[TypingArea] 忽略修饰键组合');
      return;
    }

    const key = e.key;
    console.log('[TypingArea] 按键:', key, '当前字符:', this.options.text[this.currentIndex] || '(结束)', '索引:', this.currentIndex);

    // 记录首次按键时间
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }

    // 处理退格键
    if (key === 'Backspace') {
      console.log('[TypingArea] 退格');
      this.handleBackspace();
      return;
    }

    // 处理空格键 — 自动跳过文本中的空格（不需要按空格键）
    if (key === ' ' || key === 'Space') {
      console.log('[TypingArea] 空格键按下');
      // 如果当前字符是空格，跳过；否则忽略空格键
      if (this.currentIndex < this.options.text.length && this.options.text[this.currentIndex] === ' ') {
        this.skipSpace();
      } else {
        console.log('[TypingArea] 空格键忽略，当前不是空格');
      }
      return;
    }

    // 过滤非字符键（方向键、功能键等）
    if (key.length !== 1) {
      console.log('[TypingArea] 忽略非字符键:', key);
      return;
    }

    this.handleKeyPress(key);
    if (this.options.onKeyPress) {
      this.options.onKeyPress(key);
    }
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

  /** 跳过空格字符（自动处理，不需要按空格键） */
  private skipSpace(): void {
    console.log('[TypingArea] 跳过空格开始，当前索引:', this.currentIndex, '文本:', this.options.text.substring(this.currentIndex, this.currentIndex + 20));
    let skipped = 0;
    while (this.currentIndex < this.options.text.length && this.options.text[this.currentIndex] === ' ') {
      console.log('[TypingArea] 跳过空格字符，索引:', this.currentIndex);
      this.chars[this.currentIndex].classList.remove('current');
      this.chars[this.currentIndex].classList.add('correct');
      this.correctCount++;
      this.currentIndex++;
      skipped++;
    }
    console.log('[TypingArea] 跳过了', skipped, '个空格，新索引:', this.currentIndex, '文本长度:', this.options.text.length);
    if (this.currentIndex < this.chars.length) {
      console.log('[TypingArea] 跳过空格后，下一个字符:', this.options.text[this.currentIndex]);
      this.chars[this.currentIndex].classList.add('current');
    } else {
      console.log('[TypingArea] 跳过空格后，课程完成');
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


  /** 重置 */
  reset(text: string): void {
    // 移除旧的事件监听器，避免多个监听器累积
    this.removeOldListener();

    this.options.text = text;
    this.render();

    // 重新设置事件监听器
    this.setupEventListeners();
  }

  /** 获取当前索引 */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** 获取当前文本 */
  getCurrentText(): string {
    return this.options.text;
  }

  /** 检查是否完成 */
  isDone(): boolean {
    return this.isComplete;
  }

  /** 获取当前统计 */
  getCurrentStats(): { wpm: number; accuracy: number; duration: number; correctCount: number; wrongCount: number } {
    const duration = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
    const wpm = calculateWPM(this.correctCount, duration);
    const accuracy = calculateAccuracy(this.correctCount, this.wrongCount);
    return { wpm, accuracy, duration, correctCount: this.correctCount, wrongCount: this.wrongCount };
  }
}
