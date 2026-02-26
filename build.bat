@echo off
REM Investment Tracker Windows 构建脚本

echo 🚀 开始构建 Investment Tracker...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js 16.0.0 或更高版本
    pause
    exit /b 1
)

echo ✅ Node.js 检查通过

REM 安装依赖
echo 📦 安装依赖...
call npm install

REM 检查图标文件
if not exist "assets\icon.ico" (
    echo ⚠️  警告: 未找到 Windows 图标文件 assets\icon.ico
    echo 请准备以下图标文件:
    echo   - assets\icon.ico (Windows)
    echo   - assets\icon.png (512x512, Linux)
    echo   - assets\icon.icns (macOS)
)

REM 构建 Windows 版本
echo 🪟 构建 Windows 版本...
call npm run build-win

echo ✅ 构建完成!
echo 📁 输出目录: dist\
dir dist\

echo 🎉 Investment Tracker 构建成功!
pause