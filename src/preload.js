const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  analyzeDocument: (filePath) => ipcRenderer.invoke('analyze-document', filePath),
  saveDocument: (data) => ipcRenderer.invoke('save-document', data),
    // 后续添加更多API...
});