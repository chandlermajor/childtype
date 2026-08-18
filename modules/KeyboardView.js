/**
 * KeyboardView — 虚拟键盘渲染模块
 * 负责渲染 QWERTY/AZERTY 键盘布局、按键高亮、手指分区、指法专项模式
 * @module modules/KeyboardView
 */

import layouts from '../data/keyboard-layouts.js';

class KeyboardView {
  constructor(containerEl) {
    this._container = containerEl;
    this._layout = 'QWERTY';
    this._fingerMode = null;
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

  render(layoutName = 'QWERTY', fingerMapOverride = null) {
    this._layout = layoutName;
    const layout = layouts[layoutName];
    if (!layout) return;

    this._container.innerHTML = '';
    const fingerMap = fingerMapOverride || layout.fingerMap;

    layout.rows.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'overlay__keyboard-row';
      rowEl.dataset.row = rowIndex;

      row.forEach((key) => {
        const keyEl = document.createElement('div');
        const isSpace = key === 'Space';
        const isEnter = key === 'Enter';
        const isBackspace = key === 'Backspace';
        const isShift = key === 'Shift';

        keyEl.className = 'overlay__key';
        keyEl.dataset.key = key.toLowerCase();
        keyEl.dataset.finger = fingerMap[key] || 'left-pinky';

        if (isSpace) keyEl.classList.add('overlay__key--space');
        if (isEnter) keyEl.classList.add('overlay__key--enter');
        if (isBackspace) keyEl.classList.add('overlay__key--backspace');
        if (isShift) keyEl.classList.add('overlay__key--shift');
        if (rowIndex === 2) keyEl.classList.add('overlay__key--home');

        let displayChar = key;
        if (key === 'Space') displayChar = 'Space';
        if (key === 'Enter') displayChar = 'Enter';
        if (key === 'Backspace') displayChar = '⌫';
        if (key === 'Shift') displayChar = 'Shift';

        keyEl.textContent = displayChar;

        if (rowIndex === 2 && (key === 'f' || key === 'j')) {
          keyEl.title = '基准键';
        }

        rowEl.appendChild(keyEl);
      });

      this._container.appendChild(rowEl);
    });
  }

  highlightKey(keyChar, state) {
    const allKeys = this._container.querySelectorAll('.overlay__key');
    allKeys.forEach(keyEl => {
      keyEl.classList.remove('overlay__key--correct', 'overlay__key--wrong', 'overlay__key--target');
    });

    if (!keyChar) return;

    const targetKey = this._container.querySelector(`.overlay__key[data-key="${keyChar.toLowerCase()}"]`);
    if (!targetKey) return;

    if (state === 'correct') {
      targetKey.classList.add('overlay__key--correct');
    } else if (state === 'wrong') {
      targetKey.classList.add('overlay__key--wrong');
    } else if (state === 'target') {
      targetKey.classList.add('overlay__key--target');
    }
  }

  animateKey(keyChar, pressed) {
    const keyEl = this._container.querySelector(`.overlay__key[data-key="${keyChar.toLowerCase()}"]`);
    if (keyEl) {
      if (pressed) {
        keyEl.classList.add('overlay__key--pressed');
        setTimeout(() => keyEl.classList.remove('overlay__key--pressed'), 100);
      }
    }
  }

  highlightNextKey(targetChar) {
    const allKeys = this._container.querySelectorAll('.overlay__key');
    allKeys.forEach(keyEl => {
      keyEl.classList.remove('overlay__key--target');
    });

    if (!targetChar) return;

    const targetKey = this._container.querySelector(`.overlay__key[data-key="${targetChar.toLowerCase()}"]`);
    if (targetKey) {
      targetKey.classList.add('overlay__key--target');
    }
  }

  setFingerMode(fingerId) {
    this._fingerMode = fingerId;
    const allKeys = this._container.querySelectorAll('.overlay__key');
    allKeys.forEach(keyEl => {
      const keyFinger = keyEl.dataset.finger;
      if (fingerId && keyFinger !== fingerId) {
        keyEl.style.opacity = '0.15';
      } else {
        keyEl.style.opacity = '1';
      }
    });
  }

  clearFingerMode() {
    this._fingerMode = null;
    const allKeys = this._container.querySelectorAll('.overlay__key');
    allKeys.forEach(keyEl => {
      keyEl.style.opacity = '1';
    });
  }

  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  setFontSize(size) {
    const allKeys = this._container.querySelectorAll('.overlay__key');
    allKeys.forEach(keyEl => {
      keyEl.style.fontSize = `${size}px`;
      keyEl.style.height = `${Math.max(size + 12, 36)}px`;
      keyEl.style.minWidth = `${Math.max(size + 16, 36)}px`;
    });
  }

  show() {
    const overlay = document.getElementById('childtype-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  hide() {
    const overlay = document.getElementById('childtype-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  destroy() {
    this._container.innerHTML = '';
    this._listeners = {};
  }
}

export default KeyboardView;
