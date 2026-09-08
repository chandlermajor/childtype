# 计划：ChildType 四项改进

## Context（背景）

用户反馈了 ChildType 儿童打字练习 Chrome 扩展的四个问题，需要进行功能修复与 UI 改进：

1. **字母练习模式交互逻辑错误**：当前字母模式是一个字母一个字母展示、等待用户按键后才显示下一个。需求改为一次性展示一组字母（批次），练习者对该组字母连续输入。
2. **点击图标后 popup 数据未更新**：extension action 图标点击后 popup 打开，但"快速统计"等数据未正确刷新（存在重复函数定义、`loadProgress` 覆盖 `loadLevel` 调用等问题）。
3. **隐私政策需中英双语且可切换**：当前 `privacy-policy.html` 只有英文，需增加中文版本并支持切换。
4. **护眼模式与 UI 配色调整**：界面采用护眼模式（绿色系，利于长时间打字），并据此重新调整 UI 配色。

## 问题分析

### 问题 1：字母练习应分组展示

当前 `overlay.js` 的字母模式逻辑：
- `getBatchLetter()`（overlay.js:742）每调用一次返回一个字母并在用户按键后通过 `setNextTarget()` 推进 `lettersBatchIndex`。
- `updateTargetDisplay()`（overlay.js:492）在 letters 模式下只显示单个字母 `state.target.toUpperCase()`。
- `processKey()`（overlay.js:605）在 letters 模式下每输入正确一个字母就 `setNextTarget()` 切换到下一个。

即：一次只显示一个待输入字母，按一个换一个。需求要求一次展示一整批（16 个字母），用户连续输入该批。

### 问题 2：popup 数据未更新

`popup.js` 中：
- `init()`（popup.js:39-57）依次调用 `loadSettings()`、`loadProgress()`、`loadLevel()`。
- **`loadProgress()` 被定义了两次**（popup.js:81 和 popup.js:105），后者覆盖前者。两个版本逻辑相同，导致 `init()` 中 `loadLevel()` 实际未执行（被第二个 `loadProgress` 占位，`loadLevel` 调用被吞掉——实为 `init` 里调用的是 `loadLevel()` 但函数名冲突需注意）。
- 关键：`loadLevel()` 负责填充"进度"面板（等级、EXP、进度条），而 `init()` 末尾调用的是 `loadLevel()`，但由于 `loadProgress` 重复定义，JS 中后者覆盖前者，`loadLevel` 仍存在。真正的问题是 `init()` 没有按模式刷新统计，且 `refreshModeStats` 未被调用初始化。
- 模式按钮点击时 `refreshModeStats()` 会被调用，但初始加载（popup 打开时）不刷新任何模式统计，导致点击图标打开时"快速统计"恒为默认值 `--`。

### 问题 3：隐私政策无中文版本

`privacy-policy.html`（仅 107 行英文）由 service-worker.js:250 通过 `chrome.tabs.create` 打开，无语言切换机制。

### 问题 4：护眼模式与配色

当前仅 `light`/`dark` 两种主题（popup.css:7-57、overlay.css:15-62），颜色偏白/偏紫。需新增"护眼"主题（暖绿/米色调，低蓝光），并据此调整配色。

---

## 方案

### 改动 1：字母练习分组展示（overlay.js）

核心思路：letters 模式下，整批字母一次性在目标区展示，用户连续输入该批 16 个字母。

**1.1 新增批次目标状态**

在 `overlay.js` 的 state 附近新增：
- `state.batchTarget = []`：当前整批字母数组。
- `state.batchIndex = 0`：当前输入到第几个。

**1.2 修改 `setNextTarget()`**（overlay.js:442）

letters 模式分支改为：
```js
case 'letters':
  state.batchTarget = getBatchLetters(); // 生成整批（16 个）
  state.batchIndex = 0;
  break;
```

**1.3 新增 `getBatchLetters()`**

复用现有 `LETTERS_PER_BATCH`（16）逻辑，洗牌后取 16 个字母返回数组（避免逐次调用 `getBatchLetter` 触发的批量结算时机错乱）。

**1.4 修改 `updateTargetDisplay()`**（overlay.js:492）

letters 模式改为展示整批，已输入部分用真实字母、未显示高亮当前位：
```js
if (state.mode === 'letters') {
  const shown = state.batchTarget.map((ch, i) => {
    if (i < state.batchIndex) return ch;
    if (i === state.batchIndex) return `_${ch.toUpperCase()}_`; // 标记当前位置
    return '·';
  }).join(' ');
  targetLetter.textContent = shown;
}
```
目标区字体需增大并支持多字符（见 4.1 样式调整）。

**1.5 修改 `processKey()`**（overlay.js:565）

letters 模式判定改为基于 `state.batchTarget[state.batchIndex]`，正确时 `state.batchIndex++`，不再调用 `setNextTarget()`。当 `state.batchIndex >= state.batchTarget.length` 时本批结束，调用 `setNextTarget()` 生成新批。

**1.6 修改 `getBatchLetter()` 结算时机**（overlay.js:742）

将批次完成结算（`lettersBatchStarted` 消息）移到整批结束时触发一次（在 `setNextTarget()` 的 letters 分支或 `processKey` 批结束时），而非每次按键。保留 `generateBatch()` 用于生成新批。

> 注意：`getBatchLetter()` 逐次返回逻辑与"分组一次性展示"冲突，改为整批生成 + 批结束结算。

**1.7 高亮虚拟键盘**

`highlightNextKey()`（overlay.js:800）在 letters 模式下高亮 `state.batchTarget[state.batchIndex]` 对应键（逻辑已支持单字符，无需大改，确认 keyChar 取 `state.batchTarget[batchIndex]` 即可）。

---

### 改动 2：修复 popup 数据刷新（popup.js）

**2.1 删除重复的 `loadProgress()`**

删除 popup.js:105-124 的第二个 `loadProgress()` 定义（与 81-100 完全重复）。

**2.2 修复 `init()` 调用顺序**

确保 `init()` 依次调用 `loadSettings()` → `loadLevel()` → `loadProgress()` → `refreshModeStats(选中模式)`。当前 `init()` 调用顺序正确（loadSettings/loadProgress/loadLevel），但重复函数定义使语义混乱，删除重复后 `loadLevel` 正常执行。

**2.3 初始化时按当前选中模式刷新统计**

在模式按钮 `click` 处理器中，`refreshModeStats(btn.dataset.mode)` 已被调用（popup.js:210），正确。新增：`init()` 结尾调用一次当前选中模式的 `refreshModeStats`（默认 `letters`），使 popup 打开即显示该模式数据。

**2.4 完善 `loadProgress()`**

保留 `loadProgress()` 填充全局统计（总 WPM/时长），`refreshModeStats()` 填充当前模式统计。两者各司其职，互不覆盖。

---

### 改动 3：隐私政策中英双语切换（privacy-policy.html + service-worker.js）

**3.1 重写 `privacy-policy.html`**

- 新增语言切换按钮（中/EN），置于页面顶部。
- 中文内容与英文内容分别用 `lang-zh` / `lang-en` 容器包裹，通过 `display` 切换。
- 默认语言：读取 `chrome.storage.local` 中的 `settings.language`（新增设置项），无则按浏览器 `navigator.language` 或默认中文。
- 切换逻辑：点击按钮写入 `settings.language` 并切换显示，使用 localStorage 本地记忆（隐私页面无需同步）。

**3.2 新增语言设置项**

- `SettingsManager.js`：`VALID_LANGUAGES = ['zh', 'en']`，新增 `language` validator 与 `getLanguageOptions()`。
- `StorageManager.js`：检查默认 settings 是否含 `language`（查看 `_ensureDefaults`/`getDefaults`）。
- popup 设置面板增加"语言"选项（可选，作为入口；隐私页自带切换）。

**3.3 隐私页为独立扩展页**

保持 service-worker.js:250 的 `chrome.tabs.create({ url: privacy-policy.html })` 打开方式不变，仅改进页面内部双语切换。

---

### 改动 4：护眼模式主题 + UI 配色调整

**4.1 新增"护眼"主题变量**

- `popup.css`：新增 `:root[data-theme="eye"]` 主题。配色以暖绿/米黄为主，降低白底对比与蓝光：
  - `--bg-primary: #E8F0E0`（米绿）、`--bg-secondary: #DCE8D2`、`--text-primary: #2F3A2A`、`--accent: #4E944A`（护眼绿）、`--accent-light: #7FB97B` 等。
- `overlay.css`：新增 `:root[data-theme="eye"]` 主题。背景改用低饱和暖绿半透明，键位背景米色，目标高亮绿，降低整体亮度与蓝光。

**4.2 注册护眼主题**

- `SettingsManager.js`：`VALID_THEMES = ['light', 'dark', 'eye']`，`getThemeOptions()` 增加 `{ value: 'eye', label: '护眼' }`。

**4.3 popup 设置面板新增护眼选项**

- `popup.html`：`#setting-theme` 增加 `<option value="eye">护眼</option>`。

**4.4 目标区样式适配多字符展示**

- `overlay.css` `.overlay__target-letter`：改为支持多字符、增大行距与字宽（`word-spacing`、`white-space: normal`、`font-size` 适配），并适配护眼/暗色背景对比度。

**4.5 隐私页配色统一（可选）**

隐私页 `.updated`、表头等可呼应护眼绿（`#4E944A`）作为强调色，保持整体一致。

---

## 验证方式

本项目为 Chrome 扩展，无自动化测试框架。验证步骤：

1. **字母分组展示**：加载扩展（`chrome://extensions` → 开发者模式 → 加载已解压）→ 点击图标选"字母" → 确认目标区一次展示 16 个字母、用户连续输入、批结束后自动刷新新一批。
2. **popup 数据刷新**：完成一次字母练习后重新打开 popup，确认"快速统计"与"进度"面板数据更新。
3. **隐私政策双语**：点击"隐私政策"按钮，确认默认显示中文、可切换英文，内容完整。
4. **护眼模式**：设置中选择"护眼"，确认 popup 与打字 overlay 均变为暖绿配色；正常打字无视觉异常。

手动验证为主。建议 Chrome 重新加载扩展后逐个功能点验证。
