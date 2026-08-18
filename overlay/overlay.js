/**
 * ChildType Overlay — Content Script
 * 打字覆盖层的核心逻辑：键盘事件捕获、打字判定、统计、虚拟键盘渲染
 * @module overlay/overlay
 */

// ===== State =====
let state = {
  active: false,
  mode: 'letters',
  difficulty: 'normal',
  target: null,
  startTime: null,
  paused: false,
  pauseTime: 0,
  lastKeyTime: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  streak: 0,
  maxStreak: 0,
  errors: 0,
  timerInterval: null,
  sessionStats: null
};

// ===== Word/Sentence Data (minimal for Phase 0) =====
const WORDS_EASY = ['cat', 'dog', 'hat', 'run', 'big', 'red', 'sun', 'cup', 'bus', 'box'];
const WORDS_MEDIUM = ['apple', 'house', 'water', 'happy', 'music', 'school', 'tree', 'bird', 'fish', 'cake'];
const WORDS_HARD = ['beautiful', 'challenge', 'education', 'computer', 'elephant', 'friendship', 'mountain', 'notebook'];
const SENTENCES_SHORT = [
  'I like cats.',
  'The sun is hot.',
  'She runs fast.',
  'He reads books.',
  'We play games.'
];
const SENTENCES_MEDIUM = [
  'The quick brown fox jumps over the lazy dog.',
  'She sells sea shells by the sea shore.',
  'How much wood would a woodchuck chuck.'
];

// Letter pool for random mode
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// ===== DOM Elements =====
const targetLetter = document.getElementById('target-letter');
const targetHint = document.getElementById('target-hint');
const overlayModeLabel = document.getElementById('overlay-mode-label');
const overlayWpm = document.getElementById('overlay-wpm');
const overlayAccuracy = document.getElementById('overlay-accuracy');
const overlayStreak = document.getElementById('overlay-streak');
const overlayTimer = document.getElementById('overlay-timer');
const btnPause = document.getElementById('btn-pause');
const btnClose = document.getElementById('btn-close');
const notification = document.getElementById('notification');
const notificationIcon = document.getElementById('notification-icon');
const notificationText = document.getElementById('notification-text');
const keyboardContainer = document.getElementById('keyboard-container');
const allKeys = document.querySelectorAll('.overlay__key');

// ===== Create overlay container =====
function createOverlayContainer() {
  const existing = document.getElementById('childtype-overlay');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'childtype-overlay';
  container.innerHTML = `
    <div class="overlay__topbar">
      <div class="overlay__mode-label" id="overlay-mode-label">字母练习</div>
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
    <div class="overlay__keyboard" id="keyboard-container">
      <div class="overlay__keyboard-row" id="row-0">
        <div class="overlay__key" data-key="`" data-finger="left-pinky">`</div>
        <div class="overlay__key" data-key="1" data-finger="left-pinky">1</div>
        <div class="overlay__key" data-key="2" data-finger="left-ring">2</div>
        <div class="overlay__key" data-key="3" data-finger="left-middle">3</div>
        <div class="overlay__key" data-key="4" data-finger="left-index">4</div>
        <div class="overlay__key" data-key="5" data-finger="left-index">5</div>
        <div class="overlay__key" data-key="6" data-finger="right-index">6</div>
        <div class="overlay__key" data-key="7" data-finger="right-index">7</div>
        <div class="overlay__key" data-key="8" data-finger="right-middle">8</div>
        <div class="overlay__key" data-key="9" data-finger="right-ring">9</div>
        <div class="overlay__key" data-key="0" data-finger="right-pinky">0</div>
        <div class="overlay__key" data-key="-" data-finger="right-pinky">-</div>
        <div class="overlay__key" data-key="=" data-finger="right-pinky">=</div>
        <div class="overlay__key overlay__key--backspace" data-key="Backspace" data-finger="right-pinky">⌫</div>
      </div>
      <div class="overlay__keyboard-row" id="row-1">
        <div class="overlay__key overlay__key--indent" data-key="q" data-finger="left-pinky">Q</div>
        <div class="overlay__key" data-key="w" data-finger="left-ring">W</div>
        <div class="overlay__key" data-key="e" data-finger="left-middle">E</div>
        <div class="overlay__key" data-key="r" data-finger="left-index">R</div>
        <div class="overlay__key" data-key="t" data-finger="left-index">T</div>
        <div class="overlay__key" data-key="y" data-finger="right-index">Y</div>
        <div class="overlay__key" data-key="u" data-finger="right-index">U</div>
        <div class="overlay__key" data-key="i" data-finger="right-middle">I</div>
        <div class="overlay__key" data-key="o" data-finger="right-ring">O</div>
        <div class="overlay__key" data-key="p" data-finger="right-pinky">P</div>
        <div class="overlay__key" data-key="[" data-finger="right-pinky">[</div>
        <div class="overlay__key" data-key="]" data-finger="right-pinky">]</div>
        <div class="overlay__key" data-key="\\" data-finger="right-pinky">\</div>
      </div>
      <div class="overlay__keyboard-row" id="row-2">
        <div class="overlay__key overlay__key--home overlay__key--indent" data-key="a" data-finger="left-pinky" title="基准键">A</div>
        <div class="overlay__key overlay__key--home" data-key="s" data-finger="left-ring" title="基准键">S</div>
        <div class="overlay__key overlay__key--home" data-key="d" data-finger="left-middle" title="基准键">D</div>
        <div class="overlay__key overlay__key--home" data-key="f" data-finger="left-index" title="基准键 · 凸起">F</div>
        <div class="overlay__key overlay__key--home" data-key="g" data-finger="left-index" title="基准键">G</div>
        <div class="overlay__key overlay__key--home" data-key="h" data-finger="right-index" title="基准键">H</div>
        <div class="overlay__key overlay__key--home" data-key="j" data-finger="right-index" title="基准键 · 凸起">J</div>
        <div class="overlay__key overlay__key--home" data-key="k" data-finger="right-middle" title="基准键">K</div>
        <div class="overlay__key overlay__key--home" data-key="l" data-finger="right-ring" title="基准键">L</div>
        <div class="overlay__key overlay__key--home" data-key=";" data-finger="right-pinky" title="基准键">;</div>
        <div class="overlay__key" data-key="'" data-finger="right-pinky">'</div>
        <div class="overlay__key overlay__key--enter" data-key="Enter" data-finger="right-pinky">Enter</div>
      </div>
      <div class="overlay__keyboard-row" id="row-3">
        <div class="overlay__key overlay__key--shift overlay__key--indent-wide" data-key="Shift" data-finger="left-pinky">Shift</div>
        <div class="overlay__key" data-key="z" data-finger="left-pinky">Z</div>
        <div class="overlay__key" data-key="x" data-finger="left-ring">X</div>
        <div class="overlay__key" data-key="c" data-finger="left-middle">C</div>
        <div class="overlay__key" data-key="v" data-finger="left-index">V</div>
        <div class="overlay__key" data-key="b" data-finger="left-index">B</div>
        <div class="overlay__key" data-key="n" data-finger="right-index">N</div>
        <div class="overlay__key" data-key="m" data-finger="right-index">M</div>
        <div class="overlay__key" data-key="," data-finger="right-middle">,</div>
        <div class="overlay__key" data-key="." data-finger="right-ring">.</div>
        <div class="overlay__key" data-key="/" data-finger="right-pinky">/</div>
        <div class="overlay__key overlay__key--shift" data-key="Shift" data-finger="right-pinky">Shift</div>
      </div>
      <div class="overlay__keyboard-row" id="row-4">
        <div class="overlay__key overlay__key--space" data-key=" " data-finger="thumb">Space</div>
      </div>
    </div>
    <div class="overlay__notification" id="notification" hidden>
      <span class="overlay__notification-icon" id="notification-icon">🎉</span>
      <span class="overlay__notification-text" id="notification-text">升级!</span>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

// ===== Initialize =====
function init() {
  createOverlayContainer();

  // 监听来自 Service Worker 的消息
  chrome.runtime.onMessage.addListener(handleMessage);

  // 全局键盘事件
  document.addEventListener('keydown', handleKeyDown);

  // 按钮事件
  btnClose.addEventListener('click', stopOverlay);
  btnPause.addEventListener('click', togglePause);

  // 快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stopOverlay();
  });

  // 默认显示开始提示
  targetHint.textContent = '选择练习模式开始打字';
}

/**
 * 处理来自 Service Worker / Popup 的消息
 * @param {Object} message
 */
function handleMessage(message) {
  switch (message.type) {
    case 'START_SESSION':
      startSession(message.data.mode, message.data.difficulty);
      break;
    case 'STOP_SESSION':
      stopOverlay();
      break;
    case 'pauseSession':
      togglePause();
      break;
    case 'LEVEL_UP':
      showNotification('🎉', `升级到 Lv.${message.data.newLevel}! ${message.data.levelName}`);
      break;
    case 'ACHIEVEMENT_UNLOCKED':
      showNotification('🏆', `成就解锁: ${message.data.achievement.name}`);
      break;
  }
}

/**
 * 开始练习会话
 * @param {string} mode - 练习模式
 * @param {string} difficulty - 难度
 */
function startSession(mode, difficulty) {
  state.active = true;
  state.mode = mode;
  state.difficulty = difficulty;
  state.startTime = null;
  state.paused = false;
  state.pauseTime = 0;
  state.lastKeyTime = null;
  state.totalKeystrokes = 0;
  state.correctKeystrokes = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.errors = 0;

  // 更新 UI
  overlayModeLabel.textContent = getModeLabel(mode);
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
  setNextTarget();

  // 高亮第一个键
  highlightNextKey();

  console.log(`[Overlay] Session started: mode=${mode}, difficulty=${difficulty}`);
}

/**
 * 停止 overlay
 */
function stopOverlay() {
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
      mode: state.mode
    });
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
function setNextTarget() {
  switch (state.mode) {
    case 'letters':
      state.target = getRandomLetter();
      break;
    case 'words':
      state.target = getRandomWord();
      state._wordIndex = 0;
      break;
    case 'sentences':
      state.target = getRandomSentence();
      state._wordIndex = 0;
      state._charIndex = 0;
      break;
    case 'free':
      state.target = null; // 自由模式不限制目标
      break;
    case 'finger':
      state.target = getRandomLetter(); // TODO: finger-specific filtering
      break;
    default:
      state.target = getRandomLetter();
  }

  updateTargetDisplay();
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
    targetLetter.textContent = state.target.toUpperCase();
  } else if (state.mode === 'words') {
    const word = typeof state.target === 'object' ? state.target.text : state.target;
    const display = word.split('').map((ch, i) =>
      i < state._wordIndex ? ch : '_'
    ).join(' ');
    targetLetter.textContent = display;
  } else if (state.mode === 'sentences') {
    const sentence = typeof state.target === 'object' ? state.target.text : state.target;
    const display = sentence.split('').map((ch, i) =>
      i < state._charIndex ? ch : '·'
    ).join('');
    targetLetter.textContent = display;
  }
}

/**
 * 处理按键按下
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (!state.active) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return; // 忽略修饰键组合
  if (e.repeat) return; // 忽略重复按键

  const key = e.key;

  // 忽略功能键
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(key)) {
    // 特殊处理：Space 在自由模式下算有效按键
    if (key === ' ' && state.mode === 'free') {
      processKey(' ', key);
    }
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
function processKey(pressedKey, code) {
  const expected = typeof state.target === 'object'
    ? state.target.text[state._wordIndex || state._charIndex]
    : state.target;

  if (!expected) {
    setNextTarget();
    return;
  }

  const isCorrect = pressedKey.toLowerCase() === expected.toLowerCase();

  state.totalKeystrokes++;
  state.lastKeyTime = Date.now();

  if (isCorrect) {
    state.correctKeystrokes++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    animateKey(pressedKey, true);
    highlightKey(pressedKey, 'correct');

    // 移动到下一个
    if (state.mode === 'letters') {
      setNextTarget();
    } else if (state.mode === 'words') {
      state._wordIndex++;
      const word = typeof state.target === 'object' ? state.target.text : state.target;
      if (state._wordIndex >= word.length) {
        setNextTarget();
      } else {
        updateTargetDisplay();
        highlightNextKey();
      }
    } else if (state.mode === 'sentences') {
      state._charIndex++;
      const sentence = typeof state.target === 'object' ? state.target.text : state.target;
      if (state._charIndex >= sentence.length) {
        setNextTarget();
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
    totalKeystrokes: state.totalKeystrokes
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
    words: '📖 单词练习',
    sentences: '📋 句子练习',
    free: '✍️ 自由打字',
    finger: '👆 指法练习'
  };
  return labels[mode] || '打字练习';
}

/**
 * 获取随机字母
 * @returns {string}
 */
function getRandomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

/**
 * 获取随机单词
 * @returns {Object} { text, difficulty }
 */
function getRandomWord() {
  let pool;
  switch (state.difficulty) {
    case 'easy': pool = WORDS_EASY; break;
    case 'hard': pool = WORDS_HARD; break;
    default: pool = Math.random() < 0.5 ? WORDS_EASY.concat(WORDS_MEDIUM) : WORDS_MEDIUM;
  }
  const text = pool[Math.floor(Math.random() * pool.length)];
  return { text, difficulty: state.difficulty };
}

/**
 * 获取随机句子
 * @returns {Object} { text, difficulty }
 */
function getRandomSentence() {
  let pool;
  switch (state.difficulty) {
    case 'easy': pool = SENTENCES_SHORT; break;
    case 'hard': pool = SENTENCES_MEDIUM; break;
    default: pool = Math.random() < 0.5 ? SENTENCES_SHORT : SENTENCES_MEDIUM;
  }
  const text = pool[Math.floor(Math.random() * pool.length)];
  return { text, difficulty: state.difficulty };
}

// ===== Virtual Keyboard Interaction =====

/**
 * 高亮下一个目标键
 */
function highlightNextKey() {
  // 清除所有 target 高亮
  allKeys.forEach(key => key.classList.remove('overlay__key--target'));

  if (!state.target) return;

  const keyChar = typeof state.target === 'object'
    ? state.target.text[state._wordIndex || state._charIndex]
    : state.target;

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
init();
