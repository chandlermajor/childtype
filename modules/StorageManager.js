/**
 * StorageManager — Chrome Storage 封装
 * 管理所有 chrome.storage.sync 的读写操作
 * @module modules/StorageManager
 */

const STORAGE_KEYS = ['settings', 'progress', 'achievements'];

const DEFAULTS = {
  settings: {
    keyboardLayout: 'QWERTY',
    fontSize: 16,
    theme: 'light',
    soundEnabled: true,
    difficulty: 'normal',
    defaultMode: 'letters'
  },
  progress: {
    currentLevel: 1,
    experience: 0,
    totalPracticeMinutes: 0,
    bestWPM: 0,
    totalKeystrokes: 0,
    modeStats: {
      letters: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      words: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      sentences: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      free: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      finger: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 }
    },
    dailyHistory: []
  },
  achievements: {
    unlocked: [],
    locked: []
  }
};

class StorageManager {
  constructor() {
    this._initialized = false;
  }

  /**
   * 确保 storage 有默认数据（首次安装时初始化）
   * @returns {Promise<void>}
   */
  async _ensureDefaults() {
    if (this._initialized) return;

    const existing = await this._getAll();
    const merged = this._deepMerge(DEFAULTS, existing);
    await this._setAll(merged);
    this._initialized = true;
  }

  /**
   * 读取指定 key 的数据，支持嵌套路径
   * @param {string} key - 存储键路径（如 'progress.modeStats'）
   * @returns {Promise<any>}
   */
  async get(key) {
    await this._ensureDefaults();
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * 批量读取多个 key
   * @param {string[]} keys - 存储键数组
   * @returns {Promise<Object>}
   */
  async getAll(keys) {
    await this._ensureDefaults();
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 写入指定 key 的数据，支持嵌套路径
   * @param {string} key - 存储键路径
   * @param {any} value - 要写入的值
   * @returns {Promise<void>}
   */
  async set(key, value) {
    await this._ensureDefaults();
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 读取 → 修改 → 写入，保证原子性
   * @param {string} key - 存储键路径
   * @param {Function} updaterFn - (currentValue) => newValue
   * @returns {Promise<void>}
   */
  async update(key, updaterFn) {
    const current = await this.get(key);
    const updated = updaterFn(current);
    await this.set(key, updated);
  }

  /**
   * 删除指定 key
   * @param {string} key - 存储键路径
   * @returns {Promise<void>}
   */
  async remove(key) {
    await this._ensureDefaults();
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清除所有存储数据
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this._initialized = false;
          resolve();
        }
      });
    });
  }

  /**
   * 返回所有 storage key 的默认值
   * @returns {Object}
   */
  getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  /**
   * 内部：读取所有 storage keys
   * @private
   * @returns {Promise<Object>}
   */
  async _getAll() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result || {});
        }
      });
    });
  }

  /**
   * 内部：批量写入
   * @private
   * @param {Object} data - 要写入的数据
   * @returns {Promise<void>}
   */
  async _setAll(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 内部：深度合并对象
   * @private
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的对象
   */
  _deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = this._deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

export default new StorageManager();
