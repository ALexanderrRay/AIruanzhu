const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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

  // 加载首页（改为我们新建的home.html）
  win.loadFile(path.join(__dirname, '../renderer/pages/home.html'));

  // 打开开发者工具（调试用，上线前删除）
  win.webContents.openDevTools();
}

// Electron初始化完成后创建窗口
app.whenReady().then(createWindow);

// ======= 关闭窗口 ======= //
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
// ======================= //

// 监听渲染进程的请求（示例：处理文件保存）
ipcMain.handle('save-document', async (event, { content, filename }) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, '../../output', filename);
    // 确保输出目录存在
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  return { success: true, path: filePath };
});