const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 保持对窗口对象的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // 在生产环境中禁用 webSecurity，允许 file:// 协议加载本地资源
      // 这对于从 Applications 文件夹运行时加载懒加载的 chunk 文件是必要的
      webSecurity: false,
      allowRunningInsecureContent: false,
      // 启用 file:// 协议访问
      webviewTag: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false, // 先不显示，等加载完成后再显示
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // macOS traffic light positioning (only effective with hidden/hiddenInset)
    ...(process.platform === 'darwin' && {
      trafficLightPosition: { x: 20, y: 24 }
    })
  });

  // 加载应用
  // 开发模式：加载Vite开发服务器
  // 生产模式：加载构建后的HTML
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  // 临时调试模式：允许在生产环境打开开发者工具
  const enableDebug = process.argv.includes('--debug') || process.env.ENABLE_DEBUG === 'true';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 确保开发者工具窗口在前台打开
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产模式：从 app.asar 内加载 index.html
    // index.html 由 Vite 构建到项目根目录，然后被打包进 app.asar
    const htmlPath = path.join(__dirname, '..', 'index.html');

    mainWindow.loadFile(htmlPath).then(() => {
      // 在调试模式下打开开发者工具
      if (enableDebug) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }).catch((error) => {
      console.error('❌ [MAIN] Failed to load HTML:', error);
      console.error('❌ [MAIN] HTML path:', htmlPath);
      console.error('❌ [MAIN] __dirname:', __dirname);
    });
  }

  // 监听渲染进程的控制台消息
  if (enableDebug || isDev) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const levelMap = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      console.log(`[RENDERER ${levelMap[level]}] ${message} (${sourceId}:${line})`);
    });
  }

  // 监听页面加载失败
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ [MAIN] Page load failed:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理刷新事件 - 重新加载应用而不是刷新当前URL
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Cmd+R 或 F5 刷新快捷键
    if ((input.meta && input.key === 'r') || input.key === 'F5') {
      event.preventDefault();
      // 重新加载应用
      if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
      } else {
        const resourcesPath = process.resourcesPath;
        mainWindow.loadFile(path.join(resourcesPath, 'dist-renderer', 'index.html'));
      }
    }
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 设置菜单
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导出数据',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('export-data');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectall', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: '关于 ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 ' + app.getName() },
        { role: 'hideothers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: '退出 ' + app.getName() }
      ]
    });

    // 编辑菜单
    template[2].submenu.push(
      { type: 'separator' },
      {
        label: '语音',
        submenu: [
          { role: 'startspeaking', label: '开始语音' },
          { role: 'stopspeaking', label: '停止语音' }
        ]
      }
    );

    // 窗口菜单
    template[4].submenu = [
      { role: 'close', label: '关闭' },
      { role: 'minimize', label: '最小化' },
      { role: 'zoom', label: '缩放' },
      { type: 'separator' },
      { role: 'front', label: '全部置前' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用准备就绪时创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（除了 macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 激活应用时创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC 处理
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('platform', () => {
  return process.platform;
});

// 读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 选择并读取文件
ipcMain.handle('select-and-read-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON/CSV Files', extensions: ['json', 'csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = await fs.promises.readFile(filePath, 'utf-8');

    return {
      success: true,
      content,
      fileName: path.basename(filePath)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});