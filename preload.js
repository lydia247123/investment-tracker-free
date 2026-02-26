const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('app-version'),

  // 获取平台信息
  getPlatform: () => ipcRenderer.invoke('platform'),

  // 导出数据
  exportData: (callback) => {
    ipcRenderer.on('export-data', callback);
  },

  // 显示关于对话框
  showAbout: (callback) => {
    ipcRenderer.on('show-about', callback);
  },

  // 读取文件内容
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // 选择并读取文件
  selectAndReadFile: () => ipcRenderer.invoke('select-and-read-file'),

  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});