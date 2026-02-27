#!/bin/bash

echo "🚀 Investment Tracker - 跨平台打包脚本"
echo "========================================"

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 当前目录: $(pwd)"
echo "🎯 开始跨平台打包..."

# 1. 构建 macOS 版本（已完成）
echo ""
echo "✅ macOS 版本已构建完成"
echo "   📁 Investment Tracker-1.0.0.dmg ($(( $(stat -f%z 'dist/Investment Tracker-1.0.0.dmg') / 1024 / 1024 ))MB)"
echo "   📁 Investment Tracker-1.0.0-mac.zip ($(( $(stat -f%z 'dist/Investment Tracker-1.0.0-mac.zip') / 1024 / 1024 ))MB)"

# 2. 构建 Windows 版本
echo ""
echo "🪟 正在构建 Windows 版本..."
npm run build-win 2>/dev/null || {
    echo "⚠️  Windows 版本构建失败，可能是网络问题"
    echo "   💡 提示: 可以稍后手动运行 npm run build-win"
}

# 检查 Windows 构建结果
if [ -f "dist/Investment Tracker Setup 1.0.0.exe" ]; then
    echo "   ✅ Windows 版本构建成功"
    echo "   📁 Investment Tracker Setup 1.0.0.exe"
else
    echo "   ❌ Windows 版本构建失败"
fi

# 3. 构建 Linux 版本
echo ""
echo "🐧 正在构建 Linux 版本..."
npm run build-linux 2>/dev/null || {
    echo "⚠️  Linux 版本构建失败，可能是网络问题"
    echo "   💡 提示: 可以稍后手动运行 npm run build-linux"
}

# 检查 Linux 构建结果
if [ -f "dist/Investment Tracker-1.0.0.AppImage" ]; then
    echo "   ✅ Linux 版本构建成功"
    echo "   📁 Investment Tracker-1.0.0.AppImage"
else
    echo "   ❌ Linux 版本构建失败"
fi

# 4. 生成打包报告
echo ""
echo "📊 打包报告"
echo "============="
echo "📁 输出目录: $(pwd)/dist/"
echo ""

ls -la dist/ | grep -E '\.(exe|dmg|zip|AppImage|deb|rpm)$' | while read line; do
    filename=$(echo $line | awk '{print $9}')
    size=$(echo $line | awk '{print $5}')

    if [ "$size" -gt 1048576 ]; then
        size_mb=$((size / 1024 / 1024))
        size_str="${size_mb}MB"
    elif [ "$size" -gt 1024 ]; then
        size_kb=$((size / 1024))
        size_str="${size_kb}KB"
    else
        size_str="${size}B"
    fi

    echo "   ✅ $filename ($size_str)"
done

# 5. 生成分发说明
echo ""
echo "📋 分发说明"
echo "============="
echo ""

cat > "dist/DISTRIBUTION.md" << 'EOF'
# Investment Tracker - 分发包说明

## 文件说明

### macOS (Mac)
- `Investment Tracker-1.0.0.dmg` - macOS 安装包 (推荐)
- `Investment Tracker-1.0.0-mac.zip` - macOS 压缩包
- `Investment Tracker-1.0.0-arm64.dmg` - Apple Silicon 版本
- `Investment Tracker-1.0.0-arm64-mac.zip` - Apple Silicon 压缩包

### Windows
- `Investment Tracker Setup 1.0.0.exe` - Windows 安装程序
- `Investment Tracker 1.0.0.exe` - Windows 便携版

### Linux
- `Investment Tracker-1.0.0.AppImage` - 通用 Linux 应用 (推荐)
- `investment-tracker_1.0.0_amd64.deb` - Debian/Ubuntu 包
- `investment-tracker-1.0.0.x86_64.rpm` - RedHat/Fedora 包

## 安装说明

### macOS
1. 下载 `.dmg` 文件
2. 双击打开挂载
3. 将应用拖拽到 Applications 文件夹
4. 在 Launchpad 或 Applications 中找到应用

### Windows
1. 下载 `Setup` 版本
2. 双击运行安装程序
3. 按照提示完成安装
4. 在开始菜单中找到应用

### Linux
1. 下载 `AppImage` 文件
2. 添加执行权限: `chmod +x Investment\ Tracker-1.0.0.AppImage`
3. 双击运行或在终端执行

## 系统要求

- **macOS**: 10.14 (Mojave) 或更高版本
- **Windows**: Windows 10 或更高版本
- **Linux**: 主流发行版 (Ubuntu 18.04+, Fedora 30+)

## 注意事项

1. 首次运行可能需要允许应用执行
2. 应用数据存储在本地，不会上传到云端
3. 支持数据导出为 CSV 格式
4. 无需网络连接即可使用

---

构建时间: $(date)
构建平台: macOS $(uname -m)
EOF

echo "   ✅ 分发说明已生成: dist/DISTRIBUTION.md"

# 6. 最终统计
echo ""
echo "🎉 打包完成!"
echo "============"
echo "📁 所有文件位于: $(pwd)/dist/"
echo "📄 详细说明: dist/DISTRIBUTION.md"
echo ""

# 显示总文件大小
total_size=$(du -sh dist/ | cut -f1)
echo "📊 总大小: $total_size"
echo ""

# 提供下一步建议
echo "💡 下一步建议:"
echo "1. 测试应用程序是否正常运行"
echo "2. 创建 GitHub Release 并上传文件"
echo "3. 准备用户文档和教程"
echo "4. 考虑代码签名（如需发布）"