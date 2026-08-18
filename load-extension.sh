#!/bin/bash
# 一键加载 Chrome 扩展
cd "$(dirname "$0")"

# 复制构建产物到根目录
cp build/chrome/manifest.json ./manifest.json 2>/dev/null
cp build/chrome/background.js ./background.js 2>/dev/null
cp build/chrome/app.js ./app.js 2>/dev/null
cp build/chrome/index.html ./index.html 2>/dev/null
mkdir -p icons && cp build/chrome/icons/icon-*.png ./icons/ 2>/dev/null || true

echo "✅ 扩展已准备就绪"
echo "请打开 chrome://extensions/ 并加载 /media/chandler/BD79E4DF5C7617FE/墨/coding-project/childtype 目录"
