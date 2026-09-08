/**
 * AchievementSystem — 成就系统
 * 管理 20+ 成就的解锁判定与徽章展示
 * @module modules/AchievementSystem
 */

import store from './StorageManager.js';
import levelSystem from './LevelSystem.js';
import ACHIEVEMENTS from '../data/achievements.js';

class AchievementSystem {
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
   * 获取所有成就定义
   * @returns {Array<Object>}
   */
  getAllAchievements() {
    return [...ACHIEVEMENTS];
  }

  /**
   * 获取已解锁成就列表
   * @returns {Promise<Array>}
   */
  async getUnlocked() {
    const data = await store.get('achievements');
    return data.unlocked || [];
  }

  /**
   * 检查成就条件是否满足
   * @param {Object} achievement - 成就定义
   * @param {Object} stats - 当前统计数据
   * @returns {boolean}
   */
  checkCondition(achievement, stats) {
    const { type, threshold } = achievement.condition;
    switch (type) {
      case 'totalKeystrokes': return (stats.totalKeystrokes || 0) >= threshold;
      case 'maxStreak': return (stats.maxStreak || 0) >= threshold;
      case 'bestWPM': return (stats.bestWPM || 0) >= threshold;
      case 'perfectSession': return (stats.perfectStreak || 0) >= threshold;
      case 'totalMinutes': return (stats.totalPracticeMinutes || 0) >= threshold;
      case 'level': return (stats.currentLevel || 1) >= threshold;
      case 'modesPlayed': return (stats.modesPlayed || []).length >= threshold;
      case 'consecutiveDays': return (stats.consecutiveDays || 0) >= threshold;
      case 'fingerPhase': return (stats.fingerPhase || 0) >= threshold;
      default: return false;
    }
  }

  /**
   * 解锁成就
   * @param {string} achievementId - 成就 ID
   * @returns {Promise<Object|null>} 解锁的成就对象，或 null（已解锁/不满足条件）
   */
  async unlock(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    const data = await store.get('achievements');
    const unlockedIds = (data.unlocked || []).map(u => u.id);

    if (unlockedIds.includes(achievementId)) {
      return null; // 已解锁
    }

    const unlockEntry = {
      id: achievement.id,
      unlockedAt: new Date().toISOString()
    };

    data.unlocked = [...(data.unlocked || []), unlockEntry];
    data.locked = (data.locked || []).filter(id => id !== achievementId);

    await store.set('achievements', data);

    // 增加经验值
    if (achievement.experienceReward) {
      await this.addReward(achievement.experienceReward);
    }

    this._emit('onAchievementUnlocked', {
      achievement,
      unlockEntry,
      experienceGained: achievement.experienceReward
    });

    return { ...achievement, unlockedAt: unlockEntry.unlockedAt };
  }

  /**
   * 解锁成就时加经验的包装方法（带重入守卫）
   * @param {number} reward - 奖励经验值
   * @returns {Promise<void>}
   */
  async addReward(reward) {
    if (_addingExp) return;
    _addingExp = true;
    try {
      await levelSystem.addExperience(reward, 'normal', 'achievement');
    } finally {
      _addingExp = false;
    }
  }

  /**
   * 读取完整 progress 并统一检查所有可解锁的成就
   * @returns {Promise<Array>} 新解锁的成就列表
   */
  async checkAllUnlocks() {
    const progress = await store.get('progress');
    const unlockedIds = ((await store.get('achievements'))?.unlocked || []).map(u => u.id);
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.includes(achievement.id)) continue;
      if (this.checkCondition(achievement, progress)) {
        const result = await this.unlock(achievement.id);
        if (result) newlyUnlocked.push(result);
      }
    }

    return newlyUnlocked;
  }

  /**
   * 检查等级成就（type==='level'）
   * @param {number} level - 当前等级
   * @returns {Promise<Array>}
   */
  async checkLevelAchievements(level) {
    const unlockedIds = ((await store.get('achievements'))?.unlocked || []).map(u => u.id);
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (achievement.condition.type !== 'level') continue;
      if (unlockedIds.includes(achievement.id)) continue;
      if (achievement.condition.threshold <= level) {
        const result = await this.unlock(achievement.id);
        if (result) newlyUnlocked.push(result);
      }
    }

    return newlyUnlocked;
  }

  /**
   * 检查指法阶段成就（type==='fingerPhase'）
   * @param {number} phase - 已完成阶段 ID（推进后的目标阶段）
   * @returns {Promise<Array>}
   */
  async checkPhaseAchievements(phase) {
    const unlockedIds = ((await store.get('achievements'))?.unlocked || []).map(u => u.id);
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (achievement.condition.type !== 'fingerPhase') continue;
      if (unlockedIds.includes(achievement.id)) continue;
      if (achievement.condition.threshold <= phase) {
        const result = await this.unlock(achievement.id);
        if (result) newlyUnlocked.push(result);
      }
    }

    return newlyUnlocked;
  }

  /**
   * 根据当前统计检查所有可解锁的成就
   * @param {Object} stats - 当前统计数据
   * @returns {Promise<Array>} 可解锁的成就列表
   */
  async getUnlockableStats(stats) {
    const unlockedIds = ((await store.get('achievements'))?.unlocked || []).map(u => u.id);
    const unlockable = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.includes(achievement.id)) continue;
      if (this.checkCondition(achievement, stats)) {
        unlockable.push(achievement);
      }
    }

    return unlockable;
  }

  /**
   * 计算成就解锁进度百分比
   * @returns {Promise<number>} 0-100
   */
  async getProgressPercent() {
    const unlocked = (await store.get('achievements'))?.unlocked || [];
    return Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);
  }
}

export default new AchievementSystem();
