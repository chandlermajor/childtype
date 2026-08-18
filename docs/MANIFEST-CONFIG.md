# Manifest 配置详解 / Manifest Configuration

本文档定义 `manifest.json` 的完整配置，包含每个字段的说明、取值和理由。

---

## 完整 manifest.json

```json
{
  "manifest_version": 3,
  "name": "ChildType",
  "short_name": "ChildType",
  "version": "0.0.1",
  "description": "Fun typing practice for kids 5-12. Practice keyboard finger placement and typing speed.",
  "default_locale": "en",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_title": "ChildType",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_popup": "popup/popup.html"
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "commands": {
    "toggle-overlay": {
      "suggested_key": {
        "default": "Ctrl+Shift+T"
      },
      "description": "Toggle typing overlay"
    },
    "pause-session": {
      "suggested_key": {
        "default": "Ctrl+Shift+H"
      },
      "description": "Pause/resume typing session"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  },
  "web_accessible_resources": [
    {
      "resources": ["overlay/overlay.html", "overlay/overlay.css", "overlay/overlay.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "minimum_chrome_version": "88"
}
```

---

## 字段说明

### 必需字段

| 字段 | 值 | 说明 |
|------|------|------|
| `manifest_version` | `3` | Manifest V3 是唯一被支持的版本 |
| `name` | `"ChildType"` | 扩展在 Chrome Web Store 和工具栏显示的名称（最大 75 字符） |
| `version` | `"0.0.1"` | 初始版本号。首次上架后每次更新必须递增。格式：主版本.次版本.修订版本 |

### Chrome Web Store 必需字段

| 字段 | 值 | 说明 |
|------|------|------|
| `description` | `"Fun typing practice for kids 5-12. Practice keyboard finger placement and typing speed."` | 扩展描述（最大 132 字符）。此描述会显示在商店和扩展管理页面 |
| `icons` | `{16: ..., 48: ..., 128: ...}` | 图标文件。必须包含 48px 和 128px。16px 是工具栏小图标 |

### 可选但推荐的字段

| 字段 | 值 | 说明 |
|------|------|------|
| `short_name` | `"ChildType"` | 空间受限时使用的简称（最大 12 字符），此处与 name 相同 |
| `default_locale` | `"en"` | 默认语言。用于 i18n 翻译。如需多语言，在 `_locales/` 目录提供翻译 |
| `action.default_title` | `"ChildType"` | 鼠标悬停在图标上时显示的提示文字 |
| `action.default_icon` | `{16: ..., 48: ..., 128: ...}` | 工具栏图标。与 `icons` 字段可共享文件 |
| `action.default_popup` | `"popup/popup.html"` | 点击图标时弹出的 HTML 页面 |
| `background.service_worker` | `"background/service-worker.js"` | Service Worker 入口文件 |
| `background.type` | `"module"` | 使用 ES Module 格式加载 Service Worker（MV3 推荐） |
| `commands` | 见下 | 注册全局快捷键 |
| `content_security_policy` | 见下 | CSP 策略 |
| `web_accessible_resources` | 见下 | 允许 Content Script 访问的资源 |
| `minimum_chrome_version` | `"88"` | 最低 Chrome 版本要求（MV3 需要 Chrome 88+） |

---

## 权限说明

### 声明的权限 (`permissions`)

| 权限 | 用途 | 必要性 | 审批风险 |
|------|------|--------|----------|
| `storage` | 读写 `chrome.storage.sync`，保存用户设置和进度 | 核心功能 | 低（常见权限） |
| `activeTab` | 获取当前活跃 Tab 的 ID，用于注入 Content Script | 核心功能 | 低 |
| `scripting` | 动态执行 `chrome.scripting.executeScript`，注入 overlay | 核心功能 | 低 |

**未声明但被拒绝的权限：**
- `tabs` — 不需要，仅需获取当前 Tab ID
- `cookies` — 不访问用户 Cookie
- `webRequest` — MV3 已废弃，使用 `declarativeNetRequest`
- `downloads` — 不提供文件下载功能
- `alarms` — 不使用定时任务
- `notifications` — 不使用桌面通知
- `contextMenus` — 不使用右键菜单

### 宿主权限 (`host_permissions`)

| 权限 | 用途 | 必要性 |
|------|------|--------|
| `<all_urls>` | 使 Content Script 和 overlay 可在任意网页上工作 | 核心功能 |

此权限在用户安装时会被提示。由于是「辅助工具」类扩展，此权限是合理且必要的。

---

## Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self';"
}
```

**策略说明：**
- `script-src 'self'` — 只允许加载扩展自身目录下的脚本，不允许外部脚本
- `object-src 'self'` — 只允许加载扩展自身目录下的对象
- 不使用 `script-src 'unsafe-inline'` — 避免内联脚本风险
- Service Worker 使用 ES Module 格式，不受 CSP 限制

**为什么不用 `script-src 'unsafe-eval'`：**
- 禁止动态代码执行，提高安全性
- 本项目不需要 `eval()` 或 `new Function()`

---

## Web Accessible Resources

```json
"web_accessible_resources": [
  {
    "resources": ["overlay/overlay.html", "overlay/overlay.css", "overlay/overlay.js"],
    "matches": ["<all_urls>"]
  }
]
```

**说明：**
- overlay 的 HTML/CSS/JS 文件需要被 Content Script 动态注入到任意网页
- `matches: ["<all_urls>"]` 表示这些资源可被所有网页访问
- 仅暴露 overlay 相关资源，不暴露其他扩展内部文件

---

## Commands (快捷键)

```json
"commands": {
  "toggle-overlay": {
    "suggested_key": { "default": "Ctrl+Shift+T" },
    "description": "Toggle typing overlay"
  },
  "pause-session": {
    "suggested_key": { "default": "Ctrl+Shift+H" },
    "description": "Pause/resume typing session"
  }
}
```

**说明：**
- `Ctrl+Shift+T`：快速切换 overlay 的显示/隐藏
- `Ctrl+Shift+H`：暂停/恢复当前练习会话
- `suggested_key` 是建议值，用户可在 `chrome://extensions/shortcuts` 中自定义

---

## 版本号管理规范

| 阶段 | 版本号格式 | 说明 |
|------|-----------|------|
| 开发阶段 | `0.0.1` → `0.0.2` → `0.0.3` | 每次修改递增修订号 |
| Alpha 测试 | `0.1.0` | 内部测试版本 |
| Beta 测试 | `0.2.0` | 公开测试版本 |
| 首次上架 | `1.0.0` | 正式发布 |
| 后续更新 | `1.0.1`, `1.1.0`, `2.0.0` | 遵循语义化版本 (SemVer) |

**注意：**
- Chrome Web Store 要求每个上传的版本号必须大于前一个
- `0.0.1` 作为初始版本，后续可逐步递增
- 建议使用语义化版本：`主版本.次版本.修订版本`

---

*文档版本: 1.0.0 | 最后更新: 2026-08-19*
