/**
 * DailyChallenge — 每日挑战模块
 * 每天生成随机挑战目标，完成后获得额外经验加成
 * @module modules/DailyChallenge
 */

import store from './StorageManager.js';
import levelSystem from './LevelSystem.js';

const CHALLENGE_TYPES = ['speed', 'accuracy', 'streak'];

/** 每日挑战条件阈值 */
const CHALLENGE_THRESHOLDS = {
  speed: { minWPM: 30, label: '30 WPM' },
  accuracy: { minAccuracy: 95, label: '95% 准确率' },
  streak: { minStreak: 10, label: '10 连击' }
};

/** 每日挑战经验奖励倍数 */
const DAILY_CHALLENGE_EXP_MULTIPLIER = 1.5;

/**
 * 获取当前日期字符串（yyyy-mm-dd 格式）
 * @returns {string}
 */
function getCurrentDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 检查是否为新的一天（距离上次挑战创建是否超过 24 小时）
 * @param {string} lastChallengeDate - 上次挑战的日期字符串
 * @returns {boolean}
 */
function isNewDay(lastChallengeDate) {
  if (!lastChallengeDate) return true;
  const lastDate = new Date(lastChallengeDate);
  const now = new Date();
  const diffHours = (now - lastDate) / (1000 * 60 * 60);
  return diffHours >= 24;
}

/**
 * 生成随机每日挑战
 * @returns {Object} 挑战对象
 */
function generateDailyChallenge() {
  const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
  let target;

  switch (type) {
    case 'speed':
      // 随机 WPM 目标：30-60 WPM
      const minWPM = 30 + Math.floor(Math.random() * 31);
      target = { type: 'speed', wpm: minWPM, label: `${minWPM} WPM` };
      break;
    case 'accuracy':
      // 随机准确率目标：90-100%
      const minAccuracy = 90 + Math.floor(Math.random() * 11);
      target = { type: 'accuracy', accuracy: minAccuracy, label: `${minAccuracy}% 准确率` };
      break;
    case 'streak':
      // 随机连击目标：5-25
      const minStreak = 5 + Math.floor(Math.random() * 21);
      target = { type: 'streak', streak: minStreak, label: `连击 ${minStreak}` };
      break;
  }

  return {
    id: getCurrentDateString(),
    date: getCurrentDateString(),
    type: target.type,
    target: target,
    label: `${target.label} ${type}`,
    expired: false
  };
}

/**
 * 检查是否需要生成新的每日挑战
 * @returns {Promise<Object>} 新的或现有的每日挑战对象
 */
async function getOrCreateDailyChallenge() {
  await store._ensureDefaults();

  const data = await store.get('dailyChallenge');
  const lastDate = data?.date;

  // 如果是新的一天或没有挑战记录，生成新挑战
  if (isNewDay(lastDate)) {
    const newChallenge = generateDailyChallenge();
    await store.set('dailyChallenge', newChallenge);
    return newChallenge;
  }

  // 否则返回现有挑战
  return data || generateDailyChallenge();
}

/**
 * 检查按键是否满足当前每日挑战条件
 * @param {Object} stats - 当前统计数据 { wpm, accuracy, streak }
 * @returns {Promise<boolean>} 是否满足条件
 */
async function checkChallengeCondition(stats) {
  const challenge = await getOrCreateDailyChallenge();
  if (challenge.expired) return false;

  let met = false;

  switch (challenge.type) {
    case 'speed':
      met = (stats.wpm || 0) >= challenge.target.wpm;
      break;
    case 'accuracy':
      met = (stats.accuracy || 0) >= challenge.target.accuracy;
      break;
    case 'streak':
      met = (stats.streak || 0) >= challenge.target.streak;
      break;
  }

  if (met) {
    // 挑战完成，奖励经验
    await completeDailyChallenge(challenge.id);
  }

  return met;
}

/**
 * 完成每日挑战并奖励经验
 * @param {string} challengeId - 挑战 ID
 * @returns {Promise<Object>} 奖励信息
 */
async function completeDailyChallenge(challengeId) {
  const challenge = await getOrCreateDailyChallenge();

  if (challenge.id !== challengeId || challenge.expired) {
    return { success: false, alreadyCompleted: true };
  }

  // 标记挑战已完成
  challenge.expired = true;
  await store.set('dailyChallenge', challenge);

  // 计算经验奖励：基础经验 × 1.5 倍率
  // 基础经验：按键数 × 1 + 会话奖励 5
  const baseExp = 5; // 会话基础经验
  const expGained = Math.round(baseExp * DAILY_CHALLENGE_EXP_MULTIPLIER);

  // 通过 LevelSystem 添加经验
  await levelSystem.addExperience(expGained, 'normal', 'dailyChallenge');

  // 广播奖励解锁事件到 overlay
  try {
    await chrome.runtime.sendMessage({
      action: 'rewardUnlocked',
      data: {
        newLevel: null,
        achievement: {
          name: '每日挑战',
          nameEn: 'Daily Challenge',
          icon: '🎯',
          description: `完成每日挑战：${challenge.label}，获得 ${expGained} 经验`
        }
      }
    });
  } catch (err) {
    console.error('[DailyChallenge] Failed to broadcast reward:', err);
  }

  return {
    success: true,
    challenge: challenge,
    expGained: expGained
  };
}

/**
 * 获取今日挑战进度显示信息
 * @returns {Promise<Object>} 进度显示信息
 */
async function getDailyChallengeDisplay() {
  const challenge = await getOrCreateDailyChallenge();
  if (challenge.expired) {
    return { hasActiveChallenge: false, completedToday: true };
  }

  return {
    hasActiveChallenge: true,
    challenge: challenge,
    progress: {
      type: challenge.type,
      label: challenge.label,
      target: challenge.target
    }
  };
}

/**
 * 获取本周累计挑战统计
 * @returns {Promise<Object>} { completedCount, bestStreak, totalExp }
 */
async function getWeeklyStats() {
  const data = await store.get('dailyChallenge');
  // 这里简化处理，实际应该存储历史挑战记录
  // 暂时返回基础统计
  return { completedCount: data?.expired ? 1 : 0, bestStreak: 0, totalExp: 0 };
}

export default {
  getOrCreateDailyChallenge,
  checkChallengeCondition,
  completeDailyChallenge,
  getDailyChallengeDisplay,
  getWeeklyStats
};