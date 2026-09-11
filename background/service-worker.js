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
import dailyChallenge from '../modules/DailyChallenge.js';
import layouts from '../data/keyboard-layouts.js';
import { aggregateFingerStats, pruneKeyProficiency } from '../modules/FingerProficiency.js';

// 跟踪当前 overlay 状态
let currentOverlayState = {
  active: false,
  tabId: null,
  mode: null
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
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        console.error('[ChildType] Message handler error:', error);
        sendResponse({ error: error.message });
      });
    return true;
  });

  // 快捷键处理
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-overlay') {
      toggleOverlay();
    } else if (command === 'pause-session') {
      await broadcastToOverlay({ type: 'pauseSession' });
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
      const prevLayout = settingsManager._cached?.keyboardLayout;
      await settingsManager.updateSettings(message.settings);
      // 主题变更时同步到 overlay
      if (message.settings.theme) {
        await broadcastToOverlay({ type: 'THEME_CHANGE', data: { theme: message.settings.theme } });
      }
      // 键盘布局变更时同步到 overlay
      if (message.settings.keyboardLayout && message.settings.keyboardLayout !== prevLayout) {
        await broadcastToOverlay({ type: 'LAYOUT_CHANGE', data: { layout: message.settings.keyboardLayout } });
      }
      return { success: true };

    case 'resetSettings':
      await settingsManager.resetToDefaults();
      return { success: true };

    case 'getDailyChallenge':
      return await dailyChallenge.getOrCreateDailyChallenge();

    case 'checkDailyChallenge': {
      const { wpm, accuracy, streak } = message;
      return await dailyChallenge.checkChallengeCondition({ wpm, accuracy, streak });
    }

    case 'recordKey': {
      const { key, finger, correct, responseMs } = message;
      const normalizedKey = typeof key === 'string' ? key.toLowerCase() : key;
      const progress = await store.get('progress');
      const kp = (progress.keyProficiency || {});
      const cur = kp[normalizedKey] || { attempts: 0, correct: 0, msSamples: [] };
      cur.attempts++;
      cur.correct += correct ? 1 : 0;
      if (responseMs != null) {
        cur.msSamples.push(responseMs);
        if (cur.msSamples.length > 50) cur.msSamples.shift();
      }
      cur.lastAttemptAt = Date.now();
      kp[normalizedKey] = cur;
      progress.keyProficiency = kp;
      const layout = layouts[settingsManager._cached?.keyboardLayout] || layouts.QWERTY;
      const aggregated = aggregateFingerStats(kp, layout.fingerMap);
      progress.fingerStats = aggregated;
      await store.set('progress', progress);
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
      const batchMinutes = message.batchMinutes || 0;

      await store.update('progress', (current) => {
        const modeStats = { ...current.modeStats };
        const lettersStat = modeStats.letters || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
        lettersStat.sessions += 1;
        lettersStat.totalMinutes += batchMinutes;
        // 准确率取历史加权平均，使用 sessions 作为权重
        const totalSessions = lettersStat.sessions;
        lettersStat.accuracy = Math.round(((lettersStat.accuracy * (totalSessions - 1) + batchAccuracy) * 10) / totalSessions) / 10;
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
      const { mode, tabId } = message;
      const targetTabId = tabId ?? (await getActiveTabId());
      const activeMode = mode || 'letters';
      await store.update('progress', (current) => {
        if (!current.liveStats) return current;
        const updated = { ...current.liveStats };
        delete updated[activeMode];
        return { ...current, liveStats: updated };
      });
      await startOverlayInTab(targetTabId, activeMode);
      return { success: true, tabId: targetTabId };
    }

    case 'stopOverlay': {
      currentOverlayState = { active: false, tabId: null, mode: null };
      await store.update('progress', (current) => {
        if (!current.liveStats) return current;
        return { ...current, liveStats: {} };
      });
      await broadcastToOverlay({ type: 'STOP_SESSION' });
      return { success: true };
    }

    case 'sessionEnd': {
      const { duration, totalKeystrokes, errors, mode } = message;
      const correctKeystrokes = totalKeystrokes - errors;
      const accuracy = totalKeystrokes > 0
        ? Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10
        : 0;
      const minutes = Math.round((duration / 60) * 10) / 10;
      const wpm = duration > 0 && correctKeystrokes >= 5
        ? Math.round((correctKeystrokes / 5) / (duration / 60) * 10) / 10
        : 0;

      // 更新进度
      const progressUpdate = await store.update('progress', (current) => {
        const modeStats = { ...current.modeStats };

        if (mode === 'letters') {
          // 字母模式：sessions/accuracy/bestWPM/totalMinutes 由 lettersBatchStarted 按批更新
          // 此处无需重复更新 modeStats.letters
        } else {
          const modeStat = modeStats[mode] || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
          const oldTotalMinutes = modeStat.totalMinutes || 0;
          modeStat.sessions += 1;
          modeStat.totalMinutes += minutes;
          if (wpm > modeStat.bestWPM) modeStat.bestWPM = wpm;
          if (oldTotalMinutes > 0 && minutes > 0) {
            modeStat.accuracy = Math.round(((modeStat.accuracy * oldTotalMinutes + accuracy * minutes) * 10) / (oldTotalMinutes + minutes)) / 10;
          } else {
            modeStat.accuracy = accuracy;
          }
          modeStats[mode] = modeStat;
        }

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
      const baseExp = correctKeystrokes * 1 + 5; // EXP_PER_KEY=1, SESSION_BONUS=5
      await levelSystem.addExperience(baseExp, 'normal', 'session');

      // 修剪过期键位熟练度数据
      await store.update('progress', (current) => {
        const kp = current.keyProficiency || {};
        return { ...current, keyProficiency: pruneKeyProficiency(kp) };
      });

      // 统一检查成就解锁（读取完整 progress）
       await achievementSystem.checkAllUnlocks();

       // 检查每日挑战完成情况（使用当前会话统计）
       await dailyChallenge.checkChallengeCondition({ wpm, accuracy, streak: message.streak });

       // 检查指法阶段推进
       const advanced = await fingerPhaseSystem.advanceIfReady();
       if (advanced !== null) {
         await broadcastToOverlay({ type: 'PHASE_ADVANCE', data: { phase: advanced } });
       }

        // 清除本次会话的实时统计
        await store.update('progress', (current) => {
          if (!current.liveStats) return current;
          const updated = { ...current.liveStats };
          delete updated[mode];
          return { ...current, liveStats: updated };
        });

        return { success: true };
    }

    case 'updateStats': {
      const { wpm, accuracy, streak, totalKeystrokes, mode } = message;
      const now = Date.now();
      await store.update('progress', (current) => {
        const liveStats = current.liveStats || {};
        return {
          ...current,
          liveStats: {
            ...liveStats,
            [mode || 'letters']: { wpm, accuracy, streak, totalKeystrokes, lastUpdate: now }
          }
        };
      });
      return { ack: true };
    }

    case 'openPrivacyPolicy':
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy-policy.html') });
      return { success: true };

    case 'resetAchievements': {
      console.log('[ChildType] Reset achievements triggered');
      await store.set('achievements', { unlocked: [], locked: [] });
      const afterReset = await store.get('achievements');
      console.log('[ChildType] After reset:', afterReset);
      return { success: true };
    }

    default:
      console.warn('[ChildType] Unknown action:', action);
      return { error: `Unknown action: ${action}` };
  }
}

/**
 * 获取当前窗口活动标签页 ID
 * @returns {Promise<number|undefined>}
 */
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

/**
 * 向目标标签页按需注入 overlay 样式和脚本
 * @param {number} tabId - 目标标签页 ID
 */
async function injectOverlayAssets(tabId) {
  if (!Number.isInteger(tabId)) {
    throw new Error('无法确定要注入 overlay 的标签页');
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['overlay/overlay.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['overlay/overlay.js']
    });
  } catch (injectError) {
    console.error('[ChildType] Overlay injection failed into tab:', tabId, injectError);
    throw injectError;
  }

  console.info('[ChildType] Overlay assets injected into tab:', tabId);
}

/**
 * 在指定标签页启动 overlay
 * @param {number} tabId - 目标标签页 ID
 * @param {string} mode - 练习模式
 */
async function startOverlayInTab(tabId, mode = 'letters') {
  // 无法在特权页面（chrome:// 等）注入脚本或发送消息，直接跳过
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab && tab.url && tab.url.startsWith('chrome://')) {
    console.warn('[ChildType] startOverlayInTab: skipping chrome:// tab', tabId);
    return;
  }
  await injectOverlayAssets(tabId);
  currentOverlayState = { active: true, tabId, mode };
  console.info('[ChildType] Overlay started in tab:', tabId, 'mode:', mode);

  // 等待内容脚本初始化完成后再广播，避免消息在 onMessage 注册前发出
  const ack = await chrome.tabs.sendMessage(tabId, { type: '__ping__' }).catch(() => null);
  if (!ack?.pong) {
    console.warn('[ChildType] Overlay not ready, sending START_SESSION directly');
  }
  await broadcastToOverlay({ type: 'START_SESSION', data: { mode } });
}

/**
 * 切换 overlay 显示/隐藏（快捷键触发）
 */
async function toggleOverlay() {
  if (currentOverlayState.active) {
    await broadcastToOverlay({ type: 'STOP_SESSION' });
    currentOverlayState = { active: false, tabId: null, mode: null };
  } else {
    const tabId = await getActiveTabId();
    await startOverlayInTab(tabId);
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
    // 跳过特权页面（chrome://、chrome-extension:// 自身等），无法向这些页面发送消息
    if (tab.url && tab.url.startsWith('chrome://')) {
      console.warn('[ChildType] broadcastToOverlay: skipping chrome:// tab', tabId);
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, payload);
    } catch (sendError) {
      console.warn('[ChildType] broadcastToOverlay: retry injection:', sendError.message);
      try {
        await injectOverlayAssets(tabId);
        await chrome.tabs.sendMessage(tabId, payload);
      } catch (retryError) {
        console.warn('[ChildType] broadcastToOverlay: injection retry failed:', retryError.message);
      }
    }
  } catch (error) {
    console.warn('[ChildType] Failed to broadcast to overlay:', error);
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
