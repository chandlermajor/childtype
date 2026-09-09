/**
 * ChildType Service Worker
 * 全局消息路由、存储管理、覆盖层注入控制
 * @module background/service-worker
 */

import store from '../modules/StorageManager.js';
import settingsManager from '../modules/SettingsManager.js';
import levelSystem from '../modules/LevelSystem.js';
import achievementSystem from '../modules/AchievementSystem.js';
import fingerPhaseSystem from '../modules/FingerPhaseSystem.js';
import layouts from '../data/keyboard-layouts.js';
import { aggregateFingerStats, pruneKeyProficiency } from '../modules/FingerProficiency.js';

// 跟踪当前 overlay 状态
let currentOverlayState = {
  active: false,
  tabId: null,
  mode: null,
  difficulty: null
};

/**
 * 初始化：监听事件
 */
function init() {
  // 安装时初始化存储
  chrome.runtime.onInstalled.addListener(async () => {
    await store._ensureDefaults();
    console.log('[ChildType] Extension installed, storage initialized');
  });

  // 消息路由
  chrome.runtime.onMessage.addListener(async (message, sender) => {
    try {
      const response = await handleMessage(message, sender);
      return response;
    } catch (error) {
      console.error('[ChildType] Message handler error:', error);
      return { error: error.message };
    }
  });

  // 快捷键处理
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-overlay') {
      toggleOverlay();
    } else if (command === 'pause-session') {
      await sendMessageToTab('pauseSession');
    }
  });

  // 等级升级事件 → 通知 overlay
  levelSystem.on('onLevelUp', async (data) => {
    console.log('[ChildType] Level up!', data);
    await broadcastToOverlay({ type: 'REWARD_UNLOCKED', data });
  });

  // 成就解锁事件 → 通知 overlay
  achievementSystem.on('onAchievementUnlocked', async (data) => {
    console.log('[ChildType] Achievement unlocked!', data);
    await broadcastToOverlay({ type: 'REWARD_UNLOCKED', data });
  });

  // 指法阶段推进 → 通知 overlay + 检查阶段成就
  fingerPhaseSystem.on('onPhaseAdvance', async (data) => {
    console.log('[ChildType] Finger phase advanced!', data);
    await broadcastToOverlay({ type: 'PHASE_ADVANCE', data });
    await achievementSystem.checkPhaseAchievements(data.toPhase);
  });
}

/**
 * 消息路由处理
 * @param {Object} message - 消息
 * @param {Object} sender - 发送者信息
 * @returns {Promise<Object>} 响应
 */
async function handleMessage(message, sender) {
  const { action } = message;

  switch (action) {
    case 'getSettings':
      return await settingsManager.getAllSettings();

    case 'saveSettings':
      await settingsManager.updateSettings(message.settings);
      // 主题变更时同步到 overlay
      if (message.settings.theme) {
        await broadcastToOverlay({ type: 'THEME_CHANGE', data: { theme: message.settings.theme } });
      }
      return { success: true };

    case 'resetSettings':
      await settingsManager.resetToDefaults();
      return { success: true };

    case 'recordKey': {
      const { key, finger, correct, responseMs } = message;
      const normalizedKey = typeof key === 'string' ? key.toLowerCase() : key;
      const kp = (await store.get('progress.keyProficiency')) || {};
      const cur = kp[normalizedKey] || { attempts: 0, correct: 0, msSamples: [] };
      cur.attempts++;
      cur.correct += correct ? 1 : 0;
      if (responseMs != null) {
        cur.msSamples.push(responseMs);
        if (cur.msSamples.length > 50) cur.msSamples.shift();
      }
      cur.lastAttemptAt = Date.now();
      kp[normalizedKey] = cur;
      await store.set('progress.keyProficiency', kp);

      const layout = layouts[settingsManager._cached?.keyboardLayout] || layouts.QWERTY;
      const aggregated = aggregateFingerStats(kp, layout.fingerMap);
      await store.set('progress.fingerStats', aggregated);
      return { success: true };
    }

    case 'lettersBatchStarted': {
      // 字母模式完成一批 16 字母，记录该批次的准确率并更新模式统计
      const prevBatch = message.prevBatch || [];
      const prevCount = message.prevCount || 0;
      const correct = message.correct || 0;
      const total = message.total || 0;
      const batchAccuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
      const batchWpm = message.batchWpm || 0;

      await store.update('progress', (current) => {
        const modeStats = { ...current.modeStats };
        const lettersStat = modeStats.letters || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
        lettersStat.sessions += 1;
        // 准确率取历史加权平均
        const oldTotal = Math.max(lettersStat.totalMinutes, 1);
        lettersStat.accuracy = Math.round(((lettersStat.accuracy * (oldTotal - 1) + batchAccuracy) * 10) / oldTotal) / 10;
        if (batchWpm > lettersStat.bestWPM) lettersStat.bestWPM = batchWpm;
        modeStats.letters = lettersStat;
        return { ...current, modeStats };
      });
      return { success: true };
    }

    case 'getProgress':
      return await store.get('progress');

    case 'getAchievements':
      return {
        unlocked: await achievementSystem.getUnlocked(),
        progress: await achievementSystem.getProgressPercent()
      };

    case 'getAchievementDefinitions':
      return achievementSystem.getAllAchievements();

    case 'getLevel':
      return await levelSystem.getCurrentLevel();

    case 'startOverlay': {
      const { mode, difficulty } = message;
      // 打开新标签页显示 overlay 页面
      const tab = await chrome.tabs.create({ url: chrome.runtime.getURL('overlay/overlay.html') });
      currentOverlayState = { active: true, tabId: tab.id, mode, difficulty };
      console.log('[ChildType] startOverlay opened new tab:', tab.id, 'mode:', mode);
      // 延迟广播，确保页面加载完成
      setTimeout(async () => {
        await broadcastToOverlay({ type: 'START_SESSION', data: { mode, difficulty } });
      }, 300);
      return { success: true };
    }

    case 'stopOverlay': {
      currentOverlayState = { active: false, tabId: null, mode: null, difficulty: null };
      await broadcastToOverlay({ type: 'STOP_SESSION' });
      return { success: true };
    }

    case 'sessionEnd': {
      const { duration, totalKeystrokes, errors, mode } = message;
      const accuracy = totalKeystrokes > 0
        ? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 1000) / 10
        : 0;
      const minutes = Math.round((duration / 60) * 10) / 10;

      // 更新进度
      const progressUpdate = await store.update('progress', (current) => {
        const modeStats = { ...current.modeStats };
        const modeStat = modeStats[mode] || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
        modeStat.sessions += 1;
        modeStat.totalMinutes += minutes;
        modeStats[mode] = modeStat;

        // 跟踪已练习的模式
        const modesPlayed = current.modesPlayed || [];
        if (!modesPlayed.includes(mode)) {
          modesPlayed.push(mode);
        }

        // 跟踪连续练习天数
        const today = new Date().toISOString().split('T')[0];
        const lastDate = current.lastPracticeDate;
        let consecutiveDays = current.consecutiveDays || 0;
        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (lastDate === yesterdayStr) {
            consecutiveDays += 1;
          } else if (lastDate !== today) {
            consecutiveDays = 1;
          }
        }

        return {
          ...current,
          modeStats,
          modesPlayed,
          lastPracticeDate: today,
          consecutiveDays,
          totalKeystrokes: (current.totalKeystrokes || 0) + totalKeystrokes,
          totalPracticeMinutes: (current.totalPracticeMinutes || 0) + minutes,
          dailyHistory: addToDailyHistory(current.dailyHistory || [], minutes, accuracy)
        };
      });

      // 增加经验值（正确按键数 + 会话奖励）
      const correctKeystrokes = totalKeystrokes - errors;
      const baseExp = correctKeystrokes * 1 + 5; // EXP_PER_KEY=1, SESSION_BONUS=5
      await levelSystem.addExperience(baseExp, 'normal', 'session');

      // 修剪过期键位熟练度数据
      await store.update('progress.keyProficiency', kp => pruneKeyProficiency(kp || {}));

      // 统一检查成就解锁（读取完整 progress）
      await achievementSystem.checkAllUnlocks();

      // 检查指法阶段推进
      const advanced = await fingerPhaseSystem.advanceIfReady();
      if (advanced !== null) {
        await broadcastToOverlay({ type: 'PHASE_ADVANCE', data: { phase: advanced } });
      }

      return { success: true };
    }

    case 'updateStats': {
      const { wpm, accuracy, streak, totalKeystrokes } = message;
      return { ack: true };
    }

    case 'openPrivacyPolicy':
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy-policy.html') });
      return { success: true };

    default:
      console.warn('[ChildType] Unknown action:', action);
      return { error: `Unknown action: ${action}` };
  }
}

/**
 * 切换 overlay 显示/隐藏（快捷键触发）
 */
async function toggleOverlay() {
  if (currentOverlayState.active) {
    await sendMessageToTab('stopOverlay');
  } else {
    await sendMessageToTab('startOverlay');
  }
}

/**
 * 向当前 overlay 标签发送消息
 * @param {string} type - 消息类型
 * @param {Object} [data] - 消息数据
 */
async function broadcastToOverlay(payload) {
  const tabId = currentOverlayState.tabId;
  if (!tabId) {
    console.warn('[ChildType] broadcastToOverlay: no target tab');
    return;
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      console.warn('[ChildType] broadcastToOverlay: tab not found');
      return;
    }

    // 先发送消息；若内容脚本尚未就绪（onMessage 未注册），重新注入后重试
    try {
      chrome.tabs.sendMessage(tab.id, payload);
    } catch (sendError) {
      console.warn('[ChildType] broadcastToOverlay: retry injection:', sendError.message);
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['overlay/overlay.js']
        });
        // 重新获取 tab 对象，确保消息发送到正确的标签页
        const freshTab = await chrome.tabs.get(tabId);
        if (freshTab) {
          chrome.tabs.sendMessage(freshTab.id, payload);
        }
      } catch (retryError) {
        console.warn('[ChildType] broadcastToOverlay: injection retry failed:', retryError.message);
      }
    }
  } catch (error) {
    console.warn('[ChildType] Failed to broadcast to overlay:', error);
  }
}

/**
 * 向指定标签注入 overlay（Content Script）
 * @param {number} tabId - 目标标签页 ID
 */
async function injectOverlay(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['overlay/overlay.js']
    });
  } catch (error) {
    console.warn('[ChildType] Failed to inject overlay:', error);
  }
}

/**
 * 向指定标签发送消息
 * @param {string} type - 消息类型
 * @param {Object} [data] - 消息数据
 */
async function sendMessageToTab(type, data) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // 将 camelCase 消息类型映射为 overlay.js 中的期望类型
      const typeMap = {
        'startOverlay': 'START_SESSION',
        'stopOverlay': 'STOP_SESSION',
        'pauseSession': 'pauseSession'
      };
      const messageType = typeMap[type] || type.toUpperCase();
      chrome.tabs.sendMessage(tab.id, { type: messageType, data });
    }
  } catch (error) {
    console.warn('[ChildType] Failed to send to tab:', error);
  }
}

/**
 * 添加每日历史记录
 * @param {Array} history - 现有历史
 * @param {number} minutes - 练习分钟数
 * @param {number} accuracy - 准确率
 * @returns {Array} 更新后的历史
 */
function addToDailyHistory(history, minutes, accuracy) {
  const today = new Date().toISOString().split('T')[0];
  const existingIndex = history.findIndex(h => h.date === today);

  if (existingIndex >= 0) {
    const existing = history[existingIndex];
    existing.minutes = Math.round((existing.minutes + minutes) * 10) / 10;
    // 重新计算加权平均准确率
    existing.accuracy = Math.round(
      ((existing.accuracy * (existing.minutes - minutes) + accuracy * minutes) / existing.minutes) * 10
    ) / 10;
  } else {
    history.push({ date: today, minutes, accuracy });
  }

  // 只保留最近 90 天
  return history.filter(h => {
    const daysAgo = (Date.now() - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 90;
  });
}

// 启动
init();
