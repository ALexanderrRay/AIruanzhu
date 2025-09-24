const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // 加载环境变量

// 导入API处理模块
const { analyzeDocumentWithAI } = require('./ai-service');

// 创建窗口函数
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // 安全通信脚本
      nodeIntegration: false, // 关闭Node集成（安全考虑）
      contextIsolation: true  // 开启上下文隔离
    }
  });

  // 加载首页
  win.loadFile(path.join(__dirname, '../renderer/pages/home.html'));

  // 打开开发者工具（调试用，上线前删除）
  //win.webContents.openDevTools();
}

// Electron初始化完成后创建窗口
app.whenReady().then(createWindow);

// 关闭窗口 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 安全地获取API配置（不暴露给渲染进程）
ipcMain.handle('get-api-config', () => {
  return {
    apiKey: process.env.API_KEY,
    apiUrl: process.env.AI_SERVICE_URL
  };
});

// 处理文档分析请求
ipcMain.handle('analyze-document', async (event, filePath) => {
  try {
    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 调用AI服务分析文档
    const result = await analyzeDocumentWithAI(fileContent);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('文档分析失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理文件保存
ipcMain.handle('save-document', async (event, { content, filename }) => {
  const outputDir = path.join(__dirname, '../../output');
  const filePath = path.join(outputDir, filename);
  
  try {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存文件
    fs.writeFileSync(filePath, content);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('文件保存失败:', error);
    return { success: false, error: error.message };
  }
});

