// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  analyzeDocument: (fileContent, fileName) => ipcRenderer.invoke('analyze-document', fileContent, fileName),
  saveDocument: (content, filename) => ipcRenderer.invoke('save-document', { content, filename }),
  getApiConfig: () => ipcRenderer.invoke('get-api-config'),
  saveFinalMainTable: (finalMainTable) => ipcRenderer.invoke('save-final-main-table', finalMainTable),
  generateDocument: (finalData) => ipcRenderer.invoke('generate-document', finalData), 
  generateManual: (content, softwareInfo) => ipcRenderer.invoke('generate-manual', { content, softwareInfo }),
  generateAllDocuments: (finalData, originalContent) => ipcRenderer.invoke('generate-all-documents', { finalData, originalContent }),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
});