# ChildType — 儿童键盘指法与打字练习 Chrome 扩展

## ChildType — Chrome Extension for Kids Typing Practice

---

## 项目概述 / Project Overview

**ChildType** 是一款面向 5-12 岁儿童的 Chrome 扩展，通过互动式虚拟键盘帮助小朋友练习正确的键盘指法和打字速度。

**ChildType** is a Chrome extension designed for children aged 5–12, providing an interactive virtual keyboard to practice correct finger placement and typing speed.

### 核心理念 / Core Philosophy

- 🎯 **游戏化学习 (Gamified Learning)** — 通过等级、成就和奖励激发孩子学习动力
- 👆 **正确指法 (Proper Finger Placement)** — 每个键位用颜色标记对应的手指，形成肌肉记忆
- 📊 **可视化反馈 (Visual Feedback)** — 实时 WPM 计、准确率、连击数让孩子看到进步
- 🔒 **隐私优先 (Privacy First)** — 所有数据存储在本地，不上传任何服务器

---

## 功能概览 / Feature Overview

| 功能 | 说明 |
|------|------|
| 虚拟键盘 | 彩色键位，按手指区域着色，按键动画反馈 |
| 字母练习 | 随机字母/有序字母练习，适合初学者 |
| 单词练习 | 常用英文单词拼写，按难度分级 |
| 句子练习 | 常用短句练习，培养连贯打字能力 |
| 自由打字 | 在任何网页上覆盖启动，自由练习 |
| 指法专项 | 按手指（左/右手，拇指/食指/中指/无名指/小指）分组练习 |
| 实时统计 | WPM（每分钟字数）、准确率、连击、练习时长 |
| 进度系统 | Lv.1–Lv.10 等级体系，每日/每周统计图表 |
| 成就系统 | 20+ 成就徽章（连续正确 50 次、WPM 突破 60 等） |
| 个性化设置 | 键盘布局、字体大小、主题（亮/暗）、音效开关、难度调节 |
| 多布局支持 | QWERTY / AZERTY（P2 阶段） |

---

## 技术栈 / Tech Stack

| 层面 | 技术 | 理由 |
|------|------|------|
| 扩展格式 | Chrome Extension Manifest V3 | Chrome 当前唯一支持格式 |
| 语言 | Vanilla JavaScript (ES6+) | 无框架依赖，打包体积小，性能好 |
| 样式 | CSS3 + CSS Custom Properties (Variables) | 支持主题切换，动画丰富 |
| 存储 | `chrome.storage.sync` | 跨设备同步用户进度和设置 |
| 音频 | Web Audio API | 合成打字反馈音，无需外部文件 |
| 图标 | PNG (16/48/128px) | Chrome 商店打包要求 |

---

## 项目结构 / Project Structure

```
childtype/
├── manifest.json                 # MV3 清单文件（入口）
├── README.md                     # 本文档
│
├── popup/                        # 弹出窗口（用户主界面）
│   ├── popup.html                # 弹出窗口 HTML 结构
│   ├── popup.css                 # 弹出窗口样式（含主题变量）
│   ├── popup.js                  # 弹出窗口逻辑（设置、进度概览）
│   └── popup.html                # （重复占位，将被移除）
│
├── overlay/                      # 全屏打字覆盖层（Content Script 注入）
│   ├── overlay.html              # 覆盖层 HTML
│   ├── overlay.css               # 覆盖层样式
│   └── overlay.js                # 覆盖层逻辑（核心打字功能）
│
├── background/                   # Service Worker
│   └── service-worker.js         # 后台消息处理、存储管理
│
├── modules/                      # 核心业务模块（模块化设计）
│   ├── KeyboardView.js           # 虚拟键盘渲染与交互
│   ├── TypingEngine.js           # 打字判定、计时、WPM 计算
│   ├── StatsTracker.js           # 统计指标收集与展示
│   ├── StorageManager.js         # chrome.storage.sync 封装
│   ├── SettingsManager.js        # 用户设置管理
│   ├── AchievementSystem.js      # 成就系统
│   ├── SoundManager.js           # Web Audio API 音效
│   └── LevelSystem.js            # 等级与难度系统
│
├── data/                         # 静态数据
│   ├── words.js                  # 单词库（按难度分级）
│   ├── sentences.js              # 句子库
│   ├── levels.js                 # 等级定义与升级条件
│   ├── achievements.js           # 成就定义与解锁条件
│   └── keyboard-layouts.js       # 键盘布局数据（QWERTY, AZERTY）
│
├── icons/                        # 扩展图标
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
│
├── assets/                       # 静态资源
│   ├── keyboard-keys/            # 按键图标/图片
│   └── sounds/                   # 音效文件（可选，主要用 Web Audio）
│
├── docs/                         # 项目文档
│   ├── ARCHITECTURE.md           # 系统架构
│   ├── API-DESIGN.md             # 内部模块接口
│   ├── FEATURES.md               # 功能清单
│   ├── TECH-DECISIONS.md         # 技术决策记录 (ADR)
│   ├── DEVELOPMENT-PLAN.md       # 开发计划
│   ├── MANIFEST-CONFIG.md        # Manifest 配置详解
│   ├── ICON-DESIGN.md            # 图标设计规范
│   ├── PRIVACY-POLICY.md         # 隐私政策
│   ├── STORE-LISTING.md          # 商店上架材料
│   └── CODE-STANDARDS.md         # 编码规范
│
├── privacy-policy.html           # 隐私政策页面（上架用）
└── .gitignore                    # Git 忽略配置
```

---

## 快速开始 / Quick Start

### 环境要求

- Google Chrome 88+（支持 Manifest V3）
- 基本的 HTML/CSS/JavaScript 知识
- VS Code 或任意代码编辑器

### 开发设置

```bash
# 1. 克隆仓库
git clone <repository-url>
cd childtype

# 2. 加载扩展到 Chrome
# 打开 chrome://extensions
# 开启「开发者模式」
# 点击「加载已解压的扩展程序」
# 选择项目根目录
```

### 首次使用

1. 将 ChildType 图标固定到工具栏
2. 点击图标打开弹出窗口
3. 选择练习模式：字母 / 单词 / 句子 / 自由打字
4. 开始练习 — 虚拟键盘会高亮显示下一个要按的键

---

## 开发指南

详细的架构、接口和开发计划见 `docs/` 目录：

| 文档 | 内容 |
|------|------|
| `docs/ARCHITECTURE.md` | 系统架构、组件交互、数据流 |
| `docs/API-DESIGN.md` | 每个模块的公开接口定义 |
| `docs/FEATURES.md` | 完整功能清单（P0/P1/P2） |
| `docs/DEVELOPMENT-PLAN.md` | 分阶段开发计划 |
| `docs/TECH-DECISIONS.md` | 关键技术决策记录 |
| `docs/MANIFEST-CONFIG.md` | manifest.json 完整配置 |
| `docs/CODE-STANDARDS.md` | 编码规范 |

---

## Chrome Web Store 上架

上架前需要完成：

1. ✅ 注册 Chrome Web Store 开发者账号（$5 注册费）
2. ✅ 准备 4-8 张应用截图（弹出窗口、覆盖层、设置页）
3. ✅ 编写中英文应用描述（见 `docs/STORE-LISTING.md`）
4. ✅ 上传隐私政策页面
5. ✅ ZIP 打包（确保 manifest.json 在根目录）
6. ✅ 提交审核

---

## 许可证

MIT License — 可自由使用和修改。
