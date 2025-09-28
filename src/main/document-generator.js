const { createReport } = require('docx-templates');
const fs = require('fs').promises;
const path = require('path');

// 定义模板和输出目录的路径
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const OUTPUT_DIR = path.join(__dirname, '../../output');

/**
 * 加载模板文件并返回Buffer
 * @param {string} templateFileName - 模板文件名（如 '软件著作权申请表-模板.docx'）
 * @returns {Promise<Buffer>} - 模板文件的Buffer
 */
async function loadTemplate(templateFileName) {
  const templatePath = path.join(TEMPLATES_DIR, templateFileName);
  try {
    const buffer = await fs.readFile(templatePath);
    console.log('模板文件加载成功:', templatePath);
    return buffer;
  } catch (error) {
    console.error('加载模板文件失败:', error);
    throw new Error(`无法加载模板文件: ${error.message}`);
  }
}

/**
 * 生成软著申请表文档
 * @param {Buffer} templateBuffer - 模板文件的Buffer
 * @param {Object} data - 包含所有字段数据的对象，键名与模板占位符匹配（如软件全称、版本号等）
 * @returns {Promise<Buffer>} - 生成的.docx文件的Buffer
 */
async function generateCopyrightApplication(templateBuffer, data) {
  try {
    // 将数据写入调试文件
    const debugDir = path.join(__dirname, '../../debug');
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(
      path.join(debugDir, `data_debug_${Date.now()}.json`),
      JSON.stringify(data, null, 2)
    );
    console.log('数据已保存到调试文件');

    // 使用自定义分隔符 << 和 >>
    const generatedDocBuffer = await createReport({
      template: templateBuffer,
      data: data,
      cmdDelimiter: ['<<', '>>'] // 修改分隔符为 << 和 >>
    });
    
    console.log('软著申请表生成成功！');
    return generatedDocBuffer;
  } catch (error) {
    console.error('生成文档时发生错误:', error);
    throw new Error(`无法生成文档: ${error.message}`);
  }
}

/**
 * 保存生成的文档到文件系统
 * @param {Buffer} docBuffer - 生成的.docx文件的Buffer
 * @param {Object} data - 包含所有字段数据的对象
 * @returns {Promise<string>} - 返回保存的文件路径
 */
async function saveGeneratedDocument(docBuffer, data) {
  try {
    // 确保输出目录存在
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // 从数据对象中提取"软件全称"，如果不存在则使用默认值
    const softwareName = data['软件全称'] || '未知软件';
    const outputFileName = `软件著作权申请表（${softwareName}）.docx`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    
    // 保存文件
    await fs.writeFile(outputPath, docBuffer);
    console.log('文档已保存到:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('保存文档失败:', error);
    throw new Error(`无法保存文档: ${error.message}`);
  }
}

/**
 * 生成软件操作说明书文档
 * @param {Object} data - 包含软件基本信息和说明书内容的对象
 * @returns {Promise<Buffer>} - 生成的.docx文件的Buffer
 */
async function generateSoftwareManual(data) {
  try {
    // 加载说明书模板
    const templateBuffer = await loadTemplate('软件操作说明书-模板.docx');
    
    // 准备说明书数据
    const manualData = {
      软件名称: data['软件全称'] || '未知软件',
      版本号: data['版本号'] || 'v1.0',
      开发完成日期: data['开发完成日期'] || new Date().toLocaleDateString('zh-CN'),
      说明书内容: data.manualContent || '暂无说明书内容'
    };
    
    // 使用自定义分隔符 << 和 >>
    const generatedDocBuffer = await createReport({
      template: templateBuffer,
      data: manualData,
      cmdDelimiter: ['<<', '>>']
    });
    
    console.log('软件操作说明书生成成功！');
    return generatedDocBuffer;
  } catch (error) {
    console.error('生成说明书文档时发生错误:', error);
    throw new Error(`无法生成说明书文档: ${error.message}`);
  }
}

/**
 * 保存生成的说明书文档
 * @param {Buffer} docBuffer - 生成的.docx文件的Buffer
 * @param {Object} data - 包含软件信息的对象
 * @returns {Promise<string>} - 返回保存的文件路径
 */
async function saveGeneratedManual(docBuffer, data) {
  try {
    // 确保输出目录存在
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // 从数据对象中提取"软件全称"，如果不存在则使用默认值
    const softwareName = data['软件全称'] || '未知软件';
    const outputFileName = `软件操作说明书（${softwareName}）.docx`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    
    // 保存文件
    await fs.writeFile(outputPath, docBuffer);
    console.log('说明书文档已保存到:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('保存说明书文档失败:', error);
    throw new Error(`无法保存说明书文档: ${error.message}`);
  }
}

// 导出函数供主进程使用
module.exports = {
  loadTemplate,
  generateCopyrightApplication,
  saveGeneratedDocument,
  generateSoftwareManual,
  saveGeneratedManual
};