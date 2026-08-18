/**
 * AchievementSystem — 成就系统
 * 管理 20+ 成就的解锁判定与徽章展示
 * @module modules/AchievementSystem
 */

import store from './StorageManager.js';
import levelSystem from './LevelSystem.js';

/**
 * 成就定义
 * 每个成就包含：ID、名称、描述、图标、解锁条件、经验奖励
 */
const ACHIEVEMENTS = [
  {
    id: 'first_key',
    name: '第一步',
    nameEn: 'First Step',
    description: '按下第一个键',
    icon: '🎯',
    condition: { type: 'totalKeystrokes', threshold: 1 },
    experienceReward: 10
  },
  {
    id: 'ten_keys',
    name: '初露锋芒',
    nameEn: 'Ten Keys',
    description: '累计按下 10 个键',
    icon: '🔑',
    condition: { type: 'totalKeystrokes', threshold: 10 },
    experienceReward: 15
  },
  {
    id: 'hundred_keys',
    name: '熟能生巧',
    nameEn: 'Hundred Keys',
    description: '累计按下 100 个键',
    icon: '🔨',
    condition: { type: 'totalKeystrokes', threshold: 100 },
    experienceReward: 30
  },
  {
    id: 'thousand_keys',
    name: '千锤百炼',
    nameEn: 'Thousand Keys',
    description: '累计按下 1000 个键',
    icon: '⚒️',
    condition: { type: 'totalKeystrokes', threshold: 1000 },
    experienceReward: 80
  },
  {
    id: 'streak_5',
    name: '小有连续',
    nameEn: 'Small Streak',
    description: '连续正确 5 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 5 },
    experienceReward: 20
  },
  {
    id: 'streak_10',
    name: '连击新手',
    nameEn: 'Streak Novice',
    description: '连续正确 10 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 10 },
    experienceReward: 25
  },
  {
    id: 'streak_25',
    name: '连击达人',
    nameEn: 'Streak Expert',
    description: '连续正确 25 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 25 },
    experienceReward: 50
  },
  {
    id: 'streak_50',
    name: '连击大师',
    nameEn: 'Streak Master',
    description: '连续正确 50 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 50 },
    experienceReward: 100
  },
  {
    id: 'wpm_10',
    name: '慢慢来',
    nameEn: 'Slow Start',
    description: 'WPM 达到 10',
    icon: '🐢',
    condition: { type: 'bestWPM', threshold: 10 },
    experienceReward: 20
  },
  {
    id: 'wpm_20',
    name: '渐入佳境',
    nameEn: 'Getting Going',
    description: 'WPM 达到 20',
    icon: '🚶',
    condition: { type: 'bestWPM', threshold: 20 },
    experienceReward: 30
  },
  {
    id: 'wpm_30',
    name: '速度入门',
    nameEn: 'Speed Starter',
    description: 'WPM 达到 30',
    icon: '⚡',
    condition: { type: 'bestWPM', threshold: 30 },
    experienceReward: 50
  },
  {
    id: 'wpm_40',
    name: '疾速如风',
    nameEn: 'Wind Speed',
    description: 'WPM 达到 40',
    icon: '💨',
    condition: { type: 'bestWPM', threshold: 40 },
    experienceReward: 75
  },
  {
    id: 'wpm_50',
    name: '风驰电掣',
    nameEn: 'Lightning Fast',
    description: 'WPM 达到 50',
    icon: '⚡',
    condition: { type: 'bestWPM', threshold: 50 },
    experienceReward: 100
  },
  {
    id: 'wpm_60',
    name: '键盘闪电',
    nameEn: 'Keyboard Lightning',
    description: 'WPM 达到 60',
    icon: '🌩️',
    condition: { type: 'bestWPM', threshold: 60 },
    experienceReward: 150
  },
  {
    id: 'perfect_20',
    name: '完美起步',
    nameEn: 'Perfect Start',
    description: '单次练习准确率 100%（至少 20 个键）',
    icon: '💯',
    condition: { type: 'perfectSession', threshold: 20 },
    experienceReward: 40
  },
  {
    id: 'minute_practice',
    name: '一分钟',
    nameEn: 'One Minute',
    description: '累计练习 1 分钟',
    icon: '⏱️',
    condition: { type: 'totalMinutes', threshold: 1 },
    experienceReward: 15
  },
  {
    id: 'ten_minutes',
    name: '十分钟',
    nameEn: 'Ten Minutes',
    description: '累计练习 10 分钟',
    icon: '⏲️',
    condition: { type: 'totalMinutes', threshold: 10 },
    experienceReward: 40
  },
  {
    id: 'hour_practice',
    name: '一小时',
    nameEn: 'One Hour',
    description: '累计练习 60 分钟',
    icon: '🕐',
    condition: { type: 'totalMinutes', threshold: 60 },
    experienceReward: 100
  },
  {
    id: 'level_5',
    name: '小有成就',
    nameEn: 'Little Achievement',
    description: '达到 Lv.5 句子达人',
    icon: '📋',
    condition: { type: 'level', threshold: 5 },
    experienceReward: 60
  },
  {
    id: 'level_10',
    name: '登峰造极',
    nameEn: 'Peak Performance',
    description: '达到 Lv.10 打字之神',
    icon: '🏅',
    condition: { type: 'level', threshold: 10 },
    experienceReward: 200
  },
  {
    id: 'all_modes',
    name: '全面发展',
    nameEn: 'Well Rounded',
    description: '体验所有练习模式',
    icon: '🎮',
    condition: { type: 'modesPlayed', threshold: 5 },
    experienceReward: 80
  },
  {
    id: 'seven_days',
    name: '一周坚持',
    nameEn: 'Week Streak',
    description: '连续 7 天练习',
    icon: '📅',
    condition: { type: 'consecutiveDays', threshold: 7 },
    experienceReward: 100
  }
];

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

    this._emit('onAchievementUnlocked', {
      achievement,
      unlockEntry,
      experienceGained: achievement.experienceReward
    });

    return { ...achievement, unlockedAt: unlockEntry.unlockedAt };
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
