/**
 * ChildType Popup Logic
 * 处理 popup 界面交互、数据加载、消息通信
 * @module popup/popup
 */

// ===== DOM Elements =====
const modeButtons = document.querySelectorAll('.popup__mode-btn');
const statWpm = document.getElementById('stat-wpm');
const statAccuracy = document.getElementById('stat-accuracy');
const statStreak = document.getElementById('stat-streak');
const statTime = document.getElementById('stat-time');
const levelBadge = document.getElementById('level-badge');
const levelName = document.getElementById('level-name');
const levelSubtitle = document.getElementById('level-subtitle');
const progressFill = document.getElementById('progress-fill');
const progressCurrent = document.getElementById('progress-current');
const progressNext = document.getElementById('progress-next');
const settingsPanel = document.getElementById('settings-panel');
const achievementGrid = document.getElementById('achievement-grid-main');
const achievementProgress = document.getElementById('achievement-progress-main');


// Setting elements
const settingTheme = document.getElementById('setting-theme');
const settingFontSize = document.getElementById('setting-font-size');
const settingSound = document.getElementById('setting-sound');
const settingDifficulty = document.getElementById('setting-difficulty');

// Action buttons
const btnSettings = document.getElementById('btn-settings');
const btnPrivacy = document.getElementById('btn-privacy');
const btnResetSettings = document.getElementById('btn-reset-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');

// ===== Initialize =====
async function init() {
  // 加载设置
  await loadSettings();

  // 加载进度
  await loadProgress();

  // 加载等级
  await loadLevel();

  // 加载成就
  await loadAchievements();

  // 默认字体大小选项
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48];
  fontSizes.forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}px`;
    settingFontSize.appendChild(option);
  });

  // 初始化时按当前选中模式刷新快速统计
  const activeModeBtn = document.querySelector('.popup__mode-btn--active');
  if (activeModeBtn) {
    await refreshModeStats(activeModeBtn.dataset.mode);
  }
}

/**
 * 加载用户设置
 */
async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (settings) {
      settingTheme.value = settings.theme || 'light';
      settingFontSize.value = settings.fontSize || 16;
      settingSound.checked = settings.soundEnabled !== false;
      settingDifficulty.value = settings.difficulty || 'normal';
      // 应用主题到 DOM
      document.documentElement.dataset.theme = settings.theme || 'light';
    }
  } catch (error) {
    console.error('[Popup] Failed to load settings:', error);
  }
}

/**
 * 加载练习进度
 */
async function loadProgress() {
  try {
    const progress = await chrome.runtime.sendMessage({ action: 'getProgress' });
    if (progress) {
      // 显示最佳统计（简化显示）
      statWpm.textContent = progress.bestWPM || '--';
      const totalStrokes = progress.totalKeystrokes || 0;
      const totalMinutes = progress.totalPracticeMinutes || 0;
      if (totalStrokes > 0 && totalMinutes > 0) {
        const avgWpm = Math.round((totalStrokes / 5) / (totalMinutes));
        statWpm.textContent = avgWpm || '--';
      }
      statTime.textContent = `${Math.round(totalMinutes)}m`;
      statStreak.textContent = '0'; // 当前会话连击（无会话时为 0）
      statAccuracy.textContent = '--%'; // 需要实时数据
    }
  } catch (error) {
    console.error('[Popup] Failed to load progress:', error);
  }
}

/**
 * 刷新指定模式的快速统计
 * 字母模式按 16 字母批次统计，显示该模式的最佳 WPM/准确率
 * @param {string} mode
 */
async function refreshModeStats(mode) {
  try {
    const progress = await chrome.runtime.sendMessage({ action: 'getProgress' });
    if (!progress) return;

    if (progress.modeStats && progress.modeStats[mode]) {
      const stat = progress.modeStats[mode];
      statWpm.textContent = stat.bestWPM || '--';
      statAccuracy.textContent = `${stat.accuracy}%`;
      statTime.textContent = `${Math.round(stat.totalMinutes)}m`;
    }

    const liveStats = progress.liveStats && progress.liveStats[mode];
    if (liveStats && (Date.now() - liveStats.lastUpdate < 30000)) {
      statWpm.textContent = liveStats.wpm > 0 ? Math.round(liveStats.wpm) : '--';
      statAccuracy.textContent = `${liveStats.accuracy}%`;
      statStreak.textContent = liveStats.streak || 0;
    }
  } catch (error) {
    console.error('[Popup] Failed to refresh mode stats:', error);
  }
}

/**
 * 加载等级信息
 */
async function loadLevel() {
  try {
    const level = await chrome.runtime.sendMessage({ action: 'getLevel' });
    if (level) {
      levelBadge.textContent = level.icon || '🌱';
      levelName.textContent = level.name || '未知';
      levelSubtitle.textContent = `Lv.${level.level}`;
      progressFill.style.width = `${level.progress || 0}%`;
      // progressCurrent 显示当前实际经验值，progressNext 显示下一级所需经验
      progressCurrent.textContent = level.experience || 0;
      progressNext.textContent = level.nextLevel ? level.nextLevel.expRequired : 'MAX';
    }
  } catch (error) {
    console.error('[Popup] Failed to load level:', error);
  }
}

/**
 * 加载每日挑战
 */
async function loadDailyChallenge() {
  try {
    const challenge = await chrome.runtime.sendMessage({ action: 'getDailyChallenge' });
    if (challenge) {
      if (challenge.expired) {
        dailyChallengeInfo.textContent = '✅ 今日挑战已完成';
      } else {
        dailyChallengeInfo.textContent = `🎯 ${challenge.label} - 进行中`;
      }
    }
  } catch (error) {
    console.error('[Popup] Failed to load daily challenge:', error);
    dailyChallengeInfo.textContent = '今日挑战加载中...';
  }
}

async function loadDailyChallenge() {
  try {
    const data = await chrome.runtime.sendMessage({ action: 'getDailyChallenge' });
    if (!data) return;

    const challenge = data.challenge || {};
    const isCompleted = data.completed || false;

    if (challenge.type === 'speed') {
      dailyChallengeInfo.textContent = `速度挑战：${challenge.target.wpm} WPM`;
    } else if (challenge.type === 'accuracy') {
      dailyChallengeInfo.textContent = `准确率挑战：${challenge.target.accuracy}%`;
    } else if (challenge.type === 'streak') {
      dailyChallengeInfo.textContent = `连击挑战：${challenge.target.streak} 连击`;
    } else {
      dailyChallengeInfo.textContent = '今日挑战加载中...';
    }

    dailyChallengeInfo.classList.toggle('popup__daily-challenge--completed', isCompleted);
  } catch (error) {
    console.error('[Popup] Failed to load daily challenge:', error);
    dailyChallengeInfo.textContent = '今日挑战加载中...';
  }
}

/**
 * 加载成就列表
 */
async function loadAchievements() {
  try {
    const data = await chrome.runtime.sendMessage({ action: 'getAchievements' });
    if (data) {
      // 清空网格
      achievementGrid.innerHTML = '';

      // 从 AchievementSystem 获取成就定义（避免重复定义）
      const achievementDefs = await chrome.runtime.sendMessage({ action: 'getAchievementDefinitions' });
      if (!achievementDefs) return;

      achievementProgress.textContent = `${data.unlocked.length}/${achievementDefs.length}`;

      const unlockedIds = (data.unlocked || []).map(u => u.id);

      achievementDefs.forEach(achievement => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const item = document.createElement('div');
        item.className = `popup__achievement-item ${isUnlocked ? 'popup__achievement-item--unlocked' : 'popup__achievement-item--locked'}`;
        item.innerHTML = `
          <span class="popup__achievement-icon">${achievement.icon}</span>
          <span class="popup__achievement-name">${achievement.name}</span>
        `;
        achievementGrid.appendChild(item);
      });
    }
  } catch (error) {
    console.error('[Popup] Failed to load achievements:', error);
  }
}

// ===== Event Listeners =====

async function startPracticeInActiveTab(mode, difficulty) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('未找到当前活动标签页');
  }

  return chrome.runtime.sendMessage({
    action: 'startOverlay',
    mode,
    difficulty,
    tabId: tab.id
  });
}

async function startPracticeInNewTab(mode, difficulty) {
  const url = chrome.runtime.getURL('overlay/overlay.html');
  const tab = await chrome.tabs.create({ url });
  // 等待新标签页加载完成后发送 START_SESSION
  await chrome.tabs.onUpdated.addListener(function listener(info, t) {
    if (t.id !== tab.id) return;
    if (info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.sendMessage(t.id, { type: 'START_SESSION', data: { mode, difficulty } });
    }
  });
  return { success: true, tabId: tab.id };
}

  // 模式选择
  modeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      // 更新按钮状态
      modeButtons.forEach(b => b.classList.remove('popup__mode-btn--active'));
      btn.classList.add('popup__mode-btn--active');

      // 刷新快速统计：显示该模式的最佳数据（字母模式按批次统计）
      await refreshModeStats(btn.dataset.mode);

    // 发送消息启动 overlay
    const mode = btn.dataset.mode;
    let difficulty = 'normal';
    try {
      const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
      difficulty = settings?.difficulty || 'normal';
    } catch (error) {
      console.warn('[Popup] Failed to fetch settings, using default:', error);
    }

    try {
      const overlayResponse = await startPracticeInNewTab(mode, difficulty);
      if (overlayResponse && overlayResponse.error) {
        console.error('[Popup] startPracticeInNewTab failed:', overlayResponse.error);
      }
    } catch (err) {
      console.error('[Popup] Failed to start practice:', err);
    }

    // 延迟关闭，给新标签页创建留出时间
    setTimeout(() => window.close(), 100);
  });
});

// 设置按钮
btnSettings.addEventListener('click', () => {
  settingsPanel.hidden = false;
});

// 隐私政策
btnPrivacy.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openPrivacyPolicy' });
  window.close();
});

// 保存设置变更
settingTheme.addEventListener('change', () => {
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: { theme: settingTheme.value }
  });
});

settingFontSize.addEventListener('change', () => {
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: { fontSize: parseInt(settingFontSize.value) }
  });
});

settingSound.addEventListener('change', () => {
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: { soundEnabled: settingSound.checked }
  });
});

settingDifficulty.addEventListener('change', () => {
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: { difficulty: settingDifficulty.value }
  });
});

// 重置设置
  btnResetSettings.addEventListener('click', async () => {
    if (confirm('确定要重置所有设置吗？')) {
      await chrome.runtime.sendMessage({ action: 'resetSettings' });
      await loadSettings();
    }
  });

  // 重置成就
  const btnResetAchievements = document.getElementById('btn-reset-achievements');
  if (btnResetAchievements) {
    btnResetAchievements.addEventListener('click', async () => {
      if (confirm('确定要重置所有成就吗？此操作不可撤销。')) {
        const response = await chrome.runtime.sendMessage({ action: 'resetAchievements' });
        if (response?.success) {
          await loadAchievements();
          await loadProgress();
          await loadLevel();
          console.log('[Popup] Achievements reset complete');
        }
      }
    });
  }

  // ===== Rules Panel =====
  const rulesPanel = document.getElementById('rules-panel');
  const rulesContent = document.getElementById('rules-content');
  const rulesTitle = document.getElementById('rules-title');
  const btnRules = document.getElementById('btn-rules');
  const btnCloseRules = document.getElementById('btn-close-rules');
  let currentRulesLang = 'zh';

  const RULES_DATA = {
    zh: {
      title: '规则',
      difficulty: {
        icon: '🎯',
        title: '难度规则',
        items: [
          '三种难度影响练习文本长度与评分系数：简单、普通、困难',
          '难度系数：简单 0.8×、普通 1.0×、困难 1.5×（影响经验获取）',
          '字母练习支持难度筛选，单词/句子按所选难度随机抽取'
        ]
      },
      phase: {
        icon: '📈',
        title: '阶段规则',
        items: [
          '字母练习分 8 个阶段，难度递增：基准键 → 单指列 → 单指列往返 → 跨指 → 双手配对 → 字母+数字 → 字母+符号 → 全键盘',
          '每阶段需达标（准确率 + WPM 阈值），通过一个批次即可进入下一阶段，未达标将自动回落基准键阶段',
          '通过阶段可自动提升难度，达成成就解锁'
        ]
      },
      progress: {
        icon: '⭐',
        title: '进度规则',
        items: [
          '每按对一个键 +1 EXP，每场练习额外 +5 EXP（按难度系数加成）',
          '共 25 个等级，从 Lv.1 打字新手 到 Lv.25 宗师',
          '成就系统：48 项成就，涵盖按键数、连击、WPM、准确率、时长、等级、阶段等'
        ]
      }
    },
    en: {
      title: 'Rules',
      difficulty: {
        icon: '🎯',
        title: 'Difficulty Rules',
        items: [
          'Three difficulty levels affect practice text length and scoring multipliers: Easy, Normal, Hard',
          'Difficulty multipliers: Easy 0.8×, Normal 1.0×, Hard 1.5× (affect EXP gain)',
          'Letters mode supports difficulty filtering; words/sentences are drawn randomly per selected difficulty'
        ]
      },
      phase: {
        icon: '📈',
        title: 'Phase Rules',
        items: [
          'Letters mode has 8 progressive phases: home row → single-finger columns → single-finger hands → cross-finger → two-hand pairs → letters+numbers → letters+symbols → full keyboard',
          'Each phase requires meeting thresholds (accuracy + WPM); one passing batch advances you. Failing will auto-revert to the home row phase',
          'Completing phases auto-raises difficulty and unlocks achievements'
        ]
      },
      progress: {
        icon: '⭐',
        title: 'Progress Rules',
        items: [
          '+1 EXP per correct keystroke, +5 EXP per session (multiplied by difficulty factor)',
          '25 levels total, from Lv.1 Typing Beginner to Lv.25 Grandmaster',
          'Achievement system: 48 achievements across keystrokes, streaks, WPM, accuracy, playtime, levels, and phases'
        ]
      }
    }
  };

  function renderRules(lang) {
    currentRulesLang = lang;
    const data = RULES_DATA[lang];
    rulesTitle.textContent = data.title;

    document.querySelectorAll('.popup__rules-lang-btn').forEach(btn => {
      btn.classList.toggle('popup__rules-lang-btn--active', btn.dataset.lang === lang);
    });

    rulesContent.innerHTML = '';
    const sections = [data.difficulty, data.phase, data.progress];
    sections.forEach(section => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'popup__rules-section';
      sectionEl.innerHTML = `
        <div class="popup__rules-section-title"><span>${section.icon}</span> ${section.title}</div>
        <ul class="popup__rules-list">
          ${section.items.map(item => `<li class="popup__rules-list-item">${item}</li>`).join('')}
        </ul>
      `;
      rulesContent.appendChild(sectionEl);
    });
  }

  if (btnRules) {
    btnRules.addEventListener('click', () => {
      settingsPanel.hidden = true;
      document.getElementById('achievements-panel').hidden = true;
      rulesPanel.hidden = false;
      renderRules(currentRulesLang);
    });
  }

  if (btnCloseRules) {
    btnCloseRules.addEventListener('click', () => {
      rulesPanel.hidden = true;
    });
  }

  document.querySelectorAll('.popup__rules-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => renderRules(btn.dataset.lang));
  });

  // ===== Start =====
  init();
