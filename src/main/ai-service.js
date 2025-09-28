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
2. 简称（如有,默认无）
3. 版本号（如未提及则使用默认值"v1.0"）
4. 开发完成日期（以20xx年x月x日形式输出）
5. 著作权人名称（如未提及则默认与开发者相同）
6. 著作权人性质（默认“国企”）
7. 著作权人地址
8. 开发的硬件环境（默认“PC机”）
9. 运行的硬件环境（默认“要求64位CPU；内存8GB以上；硬盘至少100GB。”）
10. 开发该软件的操作系统（默认“Windows10”）
11. 软件开发环境
12. 软件运行平台（默认“运行在Windows 10 以上的环境”）
13. 软件运行支撑环境（默认“无”）
14. 编程语言
15. 开发目的（限制在50字以内）
16. 面向领域（限制在50字以内）
17. 主要功能（限制在200字以内）
18. 技术特点（限制在100字以内）

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
    
    // 尝试从AI响应中提取JSON部分（使用正则表达式匹配花括号内的内容）
    try {
      // 使用正则表达式提取可能的JSON对象
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        return JSON.parse(jsonString);
      } else {
        throw new Error('响应中没有找到JSON对象');
      }
    } catch (e) {
      console.warn('无法从AI响应中提取JSON，尝试直接解析整个响应:', e);
      // 如果提取失败，尝试直接解析整个响应（假设它是纯JSON）
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        console.warn('直接解析也失败，返回原始文本');
        return {
          rawResponse: aiResponse,
          mainTable: {},
          confirmationTable: {}
        };
      }
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

/**
 * 使用AI生成软件操作说明书
 * @param {string} content - 技术文档内容
 * @param {Object} softwareInfo - 软件基本信息（从主表中获取）
 * @returns {Promise<Object>} 包含说明书内容的分析结果
 */
async function generateManualWithAI(content, softwareInfo) {
  // 环境变量检查
  if (!process.env.AI_SERVICE_URL || !process.env.API_KEY) {
    throw new Error('缺少AI服务配置，请检查.env文件是否已正确设置');
  }
  
  try {
    // 构建系统提示词，指导AI如何生成说明书
    const systemPrompt = `你是一个专门编写软件操作说明书的AI助手。请根据用户提供的技术文档和软件信息，生成一篇专业、清晰的软件操作说明书。

要求：
1. 说明书应包含以下章节：
   - 软件简介
   - 运行环境要求
   - 安装与部署
   - 主要功能说明
   - 操作步骤详解
   - 常见问题解答

2. 使用专业的技术文档写作风格
3. 语言简洁明了，步骤清晰
4. 适当使用标题层级（一级标题、二级标题等）
5. 重要操作步骤可以加粗强调

请将生成的说明书内容以纯文本格式返回，保持章节结构清晰。`;

    // 构建用户提示词，包含技术文档和软件信息
    const userPrompt = `请为以下软件生成操作说明书：

软件名称: ${softwareInfo['软件全称'] || '未知软件'}
版本号: ${softwareInfo['版本号'] || 'v1.0'}
开发语言: ${softwareInfo['编程语言'] || '未指定'}

以下是技术文档内容：
${content}`;

    // 构建API请求
    const response = await axios.post(
      process.env.AI_SERVICE_URL,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.5, // 适中的温度值以平衡创造性和准确性
        max_tokens: 4000  // 增加token限制以容纳更长的说明书
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
    
    return {
      success: true,
      manualContent: aiResponse
    };
  } catch (error) {
    console.error('生成说明书失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('API响应错误:', error.response.status, error.response.data);
      throw new Error(`AI服务错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('API请求错误:', error.request);
      throw new Error('无法连接到AI服务，请检查网络连接和API配置');
    } else {
      throw new Error('生成说明书失败: ' + error.message);
    }
  }
}

module.exports = {
  analyzeDocumentWithAI,
  generateManualWithAI
};