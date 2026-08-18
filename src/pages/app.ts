/**
 * childtype 主入口
 * 整合所有组件，处理页面导航和状态管理
 */
import '../pages/styles/main.css';
import '../pages/styles/keyboard.css';

import { VirtualKeyboard } from '../shared/components/keyboard';
import { TypingArea } from '../shared/components/typing-area';
import { progressStore } from '../shared/store/progress';
import { LESSONS, getLessonsByLevel } from '../shared/data/lessons';
import { FREE_PRACTICE_TEXTS, TIMED_TEXTS } from '../shared/data/words';
import { calculateWPM, calculateAccuracy, calculateStars, formatTime } from '../shared/lib/utils';
import { DEFAULT_PROGRESS, LEVELS, FINGER_MAP, FINGER_COLORS } from '../shared/lib/constants';
import { ACHIEVEMENTS } from '../shared/data/achievements';
import type { UserProgress, PracticeResult, TypingState, Finger } from '../shared/lib/types';

// ==================== 全局状态 ====================
let currentProgress: UserProgress = { ...DEFAULT_PROGRESS };
let currentLesson: any = null;
let currentMode: string = 'lesson';
let currentText: string = '';
let typingArea: TypingArea | null = null;
let keyboard: VirtualKeyboard | null = null;

// ==================== 初始化 ====================
async function init(): Promise<void> {
  currentProgress = await progressStore.get();
  console.log('初始进度:', currentProgress);
  console.log('L1 课程:', getLessonsByLevel(1));
  initNav();
  initLessonSection();
  initFreeSection();
  initTimedSection();
  initStatsPanel();
  initSettings();
}

// ==================== 导航 ====================
function initNav(): void {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach((btn: Element) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b: Element) => b.classList.remove('active'));
      btn.classList.add('active');

      const btnId = (btn as HTMLElement).id;
      const sectionId = btnId.replace('btn-', 'section-');
      document.querySelectorAll('.section').forEach((s: Element) => s.classList.remove('active'));
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add('active');
      }

      currentMode = btnId.replace('btn-', '').replace('settings', 'free');
      if (btnId === 'btn-settings') {
        currentMode = 'settings';
      }
    });
  });
}

// ==================== 指法教学 ====================
function initLessonSection(): void {
  const selector = document.getElementById('lesson-selector');
  const display = document.getElementById('typing-display');
  const keyboardEl = document.getElementById('keyboard-container');

  if (!selector || !display || !keyboardEl) return;

  selector.innerHTML = '';
  const levels = [1, 2, 3, 4, 5, 6];
  levels.forEach((level) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn level-btn';
    btn.dataset.level = String(level);

    const isUnlocked = level <= currentProgress.currentLevel;
    const lessons = getLessonsByLevel(level);
    const completedCount = lessons.filter((l) => currentProgress.lessonsCompleted.includes(l.id)).length;

    let label = `Level ${level}`;
    if (isUnlocked) {
      label += ` (${completedCount}/${lessons.length})`;
    } else {
      label += ' 🔒';
    }
    btn.textContent = label;

    btn.addEventListener('click', () => {
      if (!isUnlocked) return;
      renderLessonsForLevel(level, selector);
    });

    selector.appendChild(btn);
  });

  // 显示当前练习提示
  const hintEl = document.getElementById('typing-hint');
  if (hintEl) {
    hintEl.textContent = '选择 Level 开始练习';
  }

  renderLessonsForLevel(1, selector);
}

function renderLessonsForLevel(level: number, selector: HTMLElement): void {
  const display = document.getElementById('typing-display');
  const keyboardEl = document.getElementById('keyboard-container');

  // 切换按钮高亮
  selector.querySelectorAll('.mode-btn').forEach((btn: Element) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.level === String(level));
  });

  const lessons = getLessonsByLevel(level);
  selector.innerHTML = '';

  // 课程列表
  const listTitle = document.createElement('h3');
  listTitle.style.cssText = 'margin-bottom: 12px; font-size: 16px; color: var(--text-secondary);';
  listTitle.textContent = `Level ${level} 课程`;
  selector.appendChild(listTitle);

  lessons.forEach((lesson: any, idx: number) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn lesson-btn';
    btn.textContent = `第${idx + 1}课: ${lesson.title}`;
    btn.title = lesson.description;

    const isCompleted = currentProgress.lessonsCompleted.includes(lesson.id);
    if (isCompleted) {
      btn.textContent += ' ✓';
    }

    btn.addEventListener('click', () => {
      startLesson(lesson);
      // 更新提示
      const hintEl = document.getElementById('typing-hint');
      if (hintEl) {
        hintEl.textContent = lesson.description;
      }
    });

    selector.appendChild(btn);
  });

  // 更新提示
  const hintEl = document.getElementById('typing-hint');
  if (hintEl && lessons.length > 0) {
    hintEl.textContent = lessons[0].description || '开始练习';
  }

  if (lessons.length > 0) {
    startLesson(lessons[0]);
  }
}

function startLesson(lesson: any): void {
  currentLesson = lesson;
  currentText = lesson.text;

  // 初始化打字区域
  if (typingArea) {
    typingArea.reset(lesson.text);
  } else {
    const display = document.getElementById('typing-display')!;
    typingArea = new TypingArea({
      containerId: 'typing-display',
      text: lesson.text,
      onResult: (state: TypingState) => handleResult(state, lesson),
      onKeyPress: (key: string) => handleKeyVisual(key),
    });
  }

  // 初始化键盘（传入当前课程手指范围）
  if (keyboard) {
    keyboard.destroy();
  }
  keyboard = new VirtualKeyboard({
    containerId: 'keyboard-container',
    onKeyPress: (key: string) => handleKeyVisual(key),
    showFingerLabels: true,
  });
}

function handleKeyVisual(key: string): void {
  // 按键弹跳动画由 keyboard 组件处理
  if (typingArea && currentLesson) {
    const currentIndex = typingArea.getCurrentIndex();
    if (currentLesson && keyboard) {
      updateFlashKey(currentLesson.text, currentIndex);
    }
  }
}

function handleResult(state: TypingState, lesson: any): void {
  const duration = (state.endTime - state.startTime) / 1000;
  const wpm = calculateWPM(state.correctCount, duration);
  const accuracy = calculateAccuracy(state.correctCount, state.wrongCount);
  const stars = calculateStars(wpm, accuracy);

  const result: PracticeResult = {
    mode: 'lesson',
    wpm,
    accuracy,
    duration,
    stars,
    date: new Date().toISOString(),
    lessonId: lesson.id,
  };

  if (timedWpmInterval) { clearInterval(timedWpmInterval); timedWpmInterval = null; }
  progressStore.saveResult(result).then(() => {
    showResultModal(wpm, accuracy, stars, duration);
  });

  progressStore.completeLesson(lesson.id);
}

// 闪烁提示当前需要按的键
function updateFlashKey(text: string, currentIndex: number): void {
  if (!keyboard || currentIndex >= text.length) return;
  const currentChar = text[currentIndex];
  keyboard.flashKey(currentChar);
}

function showResultModal(wpm: number, accuracy: number, stars: number, duration: number): void {
  const display = document.getElementById('typing-display');
  if (!display) return;

  const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  // 根据星星数显示不同鼓励语
  let encouragement = '';
  if (stars === 3) {
    encouragement = '🎉 太棒了！完美的打字！';
  } else if (stars === 2) {
    encouragement = '👍 不错！继续加油！';
  } else {
    encouragement = '💪 加油！多练习就会进步！';
  }

  display.innerHTML = `
    <div class="result-modal">
      <h2>${encouragement}</h2>
      <div class="stars-display">${starsStr}</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value wpm-value">${wpm}</span>
          <span class="stat-label">WPM</span>
        </div>
        <div class="stat-item">
          <span class="stat-value accuracy-value">${accuracy}%</span>
          <span class="stat-label">准确率</span>
        </div>
        <div class="stat-item">
          <span class="stat-value time-value">${formatTime(duration)}</span>
          <span class="stat-label">用时</span>
        </div>
      </div>
      <button class="retry-btn" id="retry-btn">再来一次 🔄</button>
    </div>
  `;

  // 添加重试按钮事件
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      // 重新加载当前课程
      if (currentLesson) {
        startLesson(currentLesson);
      }
      // 刷新统计面板
      renderStats();
    });
  }
}

// ==================== 自由练习 ====================
function initFreeSection(): void {
  const selector = document.getElementById('free-selector');
  const display = document.getElementById('typing-display-free');
  const keyboardEl = document.getElementById('keyboard-container-free');

  if (!selector || !display || !keyboardEl) return;

  selector.innerHTML = '';
  const hintEl = document.getElementById('free-hint');

  Object.entries(FREE_PRACTICE_TEXTS).forEach(([key, text]) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn';
    btn.textContent = key;
    btn.title = text;
    btn.addEventListener('click', () => {
      startFreePractice(text);
      if (hintEl) {
        hintEl.textContent = `自由练习 - ${key}`;
      }
    });
    selector.appendChild(btn);
  });

  if (hintEl) {
    hintEl.textContent = '选择一篇文章开始自由练习';
  }
}

function startFreePractice(text: string): void {
  currentText = text;

  if (typingArea) {
    typingArea.reset(text);
  } else {
    const display = document.getElementById('typing-display-free')!;
    typingArea = new TypingArea({
      containerId: 'typing-display-free',
      text: text,
      onResult: (state: TypingState) => handleResult(state, { id: 'free', text }),
    });
  }

  if (keyboard) {
    keyboard.destroy();
  }
  keyboard = new VirtualKeyboard({
    containerId: 'keyboard-container-free',
  });
}

// ==================== 计时挑战 ====================
function initTimedSection(): void {
  const selector = document.getElementById('timed-selector');
  const display = document.getElementById('typing-display-timed');
  const keyboardEl = document.getElementById('keyboard-container-timed');

  if (!selector || !display || !keyboardEl) return;

  selector.innerHTML = '';
  const hintEl = document.getElementById('timed-hint');

  [15, 30, 60].forEach((seconds) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn';
    btn.textContent = `${seconds}秒挑战`;
    btn.addEventListener('click', () => {
      startTimedChallenge(seconds);
      if (hintEl) {
        hintEl.textContent = `${seconds}秒计时挑战 - 尽可能多打字！`;
      }
    });
    selector.appendChild(btn);
  });

  if (hintEl) {
    hintEl.textContent = '选择挑战时长开始计时';
  }
}

function startTimedChallenge(seconds: number): void {
  const randomIndex = Math.floor(Math.random() * TIMED_TEXTS.length);
  currentText = TIMED_TEXTS[randomIndex];

  // 清理旧的计时器
  if (timedInterval) {
    clearInterval(timedInterval);
    timedInterval = null;
  }

  if (typingArea) {
    typingArea.reset(currentText);
  } else {
    const display = document.getElementById('typing-display-timed')!;
    typingArea = new TypingArea({
      containerId: 'typing-display-timed',
      text: currentText,
      onResult: (state: TypingState) => handleTimedResult(state, seconds),
    });
  }

  if (keyboard) {
    keyboard.destroy();
  }
  keyboard = new VirtualKeyboard({
    containerId: 'keyboard-container-timed',
    soundEnabled: currentProgress.preferences.soundEnabled,
  });

  // 实时 WPM 显示
  let wpmSpan = document.getElementById('live-wpm');
  if (!wpmSpan) {
    wpmSpan = document.createElement('span');
    wpmSpan.id = 'live-wpm';
    wpmSpan.style.cssText = 'position: absolute; top: 10px; left: 20px; font-size: 18px; color: #48BB78; font-weight: 600;';
    const displayEl = document.getElementById('typing-display-timed');
    if (displayEl) displayEl.appendChild(wpmSpan);
  }
  timedWpmInterval = window.setInterval(() => {
    if (typingArea && !typingArea['isComplete']) {
      const stats = typingArea.getCurrentStats();
      if (wpmSpan) {
        wpmSpan.textContent = `实时: ${stats.wpm} WPM`;
      }
    }
  }, 1000);

  // 设置倒计时
  const displayEl = document.getElementById('typing-display-timed');
  if (displayEl) {
    let timerSpan = document.getElementById('timer-display');
    if (!timerSpan) {
      timerSpan = document.createElement('span');
      timerSpan.id = 'timer-display';
      timerSpan.style.cssText = 'position: absolute; top: 10px; right: 20px; font-size: 20px; font-weight: bold; color: #667EEA;';
      displayEl.appendChild(timerSpan);
    }
    timerSpan.textContent = `剩余: ${formatTime(seconds)}`;
  }

  // 倒计时逻辑
  let remaining = seconds;
  timedInterval = window.setInterval(() => {
    remaining--;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      timerEl.textContent = `剩余: ${formatTime(remaining)}`;
      if (remaining <= 5) {
        timerEl.style.color = '#FC8181'; // 红色警告
      }
    }
    if (remaining <= 0) {
      if (timedInterval) clearInterval(timedInterval);
      timedInterval = null;
    }
  }, 1000);
}

let timedInterval: number | null = null;
let timedWpmInterval: number | null = null;

function handleTimedResult(state: TypingState, limit: number): void {
  if (timedInterval) {
    clearInterval(timedInterval);
    timedInterval = null;
  }

  const duration = Math.min((state.endTime - state.startTime) / 1000, limit);
  const wpm = calculateWPM(state.correctCount, duration);
  const accuracy = calculateAccuracy(state.correctCount, state.wrongCount);
  const stars = calculateStars(wpm, accuracy);

  const result: PracticeResult = {
    mode: 'timed',
    wpm,
    accuracy,
    duration,
    stars,
    date: new Date().toISOString(),
  };

  if (timedWpmInterval) { clearInterval(timedWpmInterval); timedWpmInterval = null; }
  progressStore.saveResult(result).then(() => {
    showTimedResultModal(wpm, accuracy, stars, duration);
  });
}

function showTimedResultModal(wpm: number, accuracy: number, stars: number, duration: number): void {
  const display = document.getElementById('typing-display-timed');
  if (!display) return;

  const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  display.innerHTML = `
    <div class="result-modal">
      <h2>计时挑战完成！</h2>
      <div class="stars-display">${starsStr}</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value wpm-value">${wpm}</span>
          <span class="stat-label">WPM</span>
        </div>
        <div class="stat-item">
          <span class="stat-value accuracy-value">${accuracy}%</span>
          <span class="stat-label">准确率</span>
        </div>
        <div class="stat-item">
          <span class="stat-value time-value">${formatTime(duration)}</span>
          <span class="stat-label">用时</span>
        </div>
      </div>
      <button class="retry-btn" id="retry-btn">再来一次 🔄</button>
    </div>
  `;

  // 添加重试按钮事件
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      // 重新加载当前课程
      if (currentLesson) {
        startLesson(currentLesson);
      }
      // 刷新统计面板
      renderStats();
    });
  }
}

// ==================== 统计面板 ====================
function initStatsPanel(): void {
  const panel = document.getElementById('stats-panel');
  if (!panel) return;
  renderStats();
}

function renderStats(): void {
  const panel = document.getElementById('stats-panel');
  if (!panel) return;

  // 计算升级进度
  const currentLevelDef = LEVELS.find((l) => l.title === currentProgress.level) || LEVELS[0];
  const nextLevelDef = LEVELS[LEVELS.indexOf(currentLevelDef) + 1];
  const expInLevel = currentProgress.levelExp - currentLevelDef.minExp;
  const expNeeded = nextLevelDef ? nextLevelDef.minExp - currentLevelDef.minExp : 100;
  const progressPercent = Math.min(100, Math.round((expInLevel / expNeeded) * 100));

  panel.innerHTML = `
    <div class="stat-card">
      <h3>等级</h3>
      <div class="value">${currentProgress.level}</div>
      <div class="level-progress">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <div class="label">经验: ${currentProgress.levelExp}/${nextLevelDef?.minExp || 'MAX'}</div>
    </div>
    <div class="stat-card">
      <h3>最佳速度</h3>
      <div class="value">${currentProgress.stats.bestWPM}</div>
      <div class="label">WPM</div>
    </div>
    <div class="stat-card">
      <h3>最佳准确率</h3>
      <div class="value">${currentProgress.stats.bestAccuracy}</div>
      <div class="label">%</div>
    </div>
    <div class="stat-card">
      <h3>连续练习</h3>
      <div class="value">${currentProgress.stats.practiceStreak}</div>
      <div class="label">天</div>
    </div>
    <div class="stat-card">
      <h3>总星星</h3>
      <div class="value">${currentProgress.totalStars}</div>
      <div class="label">⭐</div>
    </div>
    <div class="stat-card">
      <h3>完成课程</h3>
      <div class="value">${currentProgress.lessonsCompleted.length}</div>
      <div class="label">个</div>
    </div>
    <div class="stat-card">
      <h3>成就</h3>
      <div class="value">${currentProgress.achievements.length}</div>
      <div class="label">已解锁 / ${ACHIEVEMENTS.length}</div>
    </div>
  `;
}

// ==================== 设置 ====================
function initSettings(): void {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="settings-group">
      <h3>字体大小</h3>
      <label>练习文字大小: ${currentProgress.preferences.fontSize}px</label>
      <input type="range" min="18" max="36" value="${currentProgress.preferences.fontSize}"
             id="font-size-slider">
    </div>
    <div class="settings-group">
      <h3>主题</h3>
      <button class="toggle-btn ${currentProgress.preferences.theme === 'dark' ? 'active' : ''}"
              id="theme-toggle">
        ${currentProgress.preferences.theme === 'dark' ? '暗色模式' : '明亮模式'}
      </button>
    </div>
    <div class="settings-group">
      <h3>音效</h3>
      <button class="toggle-btn ${currentProgress.preferences.soundEnabled ? 'active' : ''}"
              id="sound-toggle">
        ${currentProgress.preferences.soundEnabled ? '已开启' : '已关闭'}
      </button>
    </div>
  `;

  const fontSizeSlider = document.getElementById('font-size-slider') as HTMLInputElement;
  fontSizeSlider?.addEventListener('input', () => {
    currentProgress.preferences.fontSize = parseInt(fontSizeSlider.value);
    document.getElementById('typing-display')?.style.setProperty('font-size', `${fontSizeSlider.value}px`);
    document.getElementById('typing-display-free')?.style.setProperty('font-size', `${fontSizeSlider.value}px`);
    document.getElementById('typing-display-timed')?.style.setProperty('font-size', `${fontSizeSlider.value}px`);
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    currentProgress.preferences.theme = currentProgress.preferences.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentProgress.preferences.theme);
  });

  document.getElementById('sound-toggle')?.addEventListener('click', () => {
    currentProgress.preferences.soundEnabled = !currentProgress.preferences.soundEnabled;
  });
}

// ==================== 启动 ====================
init().catch(console.error);
