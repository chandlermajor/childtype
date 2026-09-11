# Chrome Web Store 上架材料 / Store Listing Materials

本文档定义 ChildType 在 Chrome Web Store 上架所需的全部材料。

---

## 1. 基本信息

| 字段 | 内容 |
|------|------|
| **名称** | ChildType |
| **简称** | ChildType |
| **类别** | 教育 > 教育 |
| **目标受众** | 儿童 (5-12 岁)、家长、教育者 |
| **语言** | 英文（后续可添加中文） |
| **定价** | 免费 |

---

## 2. 商店描述

### 短描述（≤ 132 字符）

```
Fun typing practice for kids 5-12. 8 progressive phases from home row to full keyboard. Auto-advancing difficulty.
```

**字符数：** 123 字符 ✅

### 详细描述（HTML 格式）

```html
<h2>Make Typing Fun for Kids! 🎯</h2>

<p>ChildType helps children ages 5-12 learn proper keyboard finger placement and improve typing speed through interactive, gamified practice.</p>

<h3>✨ Key Features</h3>
<ul>
  <li><strong>8 Progressive Phases</strong> — From Home Row (ASDF JKL;) to Full Keyboard, numbers & symbols introduced gradually</li>
  <li><strong>Auto-Advancing Difficulty</strong> — No manual difficulty selection; each batch auto-evaluates and advances or falls back</li>
  <li><strong>Colorful Virtual Keyboard</strong> — Each key is color-coded by finger, helping kids learn correct finger placement</li>
  <li><strong>Multiple Practice Modes</strong> — Letter Practice (8 phases), Ordered Letters (A→Z), Free Typing, Finger-Specific practice</li>
  <li><strong>Real-Time Stats</strong> — Watch your WPM, accuracy, and streak grow in real time</li>
  <li><strong>Level System (Lv.1–Lv.25)</strong> — Progress from Typing Beginner to Typing God</li>
  <li><strong>48 Achievements</strong> — Earn badges for milestones like "First Key", "10 Streak", "Phase 4 Complete", "30 WPM"</li>
  <li><strong>Sound Feedback</strong> — Satisfying click sounds for correct and wrong keys</li>
  <li><strong>3 Themes</strong> — Light, Dark, and Eye-care mode for day or night</li>
  <li><strong>Works on Any Website</strong> — Practice typing right where you are</li>
</ul>

<h3>🎓 Perfect For</h3>
<ul>
  <li>Children learning to type for the first time</li>
  <li>Kids who want to improve their typing speed</li>
  <li>Parents looking for educational screen time</li>
  <li>Teachers using keyboards in the classroom</li>
</ul>

<h3>🔒 Privacy First</h3>
<p>All data is stored locally in your browser (chrome.storage.local). We don't collect, upload, or share any personal information.</p>

<p>Start practicing today and watch your child's typing skills grow! 🚀</p>
```

---

## 3. 截图要求

### 推荐截图数量：4-8 张

| 编号 | 内容 | 尺寸 | 说明 |
|------|------|------|------|
| 截图 1 | popup 主界面 | 1280×800 | 展示模式选择（字母/顺序/自由/指法）、快速统计、等级进度 |
| 截图 2 | overlay 字母练习 | 1280×800 | 展示虚拟键盘、目标字母高亮、统计栏、阶段标签 "阶段 3/8 · 单指列" |
| 截图 3 | overlay 阶段升级 | 1280×800 | 展示批次完成后的升阶通知 "🎊 突破阶段 4！进入【双指配对·入门数字】" |
| 截图 4 | 指法彩色标注 | 1280×800 | 展示键盘按手指分区的颜色标注 |
| 截图 5 | 成就系统 | 1280×800 | 展示成就墙、徽章（已解锁彩色、未解锁灰色） |
| 截图 6 | 设置界面 | 1280×800 | 展示主题切换（亮/暗/护眼）、字体大小、音效开关（无难度选择器） |
| 截图 7（可选） | 统计图表 | 1280×800 | 展示每日/每周练习统计 |
| 截图 8（可选） | 暗色/护眼主题 | 1280×800 | 展示暗色主题和护眼主题效果 |

### 截图规范

- 格式：PNG 或 JPEG
- 尺寸：至少 1280×800 px
- 文件大小：每张 < 1MB
- 背景：干净、无杂乱元素
- 文字：截图中的文字应为英文（商店默认语言）
- 真实截图：使用扩展实际运行截图，不使用设计稿

---

## 4. 分类与标签

### 主分类
```
教育 > 教育
```

### 推荐标签（Tags）

```
typing, keyboard, education, kids, children, learn to type, touch typing, finger placement, educational game, typing practice, progressive phases
```

### 搜索关键词（用于商店搜索优化）

```
typing tutor, keyboard practice, learn to type, typing game, kids typing, educational extension, touch typing, finger typing, typing speed, WPM trainer, 8 phases typing
```

---

## 5. 应用图标

参见 `docs/ICON-DESIGN.md`。

---

## 6. 隐私政策链接

上架时需提供隐私政策 URL。

**方案 A：GitHub Pages（免费）**
```
https://<username>.github.io/childtype/privacy-policy.html
```

**方案 B：扩展内嵌页面**
- 在 `privacy-policy.html` 中提供完整隐私政策
- 在商店后台填写 `https://<extension-id>.chromiumapp.org/privacy-policy.html`
- 或提供外部托管链接

**方案 C：Google Sites（免费）**
- 创建 Google Sites 页面
- 发布后提供 URL

---

## 7. 开发者信息

| 字段 | 内容 |
|------|------|
| 开发者名称 | ChildType Team（或个人名称） |
| 邮箱 | support@childtype.example.com（替换为实际邮箱） |
| 网站 | 可选（如有 GitHub Pages 或项目主页） |
| 隐私政策 URL | 见上方方案 |

---

## 8. 上架前检查清单

在提交审核前，逐项确认：

```
□ manifest.json 所有必填字段正确
□ 版本号 ≥ 1.0.0（首次上架）
□ 图标 48px 和 128px 齐全
□ 描述在 132 字符限制内
□ 隐私政策页面可访问（声明 chrome.storage.local）
□ 截图 4-8 张，尺寸达标
□ 分类选择正确（教育 > 教育）
□ 标签和关键词已填写
□ 开发者邮箱正确
□ 无多余权限声明（仅 storage, activeTab, scripting）
□ 无外部资源加载
□ 代码可读（无混淆）
□ 功能完整（所有 P0 功能正常）
□ 已测试所有模式（字母/顺序/自由/指法）
□ 已清除控制台错误
□ 已清除调试代码和 console.log
```

---

## 9. 审核常见驳回原因及应对

| 驳回原因 | 应对方案 |
|----------|----------|
| 功能不完整 / 空壳 | 确保所有模式可正常使用，统计真实计算，8阶段进阶正常工作 |
| 隐私政策缺失 | 提供完整的隐私政策页面（声明 chrome.storage.local 本地存储） |
| 权限过多 | 仅声明实际使用的权限（storage, activeTab, scripting） |
| 图标不规范 | 提供 48px 和 128px PNG，符合尺寸要求 |
| 描述不符 | 描述准确反映扩展功能（8阶段进阶、无手动难度选择） |
| 代码混淆 | 使用可读的代码，不包含压缩/混淆的 JS |
| 外部资源 | 不加载任何外部脚本或样式 |

---

## 10. 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 2.0.0 | 2026-09-11 | 移除单词/句子模式；8阶段字母进阶；自动化难度；local storage |
| 1.0.0 | 2026-08-19 | 初始版本 |

---

*文档版本: 2.0.0 | 最后更新: 2026-09-11*