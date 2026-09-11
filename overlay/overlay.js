/**
 * ChildType Overlay — Content Script
 * 打字覆盖层的核心逻辑：键盘事件捕获、打字判定、统计、虚拟键盘渲染
 * @module overlay/overlay
 */

// ===== Sound Manager (dynamic import for content script) =====
let soundManager = null;

async function initSoundManager() {
  try {
    const { default: SoundManager } = await import('../modules/SoundManager.js');
    soundManager = new SoundManager();
    soundManager.init();
  } catch (error) {
    console.warn('[Overlay] SoundManager not available:', error);
  }
}

// ===== State =====
let state = {
  active: false,
  mode: 'letters',
  letterPhase: 0,
  letterPhaseName: '',
  letterBatchPassCount: 0,
  target: null,
  batchTarget: [],
  batchIndex: 0,
  startTime: null,
  paused: false,
  pauseTime: 0,
  lastKeyTime: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  batchTotalKeystrokes: 0,
  batchCorrectKeystrokes: 0,
  batchStartTime: null,
  batchPausedTime: 0,
  batchPauseStartedAt: null,
  completedBatchCount: 0,
  streak: 0,
  maxStreak: 0,
  errors: 0,
  timerInterval: null,
  sessionStats: null
};

// Letter pool for random mode
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LETTERS_PER_BATCH = 16;

// 字母练习批处理状态
  let lettersBatch = [];   // 当前批次的字母数组（共 16 个）
  let lettersBatchIndex = 0;  // 当前进度
  let lettersMasterBatch = []; // 主批次：保持同一组字母，只打乱顺序
  let lettersBatchSettled = false; // 防止重复结算批次统计

// ===== Finger / Phase helpers =====
const PROGRESS_LS_KEY = 'childtype-progress';

async function getLayout() {
  try {
    const settings = await chrome.storage.local.get(['settings']);
    const layout = (settings.settings && settings.settings.keyboardLayout) || 'QWERTY';
    const layoutData = (await import('../data/keyboard-layouts.js')).default;
    return { layout, layoutData: layoutData[layout] || layoutData.QWERTY };
  } catch {
    const layoutData = (await import('../data/keyboard-layouts.js')).default;
    return { layout: 'QWERTY', layoutData: layoutData.QWERTY };
  }
}

async function getFingerForKey(char) {
  try {
    const { layoutData } = await getLayout();
    return (layoutData.fingerMap && layoutData.fingerMap[char.toLowerCase()]) || 'thumb';
  } catch {
    return 'thumb';
  }
}

async function readCurrentFingerPhase() {
  try {
    const data = await chrome.storage.local.get([PROGRESS_LS_KEY]);
    const progress = data[PROGRESS_LS_KEY];
    if (progress && typeof progress.fingerPhase === 'number') return progress.fingerPhase;
  } catch {}
  return 0;
}

async function getPhaseKeysForLayout(phaseId) {
  try {
    const { DEFAULT_FINGER_PHASES, keysForPhase } = await import('../data/finger-phases.js');
    const phase = DEFAULT_FINGER_PHASES[phaseId];
    if (!phase) return [];
    const { layoutData } = await getLayout();
    const keys = keysForPhase(phase, layoutData.name);
    return keys.filter(Boolean);
  } catch {
    return [];
  }
}

async function getLetterForPhase(phaseId) {
  const allKeys = await getPhaseKeysForLayout(phaseId);
  if (!allKeys || !allKeys.length) return getRandomLetter();
  return allKeys[Math.floor(Math.random() * allKeys.length)];
}

async function applyFingerPhaseHighlight(phaseId) {
  const keys = await getPhaseKeysForLayout(phaseId);
  const keySet = new Set(keys.map(k => k.toLowerCase()));
  const allKeys = document.querySelectorAll('.overlay__key');
  allKeys.forEach(el => {
    const dataKey = (el.getAttribute('data-key') || '').toLowerCase();
    if (keySet.size === 0 || keySet.has(dataKey)) {
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0.15';
    }
  });
}

// ===== DOM Elements (fetched lazily in init) =====
let targetLetter = null;
let targetHint = null;
let overlayModeLabel = null;
let overlayWpm = null;
let overlayAccuracy = null;
let overlayStreak = null;
let overlayTimer = null;
let overlayPhaseLabel = null;
let btnPause = null;
let btnClose = null;
let notification = null;
let notificationIcon = null;
let notificationText = null;
let keyboardContainer = null;

// ===== Create overlay container =====
function createOverlayContainer() {
  const existing = document.getElementById('childtype-overlay');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'childtype-overlay';
  container.innerHTML = `
    <div class="overlay__topbar">
      <div class="overlay__mode-label" id="overlay-mode-label">字母练习</div>
      <div class="overlay__phase" id="overlay-phase-label">阶段 1/8 · 基准键</div>
      <div class="overlay__stats">
        <div class="overlay__stat">
          <span class="overlay__stat-value" id="overlay-wpm">0</span>
          <span class="overlay__stat-unit">WPM</span>
        </div>
        <div class="overlay__stat">
          <span class="overlay__stat-value" id="overlay-accuracy">--</span>
          <span class="overlay__stat-unit">%</span>
        </div>
        <div class="overlay__stat">
          <span class="overlay__stat-value" id="overlay-streak">0</span>
          <span class="overlay__stat-unit">连击</span>
        </div>
        <div class="overlay__stat">
          <span class="overlay__stat-value" id="overlay-timer">0:00</span>
          <span class="overlay__stat-unit">时长</span>
        </div>
      </div>
      <div class="overlay__controls">
        <button class="overlay__ctrl-btn" id="btn-pause" title="暂停">⏸</button>
        <button class="overlay__ctrl-btn" id="btn-close" title="关闭 (Esc)">✕</button>
      </div>
    </div>
    <div class="overlay__main">
      <div class="overlay__target-area" id="target-area">
        <div class="overlay__target-letter" id="target-letter">按任意键开始</div>
        <div class="overlay__target-hint" id="target-hint">点击扩展图标选择练习模式</div>
      </div>
    </div>
    <div class="overlay__keyboard" id="keyboard-container"></div>
    <div class="overlay__notification" id="notification" hidden>
      <span class="overlay__notification-icon" id="notification-icon">🎉</span>
      <span class="overlay__notification-text" id="notification-text">升级!</span>
    </div>
  `;

  document.body.appendChild(container);
  // 默认隐藏，不拦截页面交互（仅在 startSession 时显示）
  container.classList.add('hidden');
  return container;
}

// ===== Dynamic Keyboard Builder =====
/**
 * 根据当前布局动态构建虚拟键盘
 * @param {string} layoutName - 布局名称 (QWERTY / AZERTY)
 */
async function buildKeyboard(layoutName) {
  try {
    const layoutData = (await import('../data/keyboard-layouts.js')).default[layoutName];
    if (!layoutData) return;

    const container = document.getElementById('keyboard-container');
    if (!container) return;
    container.innerHTML = '';

    layoutData.rows.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'overlay__keyboard-row';
      rowEl.id = `row-${rowIndex}`;

      row.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'overlay__key';
        keyEl.setAttribute('data-key', key);
        const finger = layoutData.fingerMap[key] || 'thumb';
        keyEl.setAttribute('data-finger', finger);

        if (key === 'Space') {
          keyEl.classList.add('overlay__key--space');
          keyEl.textContent = 'Space';
        } else if (key === 'Enter') {
          keyEl.classList.add('overlay__key--enter');
          keyEl.textContent = 'Enter';
        } else if (key === 'Backspace') {
          keyEl.classList.add('overlay__key--backspace');
          keyEl.textContent = '⌫';
        } else if (key === 'Shift') {
          keyEl.classList.add('overlay__key--shift');
          keyEl.textContent = 'Shift';
        } else {
          keyEl.textContent = key;
        }

        rowEl.appendChild(keyEl);
      });

      container.appendChild(rowEl);
    });
  } catch (err) {
    console.error('[Overlay] Failed to build keyboard:', err);
  }
}

// ===== Initialize =====
async function init() {
  // Guard against double initialization (e.g. overlay.js loaded as both
  // extension page script and injected content script).
  if (window.__childtypeOverlayInit__) {
    return;
  }
  window.__childtypeOverlayInit__ = true;

  // Check if we're running on the overlay.html page itself
  const isOverlayPage = window.location.pathname.endsWith('overlay.html');

  if (isOverlayPage) {
    // On overlay.html page - use existing elements
    // Elements are already in the DOM from overlay.html
  } else {
    // Being injected into another page - create overlay container
    createOverlayContainer();
  }

  // 默认隐藏，不拦截页面交互（仅在 startSession 时显示）
  // 仅对注入到第三方页面的覆盖层生效；overlay.html 自身页面保持可见
  if (!isOverlayPage) {
    const overlayEl = document.getElementById('childtype-overlay');
    if (overlayEl && !overlayEl.classList.contains('hidden')) {
      overlayEl.classList.add('hidden');
    }
  }

  // Fetch DOM elements (must happen after container exists)
  targetLetter = document.getElementById('target-letter');
  targetHint = document.getElementById('target-hint');
  overlayModeLabel = document.getElementById('overlay-mode-label');
  overlayWpm = document.getElementById('overlay-wpm');
  overlayAccuracy = document.getElementById('overlay-accuracy');
  overlayStreak = document.getElementById('overlay-streak');
  overlayTimer = document.getElementById('overlay-timer');
  overlayPhaseLabel = document.getElementById('overlay-phase-label');
  btnPause = document.getElementById('btn-pause');
  btnClose = document.getElementById('btn-close');
  notification = document.getElementById('notification');
  notificationIcon = document.getElementById('notification-icon');
  notificationText = document.getElementById('notification-text');
  keyboardContainer = document.getElementById('keyboard-container');

  initSoundManager();

  // 监听来自 Service Worker 的消息
  chrome.runtime.onMessage.addListener(handleMessage);

  // 全局键盘事件
  document.addEventListener('keydown', handleKeyDown);

  // 按钮事件
  if (btnClose) btnClose.addEventListener('click', stopOverlay);
  if (btnPause) btnPause.addEventListener('click', togglePause);

  // 快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stopOverlay();
  });

  // 默认显示开始提示
  if (targetHint) {
    targetHint.textContent = '选择练习模式开始打字';
  }

  // Build keyboard based on current layout setting
  const settings = await chrome.storage.local.get(['settings']);
  const layout = (settings.settings && settings.settings.keyboardLayout) || 'QWERTY';
  await buildKeyboard(layout);

  // Apply font size
  const fontSize = settings.settings?.fontSize || 16;
  if (keyboardContainer) {
    keyboardContainer.style.fontSize = `${fontSize}px`;
  }
}

/**
 * 处理来自 Service Worker / Popup 的消息
 * @param {Object} message
 */
async function handleMessage(message) {
  switch (message.type) {
    case '__ping__':
      return { pong: true };
    case 'START_SESSION':
      // Store the mode so it's available even if keys are pressed before session starts
      state.mode = message.data.mode || 'letters';
      state.letterPhase = message.data.letterPhase || 0;
      if (message.data.letterPhase) {
        const letterPhases = await import('../data/letter-phases.js');
        const ph = letterPhases.getPhase(state.letterPhase);
        if (ph) state.letterPhaseName = ph.name;
      }
      await startSession(message.data.mode);
      break;
    case 'STOP_SESSION':
      stopOverlay();
      break;
    case 'pauseSession':
      togglePause();
      break;
    case 'REWARD_UNLOCKED':
      handleRewardUnlocked(message.data);
      break;
    case 'THEME_CHANGE':
      document.documentElement.dataset.theme = message.data.theme;
      break;
    case 'LAYOUT_CHANGE': {
      try {
        const layoutName = message.data.layout || 'QWERTY';
        await buildKeyboard(layoutName);
        await applyFingerPhaseHighlight(await readCurrentFingerPhase());
      } catch (err) {
        console.error('[Overlay] Failed to handle LAYOUT_CHANGE:', err);
      }
      break;
    }
    case 'PHASE_ADVANCE': {
      try {
        const data = await chrome.storage.local.get([PROGRESS_LS_KEY]);
        const progress = data[PROGRESS_LS_KEY] || {};
        progress.fingerPhase = message.data.phase;
        await chrome.storage.local.set({ [PROGRESS_LS_KEY]: progress });
        await applyFingerPhaseHighlight(message.data.phase);
        showNotification('👆', `指法进入新阶段：${message.data.phase + 1}`);
      } catch (err) {
        console.error('[Overlay] Failed to handle PHASE_ADVANCE:', err);
      }
      break;
    }
  }
}

/**
 * 设置难度并刷新 UI
 * @param {string} diff - easy/normal/hard
 */
/**
 * 更新顶部阶段标签
 */
function updatePhaseLabel() {
  if (overlayModeLabel) {
    overlayModeLabel.textContent = `阶段 ${state.letterPhase + 1}/8 · ${state.letterPhaseName}`;
  }
}

/**
 * 开始练习会话
 * @param {string} mode - 练习模式
 */
async function startSession(mode) {
  state.active = true;
  
  // 确保 overlay 可见（移除 hidden 类）
  const overlay = document.getElementById('childtype-overlay');
  if (overlay) overlay.classList.remove('hidden');
  
  // 应用字体大小到 overlay
  chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
    const size = settings?.fontSize || 16;
    overlay.style.fontSize = `${size}px`;
  });
  
  state.mode = mode;
  state.letterPhase = 0;
  state.letterPhaseName = '基准键';
  state.letterBatchPassCount = 0;
  state.startTime = null;
  state.paused = false;
  state.pauseTime = 0;
  state.lastKeyTime = null;
  state.totalKeystrokes = 0;
  state.correctKeystrokes = 0;
  state.batchTotalKeystrokes = 0;
  state.batchCorrectKeystrokes = 0;
  state.batchStartTime = null;
  state.batchPausedTime = 0;
  state.batchPauseStartedAt = null;
  state.streak = 0;
  state.maxStreak = 0;
  state.errors = 0;
  state.batchTarget = [];
  state.batchIndex = 0;

  // 重置字母批次
  lettersBatch = [];
  lettersBatchIndex = 0;
  lettersMasterBatch = [];
  generateBatch();

  // 更新 UI
  overlayModeLabel.textContent = getModeLabel(mode);
  updatePhaseLabel();
  targetLetter.textContent = '准备开始...';
  targetLetter.className = 'overlay__target-letter';
  targetHint.textContent = '开始打字练习';
  overlayWpm.textContent = '0';
  overlayAccuracy.textContent = '--';
  overlayStreak.textContent = '0';
  overlayTimer.textContent = '0:00';

  // 开始计时器
  startTimer();

  // 设置下一个目标
  await setNextTarget();

  // 高亮第一个键
  highlightNextKey();

  console.log(`[Overlay] Session started: mode=${mode}`);
}

/**
 * 停止 overlay
 */
async function stopOverlay() {
  state.active = false;
  stopTimer();

  // 通知 Service Worker 会话结束
  if (state.totalKeystrokes > 0) {
    const elapsed = state.startTime
      ? (Date.now() - state.startTime - state.pauseTime) / 1000
      : 0;
    chrome.runtime.sendMessage({
      action: 'sessionEnd',
      duration: elapsed,
      totalKeystrokes: state.totalKeystrokes,
      errors: state.errors,
      mode: state.mode,
      streak: state.streak,
      maxStreak: state.maxStreak
    });

    // 保存字母练习阶段进度
    try {
      const progress = await chrome.storage.local.get([PROGRESS_LS_KEY]);
      const data = progress[PROGRESS_LS_KEY] || {};
      data.letterPhase = state.letterPhase;
      data.letterPhaseName = state.letterPhaseName;
      await chrome.storage.local.set({ [PROGRESS_LS_KEY]: data });
    } catch (err) {
      console.error('[Overlay] Failed to save letter phase progress:', err);
    }
  }

  // 隐藏 overlay
  const overlay = document.getElementById('childtype-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

/**
 * 暂停/恢复
 */
function togglePause() {
  if (!state.active) return;

  if (state.paused) {
    state.paused = false;
    state.pauseTime += Date.now() - state._pauseStart;
    btnPause.textContent = '⏸';
  } else {
    state.paused = true;
    state._pauseStart = Date.now();
    btnPause.textContent = '▶';
    targetLetter.textContent = '已暂停';
    targetHint.textContent = '点击暂停按钮或按 Ctrl+Shift+H 继续';
  }
}

/**
 * 获取下一个目标
 */
async function setNextTarget() {
  switch (state.mode) {
    case 'letters':
      state.batchTarget = await getBatchLetters();
      state.batchIndex = 0;
      state.target = state.batchTarget[0] || null;
      break;
    case 'ordered':
      state.batchTarget = [...LETTERS];
      state.batchIndex = 0;
      state.target = state.batchTarget[0] || null;
      break;
    case 'free':
      state.target = null; // 自由模式不限制目标
      break;
    case 'finger':
      await setFingerTarget();
      break;
    default:
      state.target = getRandomLetter();
  }

  updateTargetDisplay();
}

/**
 * 指法模式：按当前阶段选键并高亮
 */
async function setFingerTarget() {
  try {
    const phaseId = await readCurrentFingerPhase();
    state.target = await getLetterForPhase(phaseId);
    await applyFingerPhaseHighlight(phaseId);
  } catch (err) {
    console.error('[Overlay] Failed to set finger target:', err);
    state.target = getRandomLetter();
  }
}

/**
 * 更新目标显示
 */
function updateTargetDisplay() {
  if (!state.target) {
    targetLetter.textContent = '自由打字模式';
    return;
  }

  if (state.mode === 'letters') {
    if (!state.batchTarget.length) {
      targetLetter.textContent = '准备开始...';
      return;
    }
    targetLetter.innerHTML = state.batchTarget.map((ch, i) => {
      if (i < state.batchIndex) {
        return `<span class="target-done">${ch.toUpperCase()}</span>`;
      }
      if (i === state.batchIndex) {
        return `<span class="target-current">${ch.toUpperCase()}</span>`;
      }
      return `<span class="target-pending">${ch.toUpperCase()}</span>`;
    }).join(' ');
  }
}

/**
 * 处理按键按下
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (!state.active) {
    // Pressing any key starts the session (if a mode was already selected)
    // The service worker sends START_SESSION, but we also allow keypress to start it
    // as a fallback in case the message was delayed or lost
    if (state.mode) {
      startSession(state.mode).catch(err => {
        console.error('[Overlay] Failed to start session on keypress:', err);
      });
    }
    return;
  }
  if (e.ctrlKey || e.altKey || e.metaKey) return; // 忽略修饰键组合
  if (e.repeat) return; // 忽略重复按键

  const key = e.key;

  // 忽略功能键（Shift、Control 等）
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(key)) {
    return;
  }

  // 开始计时
  if (!state.startTime) {
    state.startTime = Date.now();
  }

  // 判定
  if (state.mode === 'free') {
    // 自由模式：所有按键都算有效
    state.totalKeystrokes++;
    state.correctKeystrokes++;
    state.lastKeyTime = Date.now();
    animateKey(key, true);
    updateStats();
    return;
  }

  processKey(key, e.code);
}

/**
 * 处理按键判定
 * @param {string} pressedKey - 按下的键
 * @param {string} code - 按键代码
 */
async function processKey(pressedKey, code) {
  let expected = typeof state.target === 'object' ? state.target.text : state.target;

  if (!expected) {
    await setNextTarget();
    return;
  }

  if (state.mode === 'letters') {
    expected = state.batchTarget[state.batchIndex];
    if (!expected) {
      await setNextTarget();
      return;
    }
  }

  const expectedChar = expected.toLowerCase();
  const isCorrect = pressedKey.toLowerCase() === expectedChar;

  state.totalKeystrokes++;
  state.lastKeyTime = Date.now();
  if (state.mode === 'letters' || state.mode === 'ordered') {
    state.batchTotalKeystrokes++;
  }

  try {
    const finger = await getFingerForKey(expectedChar);
    const responseMs = state.lastKeyTime ? Date.now() - state.lastKeyTime : null;
    chrome.runtime.sendMessage({
      action: 'recordKey',
      key: expectedChar,
      finger,
      correct: isCorrect,
      responseMs
    });
  } catch (recErr) {
    console.error('[Overlay] Failed to record key:', recErr);
  }

  if (isCorrect) {
    state.correctKeystrokes++;
    if (state.mode === 'letters' || state.mode === 'ordered') {
      state.batchCorrectKeystrokes++;
    }
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    animateKey(pressedKey, true);
    highlightKey(pressedKey, 'correct');
    if (soundManager) soundManager.playCorrect();

    // 移动到下一个
    if (state.mode === 'letters' || state.mode === 'ordered') {
      state.batchIndex++;
      state.target = state.batchTarget[state.batchIndex] || null;
      if (state.batchIndex >= state.batchTarget.length) {
        if (state.mode === 'ordered') {
          stopOverlay();
        } else {
          console.log('[Overlay] Batch completed (final correct key). batchIndex=%d length=%d phase=%d',
            state.batchIndex, state.batchTarget.length, state.letterPhase);
          await setNextTarget();
        }
      } else {
        updateTargetDisplay();
        highlightNextKey();
      }
    }
  } else {
    state.errors++;
    state.streak = 0;

    animateKey(pressedKey, false);
    highlightKey(pressedKey, 'wrong');
    if (soundManager) soundManager.playWrong();

    // 错误时在目标显示提示
    targetLetter.className = 'overlay__target-letter wrong';
    setTimeout(() => {
      targetLetter.className = 'overlay__target-letter';
    }, 300);
  }

  // 通知统计更新
  chrome.runtime.sendMessage({
    action: 'updateStats',
    wpm: calculateWPM(),
    accuracy: getAccuracy(),
    streak: state.streak,
    totalKeystrokes: state.totalKeystrokes,
    mode: state.mode,
    batchCorrect: state.batchCorrectKeystrokes,
    batchTotal: state.batchTotalKeystrokes,
    batchWpm: state.batchStartTime && state.batchTotalKeystrokes >= 5
      ? Math.round((state.batchCorrectKeystrokes / 5) / ((Date.now() - state.batchStartTime) / 1000 / 60) * 10) / 10
      : calculateWPM()
  });

  updateStats();
}

/**
 * 计算 WPM
 * @returns {number}
 */
function calculateWPM() {
  if (!state.startTime || state.totalKeystrokes < 5) return 0;
  const elapsed = (Date.now() - state.startTime - state.pauseTime) / 1000;
  if (elapsed <= 0) return 0;
  const words = state.correctKeystrokes / 5;
  const minutes = elapsed / 60;
  return Math.round((words / minutes) * 10) / 10;
}

/**
 * 计算准确率
 * @returns {number}
 */
function getAccuracy() {
  if (state.totalKeystrokes === 0) return 0;
  return Math.round((state.correctKeystrokes / state.totalKeystrokes) * 1000) / 10;
}

/**
 * 更新统计显示
 */
function updateStats() {
  overlayWpm.textContent = calculateWPM();
  overlayAccuracy.textContent = getAccuracy();
  overlayStreak.textContent = state.streak;
}

/**
 * 启动计时器
 */
function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    if (state.paused) return;
    const elapsed = (Date.now() - state.startTime - state.pauseTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    overlayTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

/**
 * 停止计时器
 */
function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

/**
 * 获取模式显示标签
 * @param {string} mode
 * @returns {string}
 */
function getModeLabel(mode) {
  const labels = {
    letters: '🔤 字母练习',
    ordered: '🔤 顺序字母',
    free: '✍️ 自由打字',
    finger: '👆 指法练习'
  };
  return labels[mode] || '打字练习';
}

/**
 * 生成一个新的字母批次（按当前阶段）
 * 使用 letter-phases.js 按「键位范围 + 组合规则」双递进生成
 * @returns {string[]}
 */
async function generateBatch() {
  const phaseId = state.letterPhase;

  const layoutData = (await import('../data/keyboard-layouts.js')).default;
  const settings = await chrome.storage.local.get(['settings']);
  const layoutName = (settings.settings && settings.settings.keyboardLayout) || 'QWERTY';
  const layoutObj = layoutData[layoutName] || layoutData.QWERTY;

  const letterPhases = await import('../data/letter-phases.js');
  const phase = letterPhases.getPhase(phaseId);
  const batchSize = phase ? phase.batchSize : LETTERS_PER_BATCH;

  lettersBatch = letterPhases.generateBatchKeys(
    phaseId, layoutName, batchSize
  );
  lettersBatchIndex = 0;
  state.batchStartTime = Date.now();
  state.batchTotalKeystrokes = 0;
  state.batchCorrectKeystrokes = 0;
  state.batchPauseStartedAt = null;
  return lettersBatch;
}

/**
 * 获取一整批字母用于一次性展示
 * @returns {string[]}
 */
async function getBatchLetters() {
  // 每批次必结算，不再依赖 lettersBatchNeedsRefresh 标志
  const batchDurationSec = state.batchStartTime
    ? (Date.now() - state.batchStartTime) / 1000
    : 0;
  const batchTotal = state.batchTotalKeystrokes || 0;
  const batchCorrect = state.batchCorrectKeystrokes || 0;

  // 只有非首批（已有数据）才结算上一批
  if (lettersBatch.length > 0 && batchTotal > 0) {
    const batchAccuracy = batchTotal > 0
      ? Math.round((batchCorrect / batchTotal) * 1000) / 10
      : 0;

    // 短批次 WPM 修正：batchDurationSec 太小时回退到整体 WPM
    const overallWpm = calculateWPM();
    const batchWpm = state.startTime && batchTotal >= 5 && batchDurationSec >= 0.5
      ? Math.round((batchCorrect / 5) / (batchDurationSec / 60) * 10) / 10
      : overallWpm;  // 时间太短用整体 WPM，避免归零误判

    console.log('[Overlay] Batch settle. total=%d correct=%d accuracy=%.1f wpm=%.1f dur=%.2fs phase=%d',
      batchTotal, batchCorrect, batchAccuracy, batchWpm, batchDurationSec, state.letterPhase);

    // 阶段判定：达标升阶，不达标降阶
    await checkPhaseCompletion(batchAccuracy, batchWpm);

    chrome.runtime.sendMessage({
      action: 'lettersBatchStarted',
      batchIndex: lettersBatchIndex,
      prevBatch: lettersBatch,
      prevCount: lettersBatchIndex,
      correct: batchCorrect,
      total: batchTotal,
      batchAccuracy: batchAccuracy,
      batchWpm: batchWpm,
      batchMinutes: batchDurationSec / 60
    });
  }

  return generateBatch();
}

/**
 * 检查阶段是否达标，达标升阶，不达标降阶
 * @param {number} accuracy 批次准确率 (0-100)
 * @param {number} wpm 批次 WPM
 */
async function checkPhaseCompletion(accuracy, wpm) {
  const letterPhases = await import('../data/letter-phases.js');
  const phase = letterPhases.getPhase(state.letterPhase);
  if (!phase) return;

  const passAccuracy = accuracy >= (phase.require.accuracy || 0.85) * 100;
  const passWpm = wpm >= (phase.require.wpm || 20);

  console.log('[Overlay] checkPhaseCompletion: phase=%s require(acc=%.2f wpm=%d) acc=%.1f wpm=%.1f passAcc=%s passWpm=%s',
    state.letterPhaseName, phase.require.accuracy || 0.85, phase.require.wpm || 20,
    accuracy, wpm, passAccuracy, passWpm);

  if (passAccuracy && passWpm) {
    state.letterBatchPassCount++;
    console.log('[Overlay] PASS. passCount=%d minBatches=%d', state.letterBatchPassCount, phase.require.minBatches || 1);
    if (state.letterBatchPassCount >= (phase.require.minBatches || 1)) {
      await advancePhase();
    }
  } else {
    // 未达标：自动回落至基准键阶段
    if (state.letterPhase > 0) {
      state.letterPhase = 0;
      state.letterBatchPassCount = 0;
      const home = letterPhases.getPhase(0);
      state.letterPhaseName = home ? home.name : '基准键';
      showNotification('⚠️', '未达标，回落到基准键阶段');
      updatePhaseLabel();
      await refreshBatchForPhase();
    }
    state.letterBatchPassCount = 0;
  }
}

/**
 * 推进到下一阶段（共 8 阶段 0-7）
 */
async function advancePhase() {
  const letterPhases = await import('../data/letter-phases.js');
  const maxPhase = letterPhases.phaseCount() - 1;  // 7

  if (state.letterPhase >= maxPhase) {
    // 已满级
    showNotification('🏆', `所有阶段已完成！当前【${state.letterPhaseName}】`);
    state.letterBatchPassCount = 0;
    return;
  }

  // 升阶
  state.letterPhase++;
  state.letterBatchPassCount = 0;
  const newPhase = letterPhases.getPhase(state.letterPhase);
  state.letterPhaseName = newPhase ? newPhase.name : '';
  showNotification('🎊', `突破阶段 ${state.letterPhase}！进入【${state.letterPhaseName}】`);
  updatePhaseLabel();
  await refreshBatchForPhase();
}

/**
 * 为当前阶段刷新批次
 */
async function refreshBatchForPhase() {
  await generateBatch();
}

function getRandomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

// ===== Virtual Keyboard Interaction =====

/**
 * 高亮下一个目标键
 */
function highlightNextKey() {
  // 清除所有 target 高亮 - 动态获取键元素
  const allKeys = document.querySelectorAll('.overlay__key');
  allKeys.forEach(key => key.classList.remove('overlay__key--target'));

  if (!state.target) return;

  let keyChar;
  if (state.mode === 'letters') {
    keyChar = state.batchTarget[state.batchIndex];
  } else {
    keyChar = typeof state.target === 'object' ? state.target.text : state.target;
  }

  if (!keyChar) return;

  // 找到对应的虚拟键
  const targetKey = document.querySelector(`.overlay__key[data-key="${keyChar.toLowerCase()}"]`);
  if (targetKey) {
    targetKey.classList.add('overlay__key--target');
  }
}

/**
 * 动画反馈虚拟按键
 * @param {string} key - 按键字符
 * @param {boolean} correct - 是否正确
 */
function animateKey(key, correct) {
  // 找到对应的虚拟键
  const keyEl = document.querySelector(`.overlay__key[data-key="${key.toLowerCase()}"]`) ||
                document.querySelector(`.overlay__key[data-key="${key}"]`);

  if (keyEl) {
    keyEl.classList.add('overlay__key--pressed');
    setTimeout(() => {
      keyEl.classList.remove('overlay__key--pressed');
    }, 100);
  }
}

/**
 * 高亮按键（正确/错误）
 * @param {string} key - 按键字符
 * @param {string} state - 'correct' | 'wrong'
 */
function highlightKey(key, state) {
  const keyEl = document.querySelector(`.overlay__key[data-key="${key.toLowerCase()}"]`) ||
                document.querySelector(`.overlay__key[data-key="${key}"]`);

  if (keyEl) {
    keyEl.classList.add(`overlay__key--${state}`);
    setTimeout(() => {
      keyEl.classList.remove(`overlay__key--${state}`);
    }, 300);
  }
}

/**
 * 统一处理奖励解锁（升级 / 成就 / 阶段成就）
 * @param {Object} data
 */
function handleRewardUnlocked(data) {
  if (!data) return;
  if (data.newLevel != null) {
    let text = `升级到 Lv.${data.newLevel}! ${data.levelName || ''}`;
    if (data.achievement) {
      text += ` ｜ 成就解锁：${data.achievement.name}`;
    }
    showNotification('🎉', text.trim());
    return;
  }
  if (data.achievement) {
    showNotification('🏆', `成就解锁：${data.achievement.name}`);
  }
}

/**
 * 显示通知
 * @param {string} icon
 * @param {string} text
 */
function showNotification(icon, text) {
  notificationIcon.textContent = icon;
  notificationText.textContent = text;
  notification.hidden = false;

  setTimeout(() => {
    notification.hidden = true;
  }, 3000);
}

// ===== Start =====
init().catch(err => console.error('[Overlay] init failed:', err));
