# ChildType — 指法熟练度与分阶段训练体系

## Context

当前 ChildType 的字母练习、成就、等级、进度四大系统彼此割裂：

1. **指法训练是空壳**：`overlay.js:373-374` 的 `finger` 模式与 `letters` 模式逻辑完全相同（`getRandomLetter()`），代码自带 `TODO: finger-specific filtering`。指法数据（`keyboard-layouts.js` 的 `fingerMap`）和高亮能力（`KeyboardView.setFingerMode`）都已存在但未被利用。
2. **成就与进度无联动**：`updateStats`（service-worker:181）只构造 3 个字段，导致 `totalMinutes`/`consecutiveDays`/`level` 等 5 种成就条件永远无法判定；经验入口割裂，`sessionEnd` 和 `unlock` 各加一次经验；升级到 Lv.5/Lv.10 不会自动解锁对应成就。
3. **没有"熟悉程度"量化**：任何机制都不记录用户对单键/手指的掌握度，无法做到"迭代"训练。

目标：建立一个以**统计为唯一数据源**的体系——键位熟练度驱动分阶段指法训练，阶段完成自动解锁成就、累积经验、推进等级，四者通过统一事件流联动。

## 关键设计决策

- **单一打字逻辑源**：丢弃 `TypingEngine.js`（overlay 实际未 import，words/sentences 逻辑在 overlay.js 重写）。`overlay.js` 为唯一打字逻辑，`service-worker.js` 为唯一持久化逻辑。
- **采集在 content script，聚合在 SW**：`overlay.js` 只发 `recordKey` 原始事件，SW 负责聚合到 `progress.keyProficiency` 和 `progress.fingerStats`。
- **阶段推进按熟练度非按次数**：`proficiencyScore(key) >= minScore && attempts >= minSamples` 才判定该键习得，满足比例后进入下一阶段。
- **localStorage 与 chrome.storage.sync 不同步**：SW 写主数据，overlay 通过 `PHASE_ADVANCE` 消息接收后写 localStorage 刷新 UI，禁止 content script 直接读写 progress 主数据。
- **布局无关**：阶段键位不硬编码，按 `keyboard-layouts.js` 的 `fingerMap` / `rows` 动态生成，QWERTY 与 AZERTY 共用一套逻辑。

## 数据结构（StorageManager.js）

在 `progress` 默认值（约 31-34 行 `modesPlayed` 之后）新增：

```js
fingerPhase: 0,
fingerStats: {
  'left-pinky': { sessions: 0, attempts: 0, correct: 0, errors: 0, msSamples: [] },
  // …… 共 9 个：8 指 + 'thumb'
},
keyProficiency: { /* 动态扩展：a: { attempts, correct, msSamples } */ }
```

`msSamples` 保留最近 50 条，超出丢弃（滑动窗口）。`keyProficiency` 在 `sessionEnd` 时调用 `pruneKeyProficiency` 只保留近 30 天有活动的键。

## 实施任务

### Task 1 — 熟练度工具 + 数据采集（P0）

**1.1** 新建 `modules/FingerProficiency.js`，导出纯函数：

- `proficiencyScore(keyData)`：`accuracy*0.7 + speedScore*0.3`，`speedScore = clamp(1 - (avgMs-300)/1700, 0, 1)`，样本不足返回 0。参数 `MIN_SAMPLES`（建议 15）可调。
- `aggregateFingerStats(keyProficiency, fingerMap)`：按 `fingerMap` 把单键聚合为 9 手指统计。
- `pruneKeyProficiency(keyProficiency, daysAgo=30)`：修剪过期键。

**1.2** `service-worker.js` `handleMessage` 新增 `recordKey`：

```js
case 'recordKey': {
  const { key, finger, correct, responseMs } = message;
  await store.update('progress.keyProficiency', kp => {
    const cur = kp[key] || { attempts: 0, correct: 0, msSamples: [] };
    cur.attempts++; cur.correct += correct ? 1 : 0;
    if (responseMs != null) { cur.msSamples.push(responseMs); if (cur.msSamples.length > 50) cur.msSamples.shift(); }
    kp[key] = cur; return kp;
  });
  await store.update('progress.fingerStats', fs => { /* 同类聚合 */ });
  return { success: true };
}
```

**1.3** `overlay.js` `processKey()`（465 行）`isCorrect` 判定后采集。需先获取当前布局的 fingerMap：

```js
const expectedChar = expected.toLowerCase();
const finger = getFingerForKey(expectedChar);   // 查 fingerMap，默认 'thumb'
chrome.runtime.sendMessage({ action: 'recordKey', key: expectedChar, finger, correct: isCorrect, responseMs: state.lastKeyTime ? Date.now() - state.lastKeyTime : null });
```

`getFingerForKey`：优先读 localStorage 的 layout setting（默认 QWERTY），查 `layouts[layout].fingerMap`。

### Task 2 — 分阶段指法数据 + 推进系统（P1）

**2.1** 新建 `data/finger-phases.js`。6 阶段：home(基准键 ASDFJKL;), single(单指列 groups), onehand(单手往返 sequences), both(双手混合 pairs), top(上排 q-p), bottom(下排+符号)。每阶段带 `require: { minKeys, minSamples, minScore, coverageRatio }`。导出 `keysForPhase(phase, layout)`（按 `fingerMap`/`rows` 动态生成）和 `DEFAULT_FINGER_PHASES`。

**2.2** 新建 `modules/FingerPhaseSystem.js`：

- `getCurrentPhase()`：从 `progress.fingerPhase` 起遍历，返回第一个未满足的阶段 ID。
- `phaseSatisfied(phase, keyProficiency)`：逐键 `proficiencyScore >= minScore && attempts >= minSamples`，满足数 >= `ceil(键数 * coverageRatio)`。
- `advanceIfReady()`：读当前阶段，若满足则 `store.update('progress.fingerPhase', id+1)`，`_emit('onPhaseAdvance', newPhase)`。单例 + event emitter（复用现有 `on/_emit` 模式）。

**2.3** `service-worker.js` `sessionEnd`（130 行 store.update 之后）调用 `await fingerPhaseSystem.advanceIfReady()`，并注册 `onPhaseAdvance` → `broadcastToOverlay({ type: 'PHASE_ADVANCE', data: { phase } })`。

### Task 3 — finger 模式做实（P1）

**3.1** `overlay.js` `setNextTarget()` 的 `finger` 分支（373 行）改为按阶段选键：

```js
case 'finger':
  state.target = getLetterForPhase(readCurrentFingerPhase());
  applyFingerPhaseHighlight(readCurrentFingerPhase());
  break;
```

**3.2** 新增辅助函数：

- `readCurrentFingerPhase()`：读 localStorage `childtype-progress.fingerPhase`，默认 0。
- `getLetterForPhase(phaseId)`：取 `keysForPhase(FINGER_PHASES[phaseId], layout).keys` 随机一个。
- `applyFingerPhaseHighlight(phaseId)`：遍历 `.overlay__key`，阶段内的键 `opacity:1`，其余 `0.15`；收到 `PHASE_ADVANCE` 消息时刷新。

**3.3** `overlay.js` `handleMessage` 新增 `case 'PHASE_ADVANCE'`：写 localStorage 并 `applyFingerPhaseHighlight`。

### Task 4 — 统一经验入口 + 成就完整 stats（P0）

**4.1** `LevelSystem.addExperience` 增加 `source='session'` 参数，emit 时带上；`unlock` 内调用改为 `addReward`（见 4.4）。

**4.2** `service-worker.js` `sessionEnd`：保留 `addExperience(baseExp, 'normal', 'session')`，移除成就实时触发逻辑（见 4.3）。

**4.3** 删除 `updateStats` 分支（service-worker:178-191）里的成就触发。成就改在 `sessionEnd` 落库后统一检查：

```js
await achievementSystem.checkAllUnlocks(); // 读取完整 progress
```

**4.4** `AchievementSystem` 新增 `checkAllUnlocks()`：读完整 `progress`（含 `fingerStats`/`fingerPhase`/`totalMinutes`/`consecutiveDays`/`currentLevel`/`modesPlayed`/`bestWPM`/`totalKeystrokes`/`perfectStreak`），用 `checkCondition` 判定，对可解锁成就调用 `unlock()`。`unlock()` 加经验改用 `addReward()` 包装 `addExperience(reward, 'normal', 'achievement')`（避免与 `addExperience` 签名混乱）。

### Task 5 — 等级↔成就双向联动（P2）

**5.1** `LevelSystem.addExperience` 的 `leveledUp` 分支内，`store.set('progress.currentLevel')` 后：

```js
const ach = (await import('./AchievementSystem.js')).default;
await ach.checkLevelAchievements(progress.currentLevel);
```

**5.2** `AchievementSystem` 新增 `checkLevelAchievements(level)`：遍历成就中 `type==='level'` 且 `threshold <= level`、未解锁者调用 `unlock()`。因 `unlock` 内部 `addExperience` 可能再次触发 `onLevelUp`，在 `addExperience` 顶部加 `if (this._addingExp) return ...` 守卫避免重入，释放前重置。

**5.3** `AchievementSystem` 新增 `checkPhaseAchievements(phase)`：遍历 `type==='fingerPhase'` 成就，逻辑同 5.2。`FingerPhaseSystem.onPhaseAdvance` 回调中调用。

### Task 6 — 阶段成就 + 统一事件（P2）

**6.1** `data/achievements.js` 新增 6 个阶段成就（`phase_home`…`phase_bottom`），条件 `type:'fingerPhase'`，阈值对应阶段 ID+1，经验 40/60/80/100/80/80。`AchievementSystem` `checkCondition` 的 switch 增加 `case 'fingerPhase': return (stats.fingerPhase||0) >= threshold;`。

**6.2** `service-worker.js` 合并事件广播：`onLevelUp` 与 `onAchievementUnlocked` 都发 `REWARD_UNLOCKED`，overlay 用单一路由展示通知（可合并"升级+解锁"文案），替换现有的 `LEVEL_UP`/`ACHIEVEMENT_UNLOCKED` 两分支。

### Task 7 — 清理与配置（P3）

**7.1** 确认 `TypingEngine.js` 无引用（grep 全项目）后删除，或保留但标注废弃。更新 `README.md` 结构说明。

**7.2** 无 manifest 变更（均用已有 `storage`/`scripting` 权限）。

## 风险与失败模式

- **content script 随时销毁**：所有聚合必须在 SW 侧，避免在 overlay 维持状态。
- **`keyProficiency` 膨胀**：`pruneKeyProficiency` 必须在 `sessionEnd` 触发，否则长期运行内存增长。
- **localStorage 时序**：overlay 在 SW 推进阶段后才写 localStorage，首次加载若 localStorage 为空，finger 模式回退到阶段 0，下一 session 自动同步。
- **重入循环**：5.2 的 `_addingExp` 守卫必须加，否则"升级→解锁成就→加经验→再升级"会无限递归。
- **AZERTY 键位**：`keysForPhase` 必须动态生成，硬编码会破坏 AZERTY。

## 验证

- **功能**：加载扩展后 finger 模式应只显示当前阶段键位、其余灰度；连续练习后 fingerPhase 在熟练度达标后自动推进。
- **成就**：累计练习满 1/10/60 分钟、连续 7 天、达到 Lv.5/Lv.10 后对应成就应被解锁（此前永远无法触发）。
- **经验**：单次 session 经验不重复叠加；解锁成就后经验正确累加且不重复升级。
- **回归**：字母/单词/句子/自由模式、暂停/恢复、每日/每周统计、主题切换均不受影响。
- **边界**：清空 storage 后首次运行不报错（`_ensureDefaults` 兜底）；`msSamples` 超过 50 不溢出。

## 开放问题

1. `proficiencyScore` 的 0.7/0.3 准确率/速度权重、`MIN_SAMPLES=15`、`minScore` 各阶段阈值均为默认值，需真实数据后微调 —— 是否先按默认上线、用数据校准？
2. `fingerPhase` 与 `LevelSystem` 的等级是否要共享经验池（当前设计是共享 `progress.experience`）？还是阶段成就作为独立的额外经验来源？（本计划采用共享，即成就经验也计入总经验驱动等级。）
