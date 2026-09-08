/**
 * FingerProficiency — 键位/手指熟练度计算工具
 * 纯函数：熟练度评分、手指统计聚合、过期键修剪
 * @module modules/FingerProficiency
 */

// 样本不足时的最低按键次数（可调）
export const MIN_SAMPLES = 15;

// 滑动窗口保留的最大响应时间样本数
const MAX_MS_SAMPLES = 50;

// 速度评分基线（ms）与上限
const SPEED_BASE_MS = 300;
const SPEED_CAP_MS = 2000; // 300 + 1700

// 准确率 / 速度 权重
const ACCURACY_WEIGHT = 0.7;
const SPEED_WEIGHT = 0.3;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 计算单键熟练度分数（0-1）
 * accuracy*0.7 + speedScore*0.3，样本不足返回 0
 * @param {Object} keyData - { attempts, correct, msSamples }
 * @returns {number}
 */
export function proficiencyScore(keyData) {
  if (!keyData || !keyData.attempts) return 0;
  if (keyData.attempts < MIN_SAMPLES) return 0;

  const accuracy = keyData.correct / keyData.attempts;

  const msSamples = Array.isArray(keyData.msSamples) ? keyData.msSamples : [];
  let speedScore = 0;
  if (msSamples.length > 0) {
    const sum = msSamples.reduce((acc, ms) => acc + (ms || 0), 0);
    const avgMs = sum / msSamples.length;
    speedScore = clamp(1 - (avgMs - SPEED_BASE_MS) / (SPEED_CAP_MS - SPEED_BASE_MS), 0, 1);
  }

  return accuracy * ACCURACY_WEIGHT + speedScore * SPEED_WEIGHT;
}

/**
 * 按 fingerMap 把单键熟练度数据聚合为 9 个手指统计
 * @param {Object} keyProficiency - { key: { attempts, correct, msSamples } }
 * @param {Object} fingerMap - { key: fingerId }
 * @returns {Object} { 'left-pinky': { sessions, attempts, correct, errors, msSamples }, ... }
 */
export function aggregateFingerStats(keyProficiency, fingerMap) {
  const fingers = [
    'left-pinky', 'left-ring', 'left-middle', 'left-index',
    'thumb',
    'right-index', 'right-middle', 'right-ring', 'right-pinky'
  ];

  const result = {};
  for (const finger of fingers) {
    result[finger] = { sessions: 0, attempts: 0, correct: 0, errors: 0, msSamples: [] };
  }

  for (const key of Object.keys(keyProficiency || {})) {
    const finger = fingerMap ? fingerMap[key] : 'thumb';
    if (!result[finger]) {
      result[finger] = { sessions: 0, attempts: 0, correct: 0, errors: 0, msSamples: [] };
    }
    const data = keyProficiency[key];
    if (!data) continue;

    result[finger].attempts += data.attempts || 0;
    result[finger].correct += data.correct || 0;
    result[finger].errors += (data.attempts || 0) - (data.correct || 0);
    if (Array.isArray(data.msSamples)) {
      result[finger].msSamples.push(...data.msSamples);
      if (result[finger].msSamples.length > MAX_MS_SAMPLES) {
        result[finger].msSamples = result[finger].msSamples.slice(-MAX_MS_SAMPLES);
      }
    }
  }

  return result;
}

/**
 * 修剪过期键，只保留近 daysAgo 天有活动的键
 * @param {Object} keyProficiency - { key: { attempts, correct, msSamples, lastAttemptAt? } }
 * @param {number} daysAgo - 保留天数
 * @returns {Object}
 */
export function pruneKeyProficiency(keyProficiency, daysAgo = 30) {
  if (!keyProficiency) return {};
  const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  const result = {};
  for (const key of Object.keys(keyProficiency)) {
    const data = keyProficiency[key];
    const lastAttemptAt = data.lastAttemptAt || 0;
    if (lastAttemptAt >= cutoff) {
      result[key] = data;
    }
  }
  return result;
}

export default {
  MIN_SAMPLES,
  MAX_MS_SAMPLES,
  proficiencyScore,
  aggregateFingerStats,
  pruneKeyProficiency
};
