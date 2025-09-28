const { app, BrowserWindow, ipcMain } = require('electron');
const { extractTextFromDocx, extractTextFromDocxFromBuffer, isDocxFile } = require('./docx-processor');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');
require('dotenv').config(); // 加载环境变量
const DEBUG_MODE = true; // 调试模式开关，调试阶段设为true，完成后改为false

// 导入API处理模块
const { analyzeDocumentWithAI } = require('./ai-service');
const { generateManualWithAI } = require('./ai-service');

// 创建窗口函数
function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
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

// 处理文档分析请求 修改0927 20：49：现在接受文件内容和文件名
ipcMain.handle('analyze-document', async (event, fileContent, fileName) => {
  try {
    let extractedText;
    const ext = path.extname(fileName).toLowerCase();
    
    // 根据文件类型处理内容
    if (ext === '.docx') {
      // fileContent 应该是 Buffer（从ArrayBuffer转换而来）
      extractedText = await extractTextFromDocxFromBuffer(fileContent);
    } else if (ext === '.txt' || ext === '.md') {
      // fileContent 已经是字符串
      extractedText = fileContent;
    } else {
      throw new Error(`不支持的文件格式: ${ext}. 请使用.docx或.txt文件`);
    }
    
    // 检查内容是否为空
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('文件内容为空或无法读取');
    }
    
    console.log('成功读取文件内容，字符数:', extractedText.length);
    
    // 调用AI服务分析文档
    const result = await analyzeDocumentWithAI(extractedText);
    
    // 调试模式：保存原始响应
    if (DEBUG_MODE) {
      const debugDir = path.join(__dirname, '../../debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      const debugData = {
        timestamp: new Date().toISOString(),
        originalContent: extractedText, // 使用提取后的文本
        aiResponse: result
      };
      fs.writeFileSync(
        path.join(debugDir, `debug_${Date.now()}.json`),
        JSON.stringify(debugData, null, 2)
      );
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('文档分析失败:', error);
    return { success: false, error: error.message };
  }
});

// 导入 document-generator 模块
const { 
  loadTemplate, 
  generateCopyrightApplication, 
  saveGeneratedDocument,
  generateSoftwareManual,   
  saveGeneratedManual       
} = require('./document-generator');

// 添加新的 IPC 处理程序 for generate-document
ipcMain.handle('generate-document', async (event, finalData) => {
  try {
    // 加载模板文件（模板文件名为 '软件著作权申请表-模板.docx'）
    const templateBuffer = await loadTemplate('软件著作权申请表-模板.docx');
    // 生成文档
    const docBuffer = await generateCopyrightApplication(templateBuffer, finalData);
    // 保存文档，传递 finalData 对象以提取软件名称
    const filePath = await saveGeneratedDocument(docBuffer, finalData);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('生成文档失败:', error);
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

// 生成完成后点击打开文件路径
ipcMain.handle('open-file-location', async (event, filePath) => {
  try {
    // 确保文件存在
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在: ' + filePath);
    }
    
    // 打开文件所在文件夹并选中文件
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开文件位置失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理打开文件夹请求
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    // 确保路径存在
    if (!fs.existsSync(folderPath)) {
      throw new Error('文件夹不存在: ' + folderPath);
    }
    
    // 使用 shell 打开文件夹
    shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('打开文件夹失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理最终主表保存请求（用于调试）
ipcMain.handle('save-final-main-table', async (event, finalMainTable) => {
  try {
    // 调试模式：保存最终主表
    if (DEBUG_MODE) {
      const debugDir = path.join(__dirname, '../../debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      
      const debugData = {
        timestamp: new Date().toISOString(),
        finalMainTable: finalMainTable
      };
      
      fs.writeFileSync(
        path.join(debugDir, `final_main_table_${Date.now()}.json`),
        JSON.stringify(debugData, null, 2)
      );
      
      console.log('最终主表已保存用于调试');
    }

    return { success: true };
  } catch (error) {
    console.error('保存最终主表失败:', error);
    return { success: false, error: error.message };
  }
});

// 生成说明书的IPC处理程序
ipcMain.handle('generate-manual', async (event, { content, softwareInfo }) => {
  try {
    const result = await generateManualWithAI(content, softwareInfo);
    
    // 调试模式：保存生成的说明书内容
    if (DEBUG_MODE) {
      const debugDir = path.join(__dirname, '../../debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      const debugData = {
        timestamp: new Date().toISOString(),
        softwareInfo: softwareInfo,
        manualContent: result.manualContent
      };
      fs.writeFileSync(
        path.join(debugDir, `manual_debug_${Date.now()}.json`),
        JSON.stringify(debugData, null, 2)
      );
    }

    return result;
  } catch (error) {
    console.error('生成说明书失败:', error);
    return { success: false, error: error.message };
  }
});

// 添加生成完整文档集的IPC处理程序
ipcMain.handle('generate-all-documents', async (event, { finalData, originalContent }) => {
  try {
    const results = {
      applicationTable: null,
      manual: null
    };
    
    // 1. 生成软著申请表
    const templateBuffer = await loadTemplate('软件著作权申请表-模板.docx');
    const appDocBuffer = await generateCopyrightApplication(templateBuffer, finalData);
    results.applicationTable = await saveGeneratedDocument(appDocBuffer, finalData);
    
    // 2. 生成软件说明书
    const manualResult = await generateManualWithAI(originalContent, finalData);
    if (manualResult.success) {
      const manualData = {
        ...finalData,
        manualContent: manualResult.manualContent
      };
      const manualBuffer = await generateSoftwareManual(manualData);
      results.manual = await saveGeneratedManual(manualBuffer, finalData);
    } else {
      throw new Error(manualResult.error);
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('生成完整文档集失败:', error);
    return { success: false, error: error.message };
  }
});

