/**
 * SettingsManager — 用户设置管理
 * 管理用户偏好设置（键盘布局、字体大小、主题、音效、难度）
 * @module modules/SettingsManager
 */

import store from './StorageManager.js';

const VALID_LAYOUTS = ['QWERTY', 'AZERTY'];
const VALID_THEMES = ['light', 'dark'];
const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'];
const VALID_MODES = ['letters', 'words', 'sentences', 'free', 'finger'];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48];

/**
 * 设置项校验器
 * @private
 */
const validators = {
  keyboardLayout: (v) => VALID_LAYOUTS.includes(v),
  fontSize: (v) => Number.isInteger(v) && FONT_SIZES.includes(v),
  theme: (v) => VALID_THEMES.includes(v),
  soundEnabled: (v) => typeof v === 'boolean',
  difficulty: (v) => VALID_DIFFICULTIES.includes(v),
  defaultMode: (v) => VALID_MODES.includes(v)
};

class SettingsManager {
  constructor() {
    this._cached = null;
  }

  /**
   * 获取单个设置项
   * @param {string} key - 设置项名称
   * @returns {Promise<any>}
   */
  async getSetting(key) {
    const all = await store.get('settings');
    return all[key];
  }

  /**
   * 获取所有设置
   * @returns {Promise<Object>}
   */
  async getAllSettings() {
    const settings = await store.get('settings');
    if (!this._cached) {
      this._cached = settings;
    }
    return settings;
  }

  /**
   * 设置单个值，校验后写入
   * @param {string} key - 设置项名称
   * @param {any} value - 要设置的值
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    if (!validators[key]) {
      throw new Error(`Unknown setting key: ${key}`);
    }
    if (!validators[key](value)) {
      throw new Error(`Invalid value for ${key}: ${value}`);
    }
    await store.update('settings', (current) => ({
      ...current,
      [key]: value
    }));
    this._cached = null; // 清除缓存
    return;
  }

  /**
   * 批量更新多个设置
   * @param {Object} partial - 要更新的设置项
   * @returns {Promise<void>}
   */
  async updateSettings(partial) {
    for (const key of Object.keys(partial)) {
      if (!validators[key]) {
        throw new Error(`Unknown setting key: ${key}`);
      }
      if (!validators[key](partial[key])) {
        throw new Error(`Invalid value for ${key}: ${partial[key]}`);
      }
    }
    await store.update('settings', (current) => ({
      ...current,
      ...partial
    }));
    this._cached = null;
  }

  /**
   * 恢复所有设置为默认值
   * @returns {Promise<void>}
   */
  async resetToDefaults() {
    const defaults = store.getDefaults();
    await store.set('settings', defaults.settings);
    this._cached = null;
  }

  /**
   * 获取支持的键盘布局列表
   * @returns {Array<string>}
   */
  getValidLayouts() {
    return [...VALID_LAYOUTS];
  }

  /**
   * 获取主题选项
   * @returns {Array<{value: string, label: string}>}
   */
  getThemeOptions() {
    return [
      { value: 'light', label: '浅色' },
      { value: 'dark', label: '深色' }
    ];
  }

  /**
   * 获取可用字体大小列表
   * @returns {Array<number>}
   */
  getFontSizes() {
    return [...FONT_SIZES];
  }

  /**
   * 应用主题到 DOM（设置 data-theme 属性）
   * @param {string} theme - 'light' 或 'dark'
   * @returns {void}
   */
  applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  /**
   * 应用字体大小到 DOM
   * @param {number} size - 字体大小（px）
   * @returns {void}
   */
  applyFontSize(size) {
    document.documentElement.style.fontSize = `${size}px`;
  }
}

export default new SettingsManager();
