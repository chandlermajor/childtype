/**
 * 虚拟键盘组件
 * 支持高亮、手指标注、按键弹跳动画、闪烁提示
 */
import type { Finger } from '../lib/types';
import { FINGER_COLORS, KEYBOARD_ROWS, FINGER_MAP } from '../lib/constants';

export interface KeyboardOptions {
  containerId: string;
  onKeyPress?: (key: string) => void;
  highlightKey?: string | null;
  showFingerLabels?: boolean;
  soundEnabled?: boolean;
  flashKey?: string | null;  // 闪烁提示的按键
}

export class VirtualKeyboard {
  private container: HTMLElement;
  private options: KeyboardOptions;
  private pressedKeys: Set<string> = new Set();
  private audioCtx: AudioContext | null = null;
  private flashInterval: number | null = null;

  constructor(options: KeyboardOptions) {
    this.options = options;
    this.container = document.getElementById(options.containerId)!;
    this.render();
  }

  /** 初始化音频上下文 */
  private initAudio(): AudioContext | null {
    if (!this.options.soundEnabled) return null;
    try {
      return new AudioContext();
    } catch {
      return null;
    }
  }

  /** 播放按键音效 */
  private playClickSound(): void {
    if (!this.options.soundEnabled) return;
    if (!this.audioCtx) {
      this.audioCtx = this.initAudio();
    }
    if (!this.audioCtx) return;

    try {
      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
      oscillator.stop(this.audioCtx.currentTime + 0.05);
    } catch {
      // 忽略音频错误
    }
  }

  /** 渲染键盘 */
  private render(): void {
    this.container.innerHTML = '';

    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard';

    KEYBOARD_ROWS.forEach((row, rowIdx) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';

      row.forEach((key) => {
        if (key === 'Space') {
          const spaceKey = this.createKey('Space', ' ');
          spaceKey.classList.add('key', 'space');
          rowDiv.appendChild(spaceKey);
          return;
        }

        const finger = FINGER_MAP[key.toLowerCase()] || 'left-index';
        const keyEl = this.createKey(key, key);
        keyEl.style.backgroundColor = FINGER_COLORS[finger as Finger];
        keyEl.dataset.key = key;

        if (this.options.showFingerLabels) {
          const label = document.createElement('span');
          label.className = 'key-finger-label';
          label.textContent = finger.replace('-', ' ');
          keyEl.appendChild(label);
        }

        rowDiv.appendChild(keyEl);
      });

      keyboard.appendChild(rowDiv);
    });

    this.container.appendChild(keyboard);
  }

  /** 创建单个按键元素 */
  private createKey(displayChar: string, dataKey: string): HTMLElement {
    const key = document.createElement('div');
    key.className = 'key';
    key.dataset.key = dataKey;

    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = displayChar;
    key.appendChild(label);

    return key;
  }

  /** 高亮指定按键 */
  highlightKey(key: string | null): void {
    this.container.querySelectorAll('.key.highlight').forEach((el) => {
      el.classList.remove('highlight');
    });

    if (key) {
      const keyEl = this.container.querySelector(`.key[data-key="${key.toUpperCase()}"]`);
      if (keyEl) {
        keyEl.classList.add('highlight');
      }
    }
  }

  /** 闪烁提示按键 */
  flashKey(key: string | null): void {
    // 清除之前的闪烁
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }

    if (!key) {
      this.container.querySelectorAll('.key.flash').forEach((el) => {
        el.classList.remove('flash');
      });
      return;
    }

    const keyEl = this.container.querySelector(`.key[data-key="${key.toUpperCase()}"]`);
    if (!keyEl) return;

    let flashing = true;
    this.flashInterval = window.setInterval(() => {
      if (!flashing) return;
      keyEl.classList.toggle('flash');
    }, 500);
  }

  /** 按下按键动画 */
  pressKey(key: string): void {
    const keyEl = this.container.querySelector(`.key[data-key="${key.toUpperCase()}"]`);
    if (keyEl) {
      keyEl.classList.add('pressed');
      this.pressedKeys.add(key.toUpperCase());
      this.playClickSound();
      if (this.options.onKeyPress) {
        this.options.onKeyPress(key);
      }
    }
  }

  /** 释放按键动画 */
  releaseKey(key: string): void {
    const keyEl = this.container.querySelector(`.key[data-key="${key.toUpperCase()}"]`);
    if (keyEl) {
      keyEl.classList.remove('pressed');
      this.pressedKeys.delete(key.toUpperCase());
    }
  }

  /** 更新高亮 */
  updateHighlight(key: string | null): void {
    this.highlightKey(key);
  }

  /** 销毁 */
  destroy(): void {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.container.innerHTML = '';
  }
}
