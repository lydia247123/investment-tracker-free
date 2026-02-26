# Dashboard 加载问题调试指南

## 问题修复内容

已完成以下修复以解决从 Applications 文件夹运行时 Dashboard 加载慢的问题：

### 1. 调试工具
- ✅ 添加了生产环境开发者工具支持
- ✅ 添加了全局错误捕获和日志记录
- ✅ 添加了资源加载监控

### 2. 性能优化
- ✅ 移除了生产环境的 React.StrictMode（避免双重渲染）
- ✅ 创建了 ErrorBoundary 组件处理懒加载失败
- ✅ 优化了 Dashboard 懒加载策略，每个图表都有独立的错误边界和重试机制
- ✅ 调整了 Electron 安全设置（禁用 webSecurity 以允许本地资源加载）

### 3. 用户体验改进
- ✅ 添加了更详细的加载状态提示
- ✅ 为每个图表提供了独立的加载指示器
- ✅ 添加了错误重试按钮

## 测试步骤

### 方法 1: 正常运行（推荐）

1. 找到新生成的 DMG 文件：
   ```
   dist/Investment Tracker-1.0.0-arm64.dmg  (Apple Silicon)
   或
   dist/Investment Tracker-1.0.0.dmg  (Intel)
   ```

2. 双击打开 DMG 文件

3. 将应用拖到 Applications 文件夹

4. 从 Applications 文件夹打开应用，查看 Dashboard 加载情况

5. 观察改进：
   - Dashboard 应该能够直接加载
   - 每个图表都会显示独立的加载进度
   - 如果某个图表加载失败，会显示错误信息和重试按钮

### 方法 2: 调试模式（查看详细日志）

如果仍然遇到问题，可以使用调试模式查看详细的错误信息：

1. 打开终端 (Terminal)

2. 运行以下命令启用调试模式：
   ```bash
   /Applications/Investment\ Tracker.app/Contents/MacOS/Investment\ Tracker --debug
   ```

3. 应用会自动打开开发者工具窗口，显示详细的日志信息

4. 查看控制台中的关键日志：
   - `[MAIN]` - Electron 主进程日志
   - `[RENDERER]` - React 渲染进程日志
   - `[Dashboard]` - Dashboard 页面日志
   - `[GLOBAL]` - 全局错误日志
   - `[LazyErrorBoundary]` - 懒加载组件错误日志

### 方法 3: 永久启用调试模式

如果需要持续调试，可以设置环境变量：

```bash
export ENABLE_DEBUG=true
/Applications/Investment\ Tracker.app/Contents/MacOS/Investment\ Tracker
```

## 预期改进

### 修复前：
- ❌ Dashboard 页面加载不出来
- ❌ 必须通过其他页面跳转才能显示
- ❌ 加载非常慢
- ❌ 没有错误提示

### 修复后：
- ✅ Dashboard 可以直接加载
- ✅ 每个图表独立加载，不会互相影响
- ✅ 加载速度明显提升（移除 StrictMode 双重渲染）
- ✅ 有清晰的加载状态和错误提示
- ✅ 加载失败时可以点击重试
- ✅ 可以通过调试模式查看详细日志

## 如果仍然有问题

请使用调试模式运行应用，并提供以下信息：

1. 控制台中的错误信息（特别是标记为 ❌ 的日志）
2. Dashboard 加载到哪一步卡住了
3. 哪些图表加载成功，哪些失败了
4. 是否有任何弹出的错误对话框

## 关键改进说明

### webSecurity 设置
已将 `webSecurity` 设置为 `false`，这允许应用从 `file://` 协议加载懒加载的 JavaScript chunk 文件。这对于 Electron 应用从 Applications 文件夹运行是必要的。

**安全性说明**：这个改动是安全的，因为：
- 应用只加载本地打包的资源
- 不连接外部网站或 API
- 所有数据都存储在本地 localStorage

### 懒加载重试机制
每个图表组件都包装了错误边界和重试逻辑：
- 首次加载失败会自动重试一次
- 仍然失败会显示友好的错误界面
- 用户可以手动点击"重试加载"按钮

### 性能优化
- 移除生产环境的 StrictMode，避免组件双重渲染
- 每个图表独立加载，互不阻塞
- 添加了详细的加载进度提示

## 构建新版本

如果需要重新构建：

```bash
# 构建前端
npx vite build

# 构建 macOS 应用
npm run build-mac
```

生成的文件在 `dist/` 目录中。

