# 技术决策记录 / Architecture Decision Records (ADR)

本文档记录 ChildType 项目中的关键技术决策，采用 ADR（Architecture Decision Record）格式。

---

## ADR-001: 使用 Manifest V3

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** Chrome 已完全淘汰 Manifest V2，V3 是唯一支持的扩展格式。

**决策：** 使用 Chrome Extension Manifest V3。

**理由：**
1. V2 已于 2023 年被 Chrome 官方废弃，V3 是唯一合规格式
2. V3 使用 Service Worker 替代 Background Page，内存占用更小
3. V3 的 Content Security Policy 更严格，安全性更好
4. V3 的 `declarativeNetRequest` API 替代了已废弃的 `webRequest` API

**替代方案：** Manifest V2（已不可用）

**风险：** V3 的 Service Worker 可能被 Chrome 休眠，需要通过消息机制确保状态持久化。已在架构中通过 `StorageManager` 解决。

---

## ADR-002: 使用原生 JavaScript（无框架）

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** Chrome 扩展对打包体积敏感，且用户群体为儿童，需要快速加载。

**决策：** 使用原生 JavaScript (ES6+)，不引入 React、Vue、Angular 等框架。

**理由：**
1. 零依赖，打包体积小（目标 < 200KB）
2. 加载速度快，无框架启动开销
3. Chrome 扩展的 Service Worker 和 Content Script 有特殊的执行环境限制
4. 项目复杂度适中（8 个核心模块），原生 JS 可维护性足够
5. 便于理解和调试，降低维护成本

**替代方案：** React/Vue + Webpack 打包

**权衡：**
- ✅ 优势：体积小、加载快、无构建步骤
- ❌ 劣势：无虚拟 DOM，DOM 操作需手动管理
- 缓解措施：通过模块化设计（`modules/`）将 DOM 操作封装在 `KeyboardView` 中

---

## ADR-003: 使用 chrome.storage.sync 进行数据持久化

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** 需要持久化用户设置、练习进度和成就数据。

**决策：** 使用 `chrome.storage.sync` API 作为唯一数据持久化方案。

**理由：**
1. `chrome.storage.sync` 自动跨设备同步（Google 账号关联）
2. API 简洁，支持嵌套 JSON 对象
3. 容量限制 100KB，对本项目足够（预计数据量 < 10KB）
4. 无需自行实现同步逻辑
5. Chrome 提供离线缓存，网络断开时降级使用本地存储

**替代方案：**
- `chrome.storage.local` — 不跨设备同步，本项目不适用
- IndexedDB — 过于复杂，超出本项目需求
- 外部服务器 — 违反隐私优先原则，且增加复杂度

**风险：** `chrome.storage.sync` 有写入频率限制（约每秒 1 次），高频写入可能失败。通过 `StorageManager` 的批量写入和节流解决。

---

## ADR-004: 使用 CSS Custom Properties 实现主题系统

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** 需要提供亮色和暗色主题切换，适配不同使用场景（白天/夜间）。

**决策：** 使用 CSS Custom Properties (CSS Variables) 实现主题切换。

**理由：**
1. 运行时切换无需重新加载页面
2. 变量集中管理，修改一处全局生效
3. 支持 `data-theme` 属性选择器，与 JS 设置联动简单
4. 浏览器原生支持，无额外依赖
5. 可叠加在现有 CSS 上，改造成本低

**替代方案：**
- CSS-in-JS（如 styled-components）— 需要框架支持，本项目不用
- 预编译 CSS 文件切换 — 需要重新加载页面，体验差

**实现：**
```css
:root[data-theme="dark"] { --bg-primary: #1E1E2E; ... }
:root[data-theme="light"] { --bg-primary: #FFFFFF; ... }
```

---

## ADR-005: 使用 Web Audio API 合成音效

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** 需要为正确/错误按键提供听觉反馈，增强儿童练习的趣味性。

**决策：** 使用 Web Audio API 实时合成音效，不依赖外部音频文件。

**理由：**
1. 零外部依赖，无需加载 mp3/wav 文件
2. 可程序化生成不同音高和时长的音效
3. 正确按键：短促高频「嗒」声（800Hz, 50ms）
4. 错误按键：低沉「嗡」声（200Hz, 150ms）
5. 性能开销极小，不影响打字流畅度

**替代方案：**
- 预录制音频文件 — 增加打包体积，加载慢
- 无音效 — 降低练习趣味性

---

## ADR-006: Content Script 模式而非 chrome_url_overrides

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** 需要决定打字练习界面的呈现方式。

**决策：** 使用 Content Script + DOM Overlay 方式，覆盖到当前网页上。

**理由：**
1. 用户可在任意网页上练习，不限于扩展专属页面
2. 半透明覆盖层不阻挡用户查看原网页内容
3. 符合「辅助工具」的定位，而非独立应用
4. 可通过快捷键快速切换，体验流畅

**替代方案：**
- `chrome_url_overrides` (newtab) — 只能在新标签页练习，无法在现有网页上使用
- 独立页面 — 需要用户手动导航，体验差

---

## ADR-007: 模块化设计（Single Responsibility Modules）

| 项目 | 内容 |
|------|------|
| **日期** | 2026-08-19 |
| **状态** | 已采纳 |
| **决策者** | 项目团队 |

**背景：** 项目包含 8 个核心业务模块，需要清晰的职责划分。

**决策：** 每个模块一个文件，遵循单一职责原则，通过 `StorageManager` 和消息机制进行通信。

**理由：**
1. 职责清晰，易于测试和维护
2. 模块间松耦合，通过消息和存储接口通信
3. 新增模块不影响现有模块
4. 方便开发者定位问题（知道功能在哪个模块）

**模块清单：**

| 模块 | 职责 | 运行环境 |
|------|------|----------|
| `KeyboardView` | 虚拟键盘渲染与交互 | Content Script |
| `TypingEngine` | 打字判定、计时、WPM 计算 | Content Script |
| `StatsTracker` | 统计指标收集与展示 | Content Script |
| `StorageManager` | chrome.storage.sync 封装 | Service Worker |
| `SettingsManager` | 用户偏好管理 | Service Worker |
| `AchievementSystem` | 成就定义与解锁判定 | Service Worker |
| `LevelSystem` | 等级系统与难度调节 | Service Worker |
| `SoundManager` | Web Audio API 音效 | Content Script |

---

*文档版本: 1.0.0 | 最后更新: 2026-08-19*
