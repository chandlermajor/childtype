/**
 * LevelSystem — 等级系统
 * 管理 25 级等级体系，经验累积与升级判定
 * @module modules/LevelSystem
 */

import store from './StorageManager.js';
import LEVELS from '../data/levels.js';

/** 难度系数 */
const DIFFICULTY_MODIFIERS = { easy: 0.8, normal: 1.0, hard: 1.5 };

/** 每正确按键获得的经验值 */
const EXP_PER_KEY = 1;
/** 每次练习额外经验加成 */
const SESSION_BONUS = 5;

class LevelSystem {
  constructor() {
    this._listeners = {};
    this._addingExp = false;
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
    return {
      ...this.getLevelAtExp(exp),
      experience: exp
    };
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
   * @param {string} source - 经验来源（session/achievement 等）
   * @returns {Object} 升级信息 { leveledUp, oldLevel, newLevel, totalExp, expGained }
   */
  async addExperience(baseExp, difficulty = 'normal', source = 'session') {
    if (this._addingExp) {
      return { leveledUp: false, oldLevel: (await store.get('progress')).currentLevel, newLevel: (await store.get('progress')).currentLevel, totalExp: (await store.get('progress')).experience, expGained: 0 };
    }
    this._addingExp = true;
    try {
      return await this._addExperienceInternal(baseExp, difficulty, source);
    } finally {
      this._addingExp = false;
    }
  }

  async _addExperienceInternal(baseExp, difficulty, source) {
    const progress = await store.get('progress');
    const modifier = DIFFICULTY_MODIFIERS[difficulty] || 1;
    const gained = Math.round((baseExp + SESSION_BONUS) * modifier);
    const oldLevel = progress.currentLevel;
    const newExp = progress.experience + gained;

    const newLevelInfo = this.getLevelAtExp(newExp);
    const leveledUp = newLevelInfo.level > oldLevel;

    await store.update('progress', (current) => ({
      ...current,
      experience: newExp,
      currentLevel: newLevelInfo.level
    }));

    if (leveledUp) {
      this._emit('onLevelUp', {
        oldLevel,
        newLevel: newLevelInfo.level,
        totalExp: newExp,
        levelName: newLevelInfo.name,
        levelIcon: newLevelInfo.icon,
        source
      });

      // 等级提升时检查等级相关成就
      if (source === 'session' || source === 'achievement') {
        try {
          const ach = (await import('./AchievementSystem.js')).default;
          await ach.checkLevelAchievements(newLevelInfo.level);
        } catch (levelAchErr) {
          console.error('[LevelSystem] Failed to check level achievements:', levelAchErr);
        }
      }
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
