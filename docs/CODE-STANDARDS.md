# 编码规范 / Code Standards

本文档定义 ChildType 项目的编码规范，确保代码一致性、可维护性和团队协作效率。

---

## 1. 命名约定

### 1.1 文件命名

| 类型 | 格式 | 示例 |
|------|------|------|
| JS 模块文件 | `PascalCase.js` | `StorageManager.js`, `TypingEngine.js` |
| HTML 文件 | `kebab-case.html` | `popup.html`, `overlay.html` |
| CSS 文件 | `kebab-case.css` | `popup.css`, `overlay.css` |
| 数据文件 | `kebab-case.js` | `words.js`, `levels.js` |
| 文档文件 | `UPPERCASE.md` | `README.md`, `ARCHITECTURE.md` |

### 1.2 JavaScript 命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 类名 | `PascalCase` | `class StorageManager {}` |
| 实例变量 | `camelCase` | `this.currentLevel` |
| 常量 | `UPPER_SNAKE_CASE` | `const MAX_LEVEL = 10` |
| 函数名 | `camelCase` | `function calculateWPM() {}` |
| 私有方法/属性 | `_camelCase` | `this._startTime` |
| 事件名 | `on + PascalCase` | `onSettingsChanged`, `onLevelUp` |
| 模块导出 | `camelCase` | `export function saveSettings() {}` |

### 1.3 CSS 命名

使用 BEM (Block-Element-Modifier) 命名规范：

```css
/* Block: 独立组件 */
.popup {}
.overlay {}
.keyboard {}

/* Element: 组件内的部分 */
.keyboard__row {}
.keyboard__key {}
.keyboard__key--target {}

/* Modifier: 状态变体 */
.keyboard__key--correct {}
.keyboard__key--wrong {}
.keyboard__key--active {}
.overlay--dark {}
.popup__stat--highlight {}
```

### 1.4 CSS 变量命名

```css
:root {
  /* 语义化命名，描述用途而非外观 */
  --bg-primary: #FFFFFF;      /* 主背景色 */
  --bg-secondary: #F5F5F5;    /* 次背景色 */
  --text-primary: #333333;    /* 主文本色 */
  --text-secondary: #666666;  /* 次文本色 */
  --accent: #6C5CE7;          /* 强调色 */
  --success: #00B894;         /* 正确/成功 */
  --error: #D63031;           /* 错误 */
  --warning: #FDCB6E;         /* 警告/提示 */
}
```

---

## 2. 文件组织

### 2.1 目录结构

```
childtype/
├── manifest.json                 # 项目入口
├── popup/                        # 弹出窗口（UI 层）
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── overlay/                      # 打字覆盖层（UI 层）
│   ├── overlay.html
│   ├── overlay.css
│   └── overlay.js
├── background/                   # 后台逻辑
│   └── service-worker.js
├── modules/                      # 核心业务模块
│   ├── KeyboardView.js
│   ├── TypingEngine.js
│   ├── StatsTracker.js
│   ├── StorageManager.js
│   ├── SettingsManager.js
│   ├── AchievementSystem.js
│   ├── LevelSystem.js
│   └── SoundManager.js
├── data/                         # 静态数据
│   ├── words.js
│   ├── sentences.js
│   ├── levels.js
│   ├── achievements.js
│   └── keyboard-layouts.js
├── icons/                        # 图标资源
├── assets/                       # 其他静态资源
├── docs/                         # 项目文档
├── privacy-policy.html           # 隐私政策页面
└── .gitignore
```

### 2.2 模块文件结构

每个模块文件遵循统一结构：

```javascript
/**
 * [模块名称]
 * [简短描述]
 * @module modules/[模块名]
 */

// 1. 常量定义
const CONSTANT_A = 'value';
const MAX_VALUE = 100;

// 2. 私有状态
class SomeModule {
  constructor() {
    this._state = {};
    this._listeners = {};
  }

  // 3. 公共方法（API）
  /**
   * [方法描述]
   * @param {type} param - 参数描述
   * @returns {type} 返回值描述
   */
  publicMethod(param) {
    // 实现
  }

  // 4. 私有方法
  _privateHelper() {
    // 实现
  }

  // 5. 事件触发
  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(fn => fn(data));
  }

  // 6. 事件监听
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }
}

// 7. 导出
export default SomeModule;
```

---

## 3. JavaScript 编码规范

### 3.1 代码风格

- **缩进：** 2 个空格（不使用 Tab）
- **分号：** 必须使用（防止 ASI 陷阱）
- **引号：** 字符串使用单引号 `'`，模板字符串使用反引号 `` ` ``
- **逗号：** 末尾不加逗号（Trailing commas 在对象/数组中允许）
- **空格：** 运算符两侧加空格，函数名和括号之间不加空格
- **空行：** 逻辑块之间加空行，方法之间加空行

```javascript
// ✅ 正确
const name = 'ChildType';
const wpm = calculateWPM(totalKeystrokes, elapsedSeconds);
const items = [1, 2, 3];
const obj = { key: 'value' };

// ❌ 错误
const name = "ChildType";
const wpm=calculateWPM(totalKeystrokes, elapsedSeconds);
const items = [1, 2, 3,];
```

### 3.2 变量声明

```javascript
// 使用 const 优先，let 仅在需要重新赋值时使用
const MAX_LEVEL = 10;      // 常量
const settings = getSettings(); // 不修改的引用
let streak = 0;             // 需要修改的值
let currentTarget = null;   // 状态变量

// 禁止 var
var oldStyle = 'bad'; // ❌
```

### 3.3 异步处理

```javascript
// 使用 async/await，避免回调地狱
async function saveProgress(data) {
  try {
    await store.set('progress', data);
    console.log('Progress saved');
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

// 避免嵌套回调
// ❌
chrome.storage.sync.get('settings', (result) => {
  chrome.storage.sync.set({ progress: data }, () => {
    // ...
  });
});

// ✅
const settings = await store.get('settings');
await store.set('progress', data);
```

### 3.4 错误处理

```javascript
// 所有异步操作必须包裹在 try/catch 中
try {
  await store.set('settings', newSettings);
} catch (error) {
  console.error('[StorageManager] Failed to save settings:', error);
  // 不中断用户操作，仅记录错误
}

// 不要静默吞掉错误
// ❌
try {
  await store.get('settings');
} catch (e) { /* ignore */ }

// ❌
store.get('settings').catch(() => {});
```

### 3.5 注释规范

```javascript
/**
 * 计算 WPM（Words Per Minute）
 * 标准：5 个字符 = 1 个单词
 * 从第 5 个有效按键开始计算
 *
 * @param {number} totalKeystrokes - 总按键数
 * @param {number} elapsedSeconds - 已用秒数
 * @returns {number} WPM 值（保留 1 位小数）
 */
function calculateWPM(totalKeystrokes, elapsedSeconds) {
  if (totalKeystrokes < 5 || elapsedSeconds <= 0) return 0;
  const words = totalKeystrokes / 5;
  const minutes = elapsedSeconds / 60;
  return Math.round((words / minutes) * 10) / 10;
}
```

**注释规则：**
- 所有公开方法必须有 JSDoc 注释
- 复杂逻辑必须有行内注释解释「为什么」而非「做什么」
- 不注释显而易见的代码
- 使用中文注释（目标用户为中文儿童，代码注释也应中文）

---

## 4. HTML 规范

### 4.1 基本结构

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChildType</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <!-- 内容 -->
  <script src="popup.js" defer></script>
</body>
</html>
```

### 4.2 规则

- 使用语义化标签（`<header>`, `<main>`, `<footer>`, `<section>`）
- `lang` 属性设为 `en`
- 脚本标签使用 `defer` 属性
- 不使用内联样式（`style=""`）
- 不使用内联脚本（`onclick=""`）
- 所有图片必须有 `alt` 属性

---

## 5. CSS 规范

### 5.1 选择器

```css
/* 使用类选择器，避免 ID 选择器 */
.keyboard__key { }       /* ✅ */
#keyboard-key { }        /* ❌ */

/* 避免深层嵌套 */
.popup .content .stats .item { }  /* ❌ 最多 2 层 */
.popup__stats__item { }           /* ✅ BEM */

/* 使用 ::before / ::after 而非多余 DOM 元素 */
```

### 5.2 动画

```css
/* 使用 transform 和 opacity（GPU 加速） */
.keyboard__key {
  transition: transform 0.1s ease, background-color 0.2s ease;
}

.keyboard__key--active {
  transform: scale(0.95);
}

/* 避免使用 left/top 动画 */
```

---

## 6. Git 工作流

### 6.1 分支策略

```
main (稳定分支，仅用于发布)
├── feature/typing-engine (新功能)
├── fix/popup-layout (Bug 修复)
└── refactor/storage (重构)
```

### 6.2 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型（type）：**

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(overlay): add word typing mode` |
| `fix` | Bug 修复 | `fix(engine): fix WPM calculation on first keystroke` |
| `docs` | 文档更新 | `docs(README): add quick start guide` |
| `style` | 代码格式（不影响功能） | `style(popup): fix indentation` |
| `refactor` | 重构 | `refactor(storage): simplify get/set methods` |
| `perf` | 性能优化 | `perf(keyboard): use CSS transform for animations` |
| `test` | 测试相关 | `test(engine): add unit tests for WPM calc` |
| `chore` | 构建/工具/杂项 | `chore(icon): update icon sizes` |

**示例：**
```
feat(engine): add sentence typing mode

- Support multi-word sentence input
- Track cursor position per character
- Show correct/wrong character highlighting

Closes #12
```

### 6.3 禁止的行为

- ❌ 不在 `main` 分支直接提交
- ❌ 不提交包含 `console.log` 调试代码
- ❌ 不提交未测试的代码
- ❌ 不提交包含敏感信息（API keys、密码）
- ❌ 不在提交信息中使用模糊描述（如 "fix", "update", "wip"）

---

## 7. 代码审查检查清单

在提交 PR 前，逐项确认：

```
□ 代码符合命名规范（文件、变量、函数、CSS）
□ 所有公开方法有 JSDoc 注释
□ 异步操作有 try/catch 错误处理
□ 无 console.log 调试代码（除非标记 TODO）
□ 无 var 声明（使用 const/let）
□ 无硬编码的魔法数字（提取为常量）
□ CSS 使用 BEM 命名
□ 无深层 CSS 嵌套（最多 2 层）
□ HTML 使用语义化标签
□ 所有功能已本地测试通过
□ 无浏览器控制台错误
□ 图标文件在 icons/ 目录
□ 数据文件在 data/ 目录
□ 文档已更新（如有 API 变更）
□ 提交信息符合 Conventional Commits 格式
□ 分支已同步 main
```

---

## 8. 工具配置

### 8.1 ESLint 配置（推荐）

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "no-console": "warn",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "no-trailing-spaces": "error",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

### 8.2 Prettier 配置（推荐）

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

*文档版本: 1.0.0 | 最后更新: 2026-08-19*
