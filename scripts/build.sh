#!/bin/bash

# Investment Tracker 构建脚本
# 支持 Windows、macOS 和 Linux

set -e

echo "🚀 开始构建 Investment Tracker..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_NODE_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    echo "❌ 错误: 需要 Node.js $REQUIRED_NODE_VERSION 或更高版本，当前版本: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $NODE_VERSION"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建图标文件（如果不存在）
if [ ! -f "assets/icon.png" ]; then
    echo "🎨 创建图标文件..."
    # 如果有 convert 命令，可以转换 SVG 到 PNG
    if command -v convert &> /dev/null; then
        convert assets/icon-placeholder.svg -resize 512x512 assets/icon.png
    else
        echo "⚠️  警告: 未找到 ImageMagick，请手动转换图标文件"
        echo "   需要创建以下文件:"
        echo "   - assets/icon.png (512x512)"
        echo "   - assets/icon.ico (Windows)"
        echo "   - assets/icon.icns (macOS)"
    fi
fi

# 检测平台并构建
PLATFORM=$(uname -s)
echo "🖥️  检测到平台: $PLATFORM"

case $PLATFORM in
    "Darwin")
        echo "🍎 构建 macOS 版本..."
        npm run build-mac
        ;;
    "Linux")
        echo "🐧 构建 Linux 版本..."
        npm run build-linux
        ;;
    "CYGWIN"*|"MINGW"*|"MSYS"*)
        echo "🪟 构建 Windows 版本..."
        npm run build-win
        ;;
    *)
        echo "❌ 未知平台: $PLATFORM"
        echo "📦 构建所有平台..."
        npm run build-all
        ;;
esac

echo "✅ 构建完成!"
echo "📁 输出目录: dist/"
ls -la dist/

# 显示文件大小
echo "📊 构建文件信息:"
if command -v du &> /dev/null; then
    du -h dist/* 2>/dev/null || true
fi

echo "🎉 Investment Tracker 构建成功!"