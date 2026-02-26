# Investment Tracker - 构建说明

## 概述
这是一个基于 Electron 的桌面应用程序，用于跟踪定期投资收益。支持 Windows、macOS 和 Linux 系统。

## 系统要求
- Node.js 16.0.0 或更高版本
- npm 7.0.0 或更高版本

## 安装和构建步骤

### 1. 安装依赖
```bash
cd investment-tracker-app
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```

### 3. 构建应用程序

#### 构建所有平台（推荐）
```bash
npm run build-all
```

#### 分别构建各平台
```bash
# Windows
npm run build-win

# macOS
npm run build-mac

# Linux
npm run build-linux
```

#### 构建当前平台
```bash
npm run build
```

### 4. 输出文件
构建完成后，应用程序文件将位于 `dist/` 目录中：

#### Windows
- `Investment Tracker Setup 1.0.0.exe` - 安装程序
- `Investment Tracker 1.0.0.exe` - 便携版

#### macOS
- `Investment Tracker-1.0.0.dmg` - 磁盘映像文件
- `Investment Tracker-1.0.0-mac.zip` - ZIP 压缩包

#### Linux
- `Investment Tracker-1.0.0.AppImage` - AppImage 格式
- `investment-tracker_1.0.0_amd64.deb` - Debian 包
- `investment-tracker-1.0.0.x86_64.rpm` - RPM 包

## 图标文件

应用程序需要以下图标文件：

### Windows
- `assets/icon.ico` - Windows 图标文件

### macOS
- `assets/icon.icns` - macOS 图标文件
- `assets/entitlements.mac.plist` - macOS 权限文件

### Linux
- `assets/icon.png` - PNG 图标文件（512x512）

### DMG 背景（可选）
- `assets/dmg-background.png` - macOS DMG 背景图片

## 代码签名（生产环境）

### Windows
需要 Windows 代码签名证书：
```bash
electron-builder --win --publish=never --config.win.certificateFile="path/to/certificate.p12" --config.win.certificatePassword="password"
```

### macOS
需要 Apple Developer 证书：
```bash
electron-builder --mac --publish=never --config.mac.identity="Developer ID Application: Your Name"
```

## 更新机制

应用程序包含自动更新功能（electron-updater），需要配置：
1. GitHub Releases
2. 代码签名证书
3. 正确的发布配置

## 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **构建失败**
   ```bash
   npm run clean
   npm install
   npm run build
   ```

3. **权限问题（macOS）**
   ```bash
   sudo xattr -cr "Investment Tracker.app"
   ```

4. **Windows Defender 警告**
   - 这是正常的，因为应用没有代码签名
   - 用户可以选择"仍要运行"来安装

## 发布

### 自动发布到 GitHub
```bash
npm run build --publish=always
```

### 手动发布
1. 构建应用程序
2. 上传到 GitHub Releases
3. 更新下载链接

## 开发

### 项目结构
```
investment-tracker-app/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── investment-tracker.html  # 应用程序主页面
├── package.json         # 项目配置
├── assets/              # 资源文件
│   ├── icon.png
│   ├── icon.ico
│   ├── icon.icns
│   └── ...
├── dist/                # 构建输出
└── BUILD.md             # 本文档
```

### 调试
```bash
# 开发模式
npm run dev

# 打开开发者工具
# 在 main.js 中取消注释：mainWindow.webContents.openDevTools();
```

## 许可证
MIT License

## 支持
如有问题，请提交 Issue 或联系开发者。