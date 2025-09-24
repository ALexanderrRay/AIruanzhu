// 文件上传处理
document.getElementById('fileInput').addEventListener('change', handleFileSelect);

// 生成按钮事件监听
document.getElementById('generateBtn').addEventListener('click', generateDocuments);

// 显示/隐藏加载动画
function setLoadingState(loading) {
  const spinner = document.getElementById('loadingSpinner');
  const generateBtn = document.getElementById('generateBtn');
  
  if (loading) {
    spinner.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = '处理中...';
  } else {
    spinner.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.textContent = '生成软著材料';
  }
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 显示加载状态
    setLoadingState(true);
    document.getElementById('infoReview').innerHTML = '<p>正在分析文档...</p>';

    // TODO: 这里后续调用AI解析文档
    // 模拟解析结果（实际开发时替换为AI接口调用）
    /*setTimeout(() => {
        const mockData = {
            softwareName: "智能文档分析系统",
            version: "v1.0",
            developer: "XX科技有限公司"
        };
        showReviewForm(mockData);
    }, 1500);*/

    try {
    // 调用主进程分析文档
    const result = await window.electronAPI.analyzeDocument(file.path);
    
    if (result.success) {
      showReviewForm(result.data);
    } else {
      alert('文档分析失败: ' + result.error);
    }
  } catch (error) {
    console.error('处理文件时出错:', error);
    alert('处理文件时出错: ' + error.message);
  } finally {
    setLoadingState(false);
  }
}


function showReviewForm(data) {
    let html = `nom
        <h2>请确认以下信息</h2>
        <table border="1" cellpadding="5">
            <tr><th>字段</th><th>值</th><th>操作</th></tr>
    `;

    Object.entries(data).forEach(([key, value]) => {
        html += `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
                <td><button onclick="editField('${key}')">修改</button></td>
            </tr>
        `;
    });

    html += `</table>`;
    document.getElementById('infoReview').innerHTML = html;
    document.getElementById('generateBtn').disabled = false;
}
// 生成文档函数
async function generateDocuments() {
    // 显示生成中状态
    setLoadingState(true);
    //document.getElementById('generateBtn').textContent = '生成中...';
    //document.getElementById('generateBtn').disabled = true;

try {
    // 收集确认后的数据
    const formData = collectFormData();
    
    // 调用主进程生成并保存文档
    const result = await window.electronAPI.saveDocument({
      content: "这是生成的软著文档内容", // 实际开发时替换为AI生成的内容
      filename: "软著说明书.docx"
    });
    
    if (result.success) {
      alert(`文档已保存到：${result.path}`);
    } else {
      alert('保存失败：' + result.error);
    }
  } catch (error) {
    alert('生成失败：' + error.message);
  } finally {
    setLoadingState(false);
  }
}

function collectFormData() {
  // 实际开发中实现从表单收集数据的逻辑
  return {
    softwareName: "智能文档分析系统",
    version: "v1.0",
    developer: "XX科技有限公司"
  };
}

// 编辑字段函数（示例）
function editField(fieldName) {
    const newValue = prompt(`请输入新的 ${fieldName} 值：`);
    if (newValue !== null) {
        // 实际开发中更新数据模型
        alert(`已将 ${fieldName} 修改为：${newValue}`);
    }
}