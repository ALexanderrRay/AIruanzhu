const axios = require('axios');

/**
 * 使用AI分析技术文档，提取软著申请信息
 * @param {string} content - 文档内容
 * @returns {Promise<Object>} 包含主表和待确认表的分析结果
 */
async function analyzeDocumentWithAI(content) {
  
  // 在函数开头添加环境变量检查
  if (!process.env.AI_SERVICE_URL || !process.env.API_KEY) {
    throw new Error('缺少AI服务配置，请检查.env文件是否已正确设置');
  }
  
  try {
    // 构建系统提示词，指导AI如何分析文档
    const systemPrompt = `你是一个专门分析技术文档提取软件著作权申请信息的AI助手。请分析用户提供的技术文档，提取以下信息：
    
1. 软件全称
2. 简称（如有）
3. 版本号（如未提及则使用默认值"v1.0"）
4. 开发语言/工具
5. 运行环境/系统要求
6. 硬件环境（如有）
7. 主要功能/用途
8. 技术特点
9. 开发者/公司名称
10. 著作权人（如未提及则默认与开发者相同）

请将提取到的信息组织成JSON格式返回，包含两个部分：
- "mainTable": 包含所有要求的信息，其中未提取到的信息，如果有默认值则返回默认值，没有默认值的返回null（字段名使用中文）
- "confirmationTable": 仅包含需要用户确认（默认值）或补充（null）的信息。

对于不确定或文档中未明确提及的信息，请在confirmationTable中标注为"待确认"或使用合理的默认值。`;

    // 构建API请求
    const response = await axios.post(
      process.env.AI_SERVICE_URL,
      {
        model: "deepseek-chat", // 使用deepseek-chat模型
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `请分析以下技术文档：\n\n${content}`
          }
        ],
        temperature: 0.3, // 较低的温度值以提高确定性
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 提取AI的回复
    const aiResponse = response.data.choices[0].message.content;
    
    // 尝试解析AI返回的JSON（AI可能会返回JSON格式的文本）
    try {
      return JSON.parse(aiResponse);
    } catch (e) {
      // 如果AI没有返回标准JSON，则返回原始文本
      console.warn('AI返回的不是标准JSON格式，返回原始文本');
      return {
        rawResponse: aiResponse,
        mainTable: {},
        confirmationTable: {}
      };
    }
  } catch (error) {
    console.error('AI分析错误:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('API响应错误:', error.response.status, error.response.data);
      throw new Error(`AI服务错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('API请求错误:', error.request);
      throw new Error('无法连接到AI服务，请检查网络连接和API配置');
    } else {
      throw new Error('AI分析失败: ' + error.message);
    }
  }
}

module.exports = {
  analyzeDocumentWithAI
};