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
const achievementsPanel = document.getElementById('achievements-panel');
const achievementGrid = document.getElementById('achievement-grid');
const achievementProgress = document.getElementById('achievement-progress');

// Setting elements
const settingTheme = document.getElementById('setting-theme');
const settingFontSize = document.getElementById('setting-font-size');
const settingSound = document.getElementById('setting-sound');
const settingDifficulty = document.getElementById('setting-difficulty');

// Action buttons
const btnSettings = document.getElementById('btn-settings');
const btnAchievements = document.getElementById('btn-achievements');
const btnPrivacy = document.getElementById('btn-privacy');
const btnResetSettings = document.getElementById('btn-reset-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCloseAchievements = document.getElementById('btn-close-achievements');

// ===== Initialize =====
async function init() {
  // 加载设置
  await loadSettings();

  // 加载进度
  await loadProgress();

  // 加载等级
  await loadLevel();

  // 默认字体大小选项
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48];
  fontSizes.forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}px`;
    settingFontSize.appendChild(option);
  });
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
      progressCurrent.textContent = level.expRequired || 0;
      progressNext.textContent = level.nextLevel ? level.nextLevel.expRequired : 'MAX';
    }
  } catch (error) {
    console.error('[Popup] Failed to load level:', error);
  }
}

/**
 * 加载成就列表
 */
async function loadAchievements() {
  try {
    const data = await chrome.runtime.sendMessage({ action: 'getAchievements' });
    if (data) {
      achievementProgress.textContent = `${data.unlocked.length}/22`;

      // 清空网格
      achievementGrid.innerHTML = '';

      // 成就定义（与 AchievementSystem 保持一致）
      const allAchievements = [
        { id: 'first_key', name: '第一步', icon: '🎯' },
        { id: 'ten_keys', name: '初露锋芒', icon: '🔑' },
        { id: 'hundred_keys', name: '熟能生巧', icon: '🔨' },
        { id: 'thousand_keys', name: '千锤百炼', icon: '⚒️' },
        { id: 'streak_5', name: '小有连续', icon: '🔥' },
        { id: 'streak_10', name: '连击新手', icon: '🔥' },
        { id: 'streak_25', name: '连击达人', icon: '🔥' },
        { id: 'streak_50', name: '连击大师', icon: '🔥' },
        { id: 'wpm_10', name: '慢慢来', icon: '🐢' },
        { id: 'wpm_20', name: '渐入佳境', icon: '🚶' },
        { id: 'wpm_30', name: '速度入门', icon: '⚡' },
        { id: 'wpm_40', name: '疾速如风', icon: '💨' },
        { id: 'wpm_50', name: '风驰电掣', icon: '⚡' },
        { id: 'wpm_60', name: '键盘闪电', icon: '🌩️' },
        { id: 'perfect_20', name: '完美起步', icon: '💯' },
        { id: 'minute_practice', name: '一分钟', icon: '⏱️' },
        { id: 'ten_minutes', name: '十分钟', icon: '⏲️' },
        { id: 'hour_practice', name: '一小时', icon: '🕐' },
        { id: 'level_5', name: '小有成就', icon: '📋' },
        { id: 'level_10', name: '登峰造极', icon: '🏅' },
        { id: 'all_modes', name: '全面发展', icon: '🎮' },
        { id: 'seven_days', name: '一周坚持', icon: '📅' }
      ];

      const unlockedIds = (data.unlocked || []).map(u => u.id);

      allAchievements.forEach(achievement => {
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

// 模式选择
modeButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    // 更新按钮状态
    modeButtons.forEach(b => b.classList.remove('popup__mode-btn--active'));
    btn.classList.add('popup__mode-btn--active');

    // 发送消息启动 overlay
    const mode = btn.dataset.mode;
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const difficulty = settings?.difficulty || 'normal';

    await chrome.runtime.sendMessage({
      action: 'startOverlay',
      mode,
      difficulty
    });

    // 关闭窗口
    window.close();
  });
});

// 设置按钮
btnSettings.addEventListener('click', () => {
  settingsPanel.hidden = false;
  achievementsPanel.hidden = true;
});

// 成就按钮
btnAchievements.addEventListener('click', async () => {
  await loadAchievements();
  achievementsPanel.hidden = false;
  settingsPanel.hidden = true;
});

// 关闭设置
btnCloseSettings.addEventListener('click', () => {
  settingsPanel.hidden = true;
});

// 关闭成就
btnCloseAchievements.addEventListener('click', () => {
  achievementsPanel.hidden = true;
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

// ===== Start =====
init();
