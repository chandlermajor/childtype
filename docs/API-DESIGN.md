# 内部模块接口设计 / Internal Module Interface Design

本文档定义 ChildType 所有核心模块的公共接口，包含方法签名、参数、返回值、事件和依赖关系。

---

## 1. StorageManager — 存储管理

**运行环境：** Service Worker
**依赖：** `chrome.storage.local` API
**存储后端：** `chrome.storage.local`（无每分钟写入配额限制）

### 构造与实例化

```javascript
// 单例模式
const store = new StorageManager();
// 或
const store = StorageManager.getInstance();
```

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `get(key)` | `string` 存储键路径 | `Promise<any>` | 读取指定 key 的数据，支持嵌套路径如 `progress.modeStats` |
| `set(key, value)` | `string`, `any` | `Promise<void>` | 写入指定 key 的数据 |
| `update(key, updaterFn)` | `string`, `Function` | `Promise<void>` | 读取 → 修改 → 写入，保证原子性（如递增经验值） |
| `remove(key)` | `string` | `Promise<void>` | 删除指定 key |
| `clear()` | — | `Promise<void>` | 清除所有存储数据 |
| `getDefaults()` | — | `Object` | 返回所有 storage key 的默认值 |

### Storage Key 定义

```javascript
// StorageManager.getDefaults() 返回
{
  settings: {
    keyboardLayout: 'QWERTY',
    fontSize: 16,
    theme: 'light',
    soundEnabled: true,
    defaultMode: 'letters'
  },
  progress: {
    currentLevel: 1,
    experience: 0,
    totalPracticeMinutes: 0,
    bestWPM: 0,
    totalKeystrokes: 0,
    modeStats: {
      letters: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      ordered: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      free: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 },
      finger: { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 }
    },
    modesPlayed: [],
    lastPracticeDate: null,
    consecutiveDays: 0,
    dailyHistory: [],  // [{ date: 'YYYY-MM-DD', minutes: 15, avgWPM: 35, accuracy: 92 }]
    fingerPhase: 0,
    liveStats: {},
    fingerStats: { ... },
    keyProficiency: { ... },
    letterPhase: 0,
    letterPhaseName: '基准键'
  },
  achievements: {
    unlocked: [],  // [{ id: 'streak_10', unlockedAt: '2026-09-01T14:20:00Z' }]
    locked: []     // ['streak_50', 'wpm_60', 'level_10', 'phase_4']
  }
}
```

### 事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `onSettingsChanged` | 设置被修改后 | `{ key, value }` |
| `onProgressUpdated` | 练习数据更新后 | `{ progress }` |
| `onAchievementUnlocked` | 成就解锁时 | `{ achievement }` |

---

## 2. SettingsManager — 设置管理

**运行环境：** Service Worker
**依赖：** `StorageManager`
**注意：** 已移除 difficulty 设置，难度由阶段系统内部自动管理

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `getSetting(key)` | `string` | `Promise<any>` | 获取单个设置项 |
| `getAllSettings()` | — | `Promise<Object>` | 获取所有设置 |
| `setSetting(key, value)` | `string`, `any` | `Promise<void>` | 设置单个值，触发 onSettingsChanged 事件 |
| `updateSettings(partial)` | `Partial<Object>` | `Promise<void>` | 批量更新多个设置 |
| `resetToDefaults()` | — | `Promise<void>` | 恢复所有设置为默认值 |
| `getValidLayouts()` | — | `Array<string>` | 获取支持的键盘布局列表 |
| `getThemeOptions()` | — | `Array<{value, label}>` | 获取主题选项（light/dark/eye） |
| `getFontSizes()` | — | `Array<number>` | 获取可用字体大小列表 |

### 设置项校验

```javascript
// 所有设置项在 setSetting 时进行校验
const validators = {
  keyboardLayout: v => ['QWERTY', 'AZERTY'].includes(v),
  fontSize: v => Number.isInteger(v) && v >= 12 && v <= 48,
  theme: v => ['light', 'dark', 'eye'].includes(v),
  soundEnabled: v => typeof v === 'boolean',
  defaultMode: v => ['letters', 'ordered', 'free', 'finger'].includes(v)
};
```

---

## 3. KeyboardView — 虚拟键盘渲染

**运行环境：** Content Script (Overlay)
**依赖：** DOM API, CSS

### 构造

```javascript
const keyboard = new KeyboardView(containerElement);
```

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `render(layout, fingerMap)` | `Object`, `Object` | `void` | 渲染键盘，layout 定义键位排列，fingerMap 定义手指分区 |
| `highlightKey(keyChar, state)` | `string`, `string` | `void` | 高亮指定键，state: 'target' \| 'active' \| 'correct' \| 'wrong' |
| `clearHighlight()` | — | `void` | 清除所有高亮 |
| `setFingerMode(fingerId)` | `string` | `void` | 设置指法专项模式，只显示该手指对应的键 |
| `setTheme(theme)` | `string` | `void` | 切换主题（light/dark/eye） |
| `setFontSize(size)` | `number` | `void` | 调整键盘字体大小 |
| `show()` | — | `void` | 显示键盘 |
| `hide()` | — | `void` | 隐藏键盘 |
| `destroy()` | — | `void` | 销毁所有 DOM 元素和事件监听 |

### 事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `onKeyPress` | 物理按键按下 | `{ key: string, code: string, timestamp: number }` |
| `onKeyRelease` | 物理按键释放 | `{ key: string, code: string }` |

### 键盘布局数据格式

```javascript
// data/keyboard-layouts.js
const layouts = {
  QWERTY: {
    rows: [
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Space']
    ],
    fingerMap: {
      // 左小指: ` 1 Q A Z
      // 左无名指: 2 W S X
      // 左中指: 3 E D C
      // 左食指: 4 5 R T F G
      // 右食指: 6 7 Y U H J
      // 右中指: 8 I K
      // 右无名指: 9 O L
      // 右小指: 0 P ; ' \ /
    }
  },
  AZERTY: { ... }
};
```

---

## 4. TypingEngine — 打字判定引擎（内联于 overlay/overlay.js）

**运行环境：** Content Script (Overlay)
**依赖：** `KeyboardView` (获取键位信息), `StatsTracker` (收集统计), `SoundManager` (播放音效)
**模式：** `letters` | `ordered` | `free` | `finger`

### 核心状态

```javascript
// 内部状态（overlay.js 中的 state 对象）
{
  active: false,
  mode: 'letters',        // 'letters' | 'ordered' | 'free' | 'finger'
  letterPhase: 0,         // 0-7，当前阶段
  letterPhaseName: '',    // 阶段名称
  letterBatchPassCount: 0,// 连续通过批次计数
  target: null,           // 当前目标字符/批次
  batchTarget: [],        // 当前批次字母数组
  batchIndex: 0,          // 批次内当前索引
  startTime: null,        // 会话开始时间
  paused: false,
  pauseTime: 0,
  lastKeyTime: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  batchTotalKeystrokes: 0,
  batchCorrectKeystrokes: 0,
  batchStartTime: null,
  streak: 0,
  maxStreak: 0,
  errors: 0,
  timerInterval: null,
  sessionStats: null
}
```

### 关键内部函数

| 函数 | 说明 |
|------|------|
| `startSession(mode)` | 开始练习会话，重置状态，生成首批次 |
| `stopOverlay()` | 停止 overlay，保存会话数据到 SW |
| `setNextTarget()` | 获取下一个目标（字母模式调用 getBatchLetters） |
| `getBatchLetters()` | **每批次必结算**：计算上批次准确率/WPM，调用 checkPhaseCompletion |
| `checkPhaseCompletion(accuracy, wpm)` | 判定达标：达标→升阶，不达标→回落基准键 |
| `advancePhase()` | 升入下一阶段（0-7），更新 phaseName，触发通知 |
| `refreshBatchForPhase()` | 为当前阶段生成新批次 |
| `processKey(pressedKey, code)` | 处理按键判定，更新统计，推进批次索引 |
| `updateTargetDisplay()` | 更新目标显示区域 |
| `highlightNextKey()` | 高亮虚拟键盘上下一个目标键 |

### 阶段进阶逻辑

```javascript
// checkPhaseCompletion 伪代码
async function checkPhaseCompletion(accuracy, wpm) {
  const phase = LETTER_PHASES[state.letterPhase];
  const passAccuracy = accuracy >= phase.require.accuracy * 100;
  const passWpm = wpm >= phase.require.wpm;

  if (passAccuracy && passWpm) {
    state.letterBatchPassCount++;
    if (state.letterBatchPassCount >= phase.require.minBatches) {
      await advancePhase(); // 升阶
    }
  } else {
    if (state.letterPhase > 0) {
      // 回落基准键
      state.letterPhase = 0;
      state.letterPhaseName = '基准键';
      state.letterBatchPassCount = 0;
      showNotification('⚠️', '未达标，回落到基准键阶段');
      await refreshBatchForPhase();
    }
    state.letterBatchPassCount = 0;
  }
}
```

---

## 5. StatsTracker — 统计追踪（内联于 overlay/overlay.js）

**运行环境：** Content Script (Overlay)
**依赖：** `StorageManager`（最终持久化）

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `update(stats)` | `Object` | `void` | 更新实时统计（来自 TypingEngine） |
| `getLiveStats()` | — | `Object` | 获取当前实时统计 |
| `endSession()` | — | `Object` | 结束会话，返回完整统计，触发持久化 |

### 统计数据结构

```javascript
// getLiveStats() 返回
{
  wpm: 35.2,
  accuracy: 94.5,
  streak: 12,
  maxStreak: 25,
  totalKeystrokes: 250,
  correctKeystrokes: 236,
  errors: 14,
  elapsedSeconds: 45,
  mode: 'letters'
}

// endSession() 返回
{
  ...liveStats,
  sessionDuration: 300,     // 秒
  avgWPM: 32.1,
  bestWPM: 48.5,
  mode: 'letters',
  date: '2026-09-11',
  dailyEntry: { ... }       // 可直接写入 dailyHistory 的条目
}
```

### 事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `onStatsUpdate` | 统计更新时 | `{ liveStats }` |
| `onSessionEnd` | 会话结束时 | `{ sessionStats }` |

---

## 6. AchievementSystem — 成就系统

**运行环境：** Service Worker
**依赖：** `StorageManager`

### 成就定义格式

```javascript
// data/achievements.js
const achievements = [
  {
    id: 'first_key',
    name: '第一步',
    nameEn: 'First Step',
    description: '按下第一个键',
    descriptionEn: 'Press your first key',
    icon: '🎯',
    condition: { type: 'totalKeystrokes', threshold: 1 },
    experienceReward: 10
  },
  {
    id: 'streak_10',
    name: '连击新手',
    nameEn: 'Streak Novice',
    description: '连续正确 10 个键',
    descriptionEn: '10 correct keys in a row',
    icon: '🔥',
    condition: { type: 'streak', threshold: 10 },
    experienceReward: 25
  },
  {
    id: 'phase_4',
    name: '入门数字',
    nameEn: 'Number Starter',
    description: '完成阶段 4：双指配对·入门数字',
    descriptionEn: 'Complete Phase 4: Two-Hand Pairs · Intro Numbers',
    icon: '🔢',
    condition: { type: 'letterPhase', threshold: 4 },
    experienceReward: 100
  },
  {
    id: 'wpm_30',
    name: '速度入门',
    nameEn: 'Speed Starter',
    description: 'WPM 达到 30',
    descriptionEn: 'Reach 30 WPM',
    icon: '⚡',
    condition: { type: 'bestWPM', threshold: 30 },
    experienceReward: 50
  }
  // ... 共 48 个成就
];
```

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `getAllAchievements()` | — | `Array` | 获取所有成就定义 |
| `getUnlocked()` | — | `Array` | 获取已解锁成就列表 |
| `checkCondition(achievementId, stats)` | `string`, `Object` | `boolean` | 检查成就条件是否满足 |
| `unlock(achievementId)` | `string` | `Object` | 解锁成就，返回成就对象 |
| `getUnlockableStats(stats)` | `Object` | `Array` | 根据当前统计，检查所有可解锁的成就 |
| `getProgressPercent()` | — | `number` | 计算成就解锁进度百分比 |

### 事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `onAchievementUnlocked` | 成就解锁时 | `{ achievement, experienceGained }` |

---

## 7. LevelSystem — 等级系统

**运行环境：** Service Worker
**依赖：** `StorageManager`, `AchievementSystem`
**注意：** `getDifficultyModifier()` 仍保留供经验计算，但难度由阶段自动映射

### 等级定义格式

```javascript
// data/levels.js
const levels = [
  { level: 1, name: '打字新手', nameEn: 'Typing Beginner', expRequired: 0, icon: '🌱' },
  { level: 2, name: '字母达人', nameEn: 'Letter Master', expRequired: 100, icon: '📝' },
  { level: 3, name: '打字学徒', nameEn: 'Typing Apprentice', expRequired: 250, icon: '✏️' },
  // ... 共 25 级
  { level: 25, name: '打字之神', nameEn: 'Typing God', expRequired: 50000, icon: '🏅' }
];
```

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `getCurrentLevel()` | — | `Object` | 获取当前等级信息 |
| `getLevelAtExp(exp)` | `number` | `Object` | 根据经验值计算等级 |
| `addExperience(exp)` | `number` | `Object` | 增加经验值，可能触发升级，返回升级信息 |
| `getLevelProgress()` | — | `Object` | 获取当前等级进度（当前经验/升级所需经验） |
| `getNextLevel()` | — | `Object` | 获取下一等级信息 |
| `getDifficultyModifier(difficulty)` | `string` | `number` | 获取难度系数（内部使用，由阶段映射） |
| `getLevelName(level)` | `number` | `string` | 获取等级名称 |

### 事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `onLevelUp` | 升级时 | `{ oldLevel, newLevel, totalExp }` |

---

## 8. SoundManager — 音效管理

**运行环境：** Content Script (Overlay)
**依赖：** `SettingsManager`（获取音效开关状态）

### 公共方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `playCorrect()` | — | `void` | 播放正确按键音效 |
| `playWrong()` | — | `void` | 播放错误按键音效 |
| `playLevelUp()` | — | `void` | 播放升级音效 |
| `playAchievementUnlocked()` | — | `void` | 播放成就解锁音效 |
| `setEnabled(enabled)` | `boolean` | `void` | 启用/禁用音效 |
| `isAvailable()` | — | `boolean` | 检查浏览器是否支持 Web Audio API |
| `init()` | — | `void` | 初始化音频上下文（需要用户交互触发） |
| `destroy()` | — | `void` | 释放音频资源 |

### 音效参数

```javascript
// 正确按键: 短促高频「嗒」声
const correctSound = {
  frequency: 800,
  duration: 0.05,       // 50ms
  type: 'sine',
  volume: 0.3
};

// 错误按键: 低沉「嗡」声
const wrongSound = {
  frequency: 200,
  duration: 0.15,       // 150ms
  type: 'sawtooth',
  volume: 0.2
};

// 升级音效: 上行琶音
const levelUpSound = {
  frequencies: [523, 659, 784, 1047],  // C5, E5, G5, C6
  duration: 0.1,
  type: 'sine',
  volume: 0.4
};
```

---

## 模块间通信总结

```mermaid
sequenceDiagram
    participant CS as Content Script
    participant TE as TypingEngine
    participant KV as KeyboardView
    participant ST as StatsTracker
    participant SO as SoundManager
    participant SW as Service Worker
    participant SM as StorageManager
    participant AS as AchievementSystem
    participant LM as LevelSystem

    CS->>TE: submitKey('a', 'KeyA')
    TE->>KV: highlightKey('a', 'correct')
    TE->>SO: playCorrect()
    TE->>ST: update({wpm, accuracy, streak})
    ST->>ST: 计算最新统计
    ST->>SM: save('progress', stats)
    SM-->>SW: onProgressUpdated
    SW->>AS: checkCondition(achievements, stats)
    AS->>SM: unlock(achievementId) if condition met
    SM-->>SW: onAchievementUnlocked
    SW->>LM: addExperience(expReward)
    LM-->>SW: onLevelUp
    SW-->>CS: 通知最新进度
    CS-->>KV: 更新 UI 显示
```

---

*文档版本: 2.0.0 | 最后更新: 2026-09-11*