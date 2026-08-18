/**
 * LevelSystem — 等级系统
 * 管理 10 级等级体系，经验累积与升级判定
 * @module modules/LevelSystem
 */

import store from './StorageManager.js';

const LEVELS = [
  { level: 1, name: '打字新手', nameEn: 'Typing Beginner', expRequired: 0, icon: '🌱' },
  { level: 2, name: '字母达人', nameEn: 'Letter Master', expRequired: 100, icon: '📝' },
  { level: 3, name: '打字学徒', nameEn: 'Typing Apprentice', expRequired: 250, icon: '✏️' },
  { level: 4, name: '单词达人', nameEn: 'Word Master', expRequired: 500, icon: '📖' },
  { level: 5, name: '句子达人', nameEn: 'Sentence Master', expRequired: 800, icon: '📋' },
  { level: 6, name: '速度达人', nameEn: 'Speed Master', expRequired: 1200, icon: '⚡' },
  { level: 7, name: '打字高手', nameEn: 'Typing Expert', expRequired: 1800, icon: '🏆' },
  { level: 8, name: '键盘大师', nameEn: 'Keyboard Master', expRequired: 2500, icon: '👑' },
  { level: 9, name: '打字传奇', nameEn: 'Typing Legend', expRequired: 3500, icon: '🌟' },
  { level: 10, name: '打字之神', nameEn: 'Typing God', expRequired: 5000, icon: '🏅' }
];

/** 难度系数 */
const DIFFICULTY_MODIFIERS = { easy: 0.8, normal: 1.0, hard: 1.5 };

/** 每正确按键获得的经验值 */
const EXP_PER_KEY = 1;
/** 每次练习额外经验加成 */
const SESSION_BONUS = 5;

class LevelSystem {
  constructor() {
    this._listeners = {};
  }

  /** 注册事件监听 */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  /** 触发事件 */
  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(fn => fn(data));
  }

  /**
   * 获取当前等级信息
   * @returns {Promise<Object>} 当前等级对象
   */
  async getCurrentLevel() {
    const progress = await store.get('progress');
    const exp = progress.experience;
    return this.getLevelAtExp(exp);
  }

  /**
   * 根据经验值计算等级
   * @param {number} exp - 当前经验值
   * @returns {Object} 等级信息 { level, name, nameEn, expRequired, icon, nextLevel }
   */
  getLevelAtExp(exp) {
    let currentLevel = LEVELS[0];
    let nextLevel = null;

    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (exp >= LEVELS[i].expRequired) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }

    return {
      ...currentLevel,
      nextLevel,
      progress: nextLevel
        ? ((exp - currentLevel.expRequired) / (nextLevel.expRequired - currentLevel.expRequired)) * 100
        : 100
    };
  }

  /**
   * 增加经验值，可能触发升级
   * @param {number} baseExp - 基础经验值
   * @param {string} difficulty - 难度（影响经验倍率）
   * @returns {Object} 升级信息 { leveledUp, oldLevel, newLevel, totalExp, expGained }
   */
  async addExperience(baseExp, difficulty = 'normal') {
    const progress = await store.get('progress');
    const modifier = DIFFICULTY_MODIFIERS[difficulty] || 1;
    const gained = Math.round((baseExp + SESSION_BONUS) * modifier);
    const oldLevel = progress.currentLevel;
    const newExp = progress.experience + gained;

    await store.set('progress.experience', newExp);

    const newLevelInfo = this.getLevelAtExp(newExp);
    const leveledUp = newLevelInfo.level > oldLevel;

    if (leveledUp) {
      await store.set('progress.currentLevel', newLevelInfo.level);
      this._emit('onLevelUp', {
        oldLevel,
        newLevel: newLevelInfo.level,
        totalExp: newExp,
        levelName: newLevelInfo.name,
        levelIcon: newLevelInfo.icon
      });
    }

    return {
      leveledUp,
      oldLevel,
      newLevel: newLevelInfo.level,
      totalExp: newExp,
      expGained: gained
    };
  }

  /**
   * 获取当前等级进度（0-100）
   * @returns {Promise<Object>} { current, next, percent }
   */
  async getLevelProgress() {
    const progress = await store.get('progress');
    return this.getLevelAtExp(progress.experience);
  }

  /**
   * 获取等级名称
   * @param {number} level - 等级号
   * @returns {string} 等级名称
   */
  getLevelName(level) {
    const lvl = LEVELS.find(l => l.level === level);
    return lvl ? lvl.name : '未知等级';
  }

  /**
   * 获取难度系数
   * @param {string} difficulty - 难度
   * @returns {number}
   */
  getDifficultyModifier(difficulty) {
    return DIFFICULTY_MODIFIERS[difficulty] || 1;
  }

  /**
   * 获取所有等级定义
   * @returns {Array<Object>}
   */
  getAllLevels() {
    return [...LEVELS];
  }
}

export default new LevelSystem();
