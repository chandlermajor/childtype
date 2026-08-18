/**
 * ChildType Service Worker
 * 全局消息路由、存储管理、覆盖层注入控制
 * @module background/service-worker
 */

import store from '../modules/StorageManager.js';
import settingsManager from '../modules/SettingsManager.js';
import levelSystem from '../modules/LevelSystem.js';
import achievementSystem from '../modules/AchievementSystem.js';

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
    await broadcastToOverlay({ type: 'LEVEL_UP', data });
  });

  // 成就解锁事件 → 通知 overlay
  achievementSystem.on('onAchievementUnlocked', async (data) => {
    console.log('[ChildType] Achievement unlocked!', data);
    await broadcastToOverlay({ type: 'ACHIEVEMENT_UNLOCKED', data });
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
      return { success: true };

    case 'resetSettings':
      await settingsManager.resetToDefaults();
      return { success: true };

    case 'getProgress':
      return await store.get('progress');

    case 'getAchievements':
      return {
        unlocked: await achievementSystem.getUnlocked(),
        progress: await achievementSystem.getProgressPercent()
      };

    case 'getLevel':
      return await levelSystem.getCurrentLevel();

    case 'startOverlay': {
      const { mode, difficulty } = message;
      currentOverlayState = { active: true, tabId: sender.tab?.id, mode, difficulty };
      await broadcastToOverlay({ type: 'START_SESSION', data: { mode, difficulty } });
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
      await store.update('progress', (current) => {
        const modeStats = { ...current.modeStats };
        const modeStat = modeStats[mode] || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
        modeStat.sessions += 1;
        modeStat.totalMinutes += minutes;
        modeStats[mode] = modeStat;

        const newBestWPM = Math.max(current.bestWPM, 0); // WPM 在 sessionEnd 时已计算

        return {
          ...current,
          modeStats,
          bestWPM: newBestWPM,
          totalKeystrokes: (current.totalKeystrokes || 0) + totalKeystrokes,
          totalPracticeMinutes: (current.totalPracticeMinutes || 0) + minutes,
          dailyHistory: addToDailyHistory(current.dailyHistory || [], minutes, accuracy)
        };
      });

      return { success: true };
    }

    case 'updateStats': {
      const { wpm, accuracy, streak, totalKeystrokes } = message;
      // 实时触发成就检查
      const stats = {
        totalKeystrokes,
        maxStreak: streak,
        bestWPM: wpm
      };
      const unlockable = await achievementSystem.getUnlockableStats(stats);
      for (const achievement of unlockable) {
        await achievementSystem.unlock(achievement.id);
      }
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
  if (!currentOverlayState.tabId) return;

  try {
    const [tab] = await chrome.tabs.query({ id: currentOverlayState.tabId });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, payload);
    }
  } catch (error) {
    console.warn('[ChildType] Failed to broadcast to overlay:', error);
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
      chrome.tabs.sendMessage(tab.id, { type, data });
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
