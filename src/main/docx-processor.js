const mammoth = require('mammoth');

/**
 * 从.docx文件中提取纯文本内容
 * @param {string} filePath - .docx文件的路径
 * @returns {Promise<string>} 提取的纯文本内容
 */
async function extractTextFromDocx(filePath) {
  try {
    console.log('正在提取.docx文件内容:', filePath);
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const messages = result.messages;
    if (messages && messages.length > 0) {
      console.warn('文档提取警告:', messages);
    }
    console.log('文本提取成功，字符数:', text.length);
    return text;
  } catch (error) {
    console.error('提取.docx文件内容失败:', error);
    throw new Error(`无法读取.docx文件: ${error.message}`);
  }
}

/**
 * 从Buffer中提取.docx文件的文本内容
 * @param {Buffer} buffer - .docx文件的Buffer内容
 * @returns {Promise<string>} 提取的纯文本内容
 */
async function extractTextFromDocxFromBuffer(buffer) {
  try {
    console.log('正在从Buffer提取.docx内容');
    const result = await mammoth.extractRawText({ buffer: buffer });
    const text = result.value;
    const messages = result.messages;
    if (messages && messages.length > 0) {
      console.warn('文档提取警告:', messages);
    }
    console.log('文本提取成功，字符数:', text.length);
    return text;
  } catch (error) {
    console.error('提取.docx内容失败:', error);
    throw new Error(`无法处理.docx文件: ${error.message}`);
  }
}

/**
 * 检查文件扩展名是否为.docx
 * @param {string} filename - 文件名
 * @returns {boolean} 是否是.docx文件
 */
function isDocxFile(filename) {
  return filename.toLowerCase().endsWith('.docx');
}

module.exports = {
  extractTextFromDocx,
  extractTextFromDocxFromBuffer, // 导出新函数
  isDocxFile
};