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
    let html = `
        <h2>请确认以下信息</h2>
        <form id="reviewForm">
            <table border="1" cellpadding="5">
                <tr><th>字段</th><th>值</th></tr>
    `;
    Object.entries(data).forEach(([key, value]) => {
        // 处理默认值：如果值为null或空，且字段是version，设置默认值"v1.0"
        let displayValue = value;
        if (value === null || value === '') {
            if (key === 'version') {
                displayValue = 'v1.0';
            } else {
                displayValue = '';
            }
        }
        html += `
            <tr>
                <td>${key}</td>
                <td><input type="text" id="${key}" value="${displayValue}" /></td>
            </tr>
        `;
    });
    html += `</table></form>`;
    document.getElementById('infoReview').innerHTML = html;
    document.getElementById('generateBtn').disabled = false;
}

//用于从表单中收集用户输入的数据
function collectFormData() {
    const form = document.getElementById('reviewForm');
    const inputs = form.querySelectorAll('input');
    const data = {};
    inputs.forEach(input => {
        data[input.id] = input.value;
    });
    return data;
}

//在用户界面上显示完整的主表
function displayMainTable(data) {
    let html = `<h2>生成的主表</h2><table border="1" cellpadding="5"><tr><th>字段</th><th>值</th></tr>`;
    Object.entries(data).forEach(([key, value]) => {
        html += `<tr><td>${key}</td><td>${value}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('infoReview').innerHTML = html;
}

// 生成文档函数
async function generateDocuments() {
    // 显示生成中状态
    setLoadingState(true);

try {
    // 收集确认后的数据
    const formData = collectFormData();
    displayMainTable(formData);// 显示主表
        // 后续可以在这里添加保存到Word的逻辑，但暂时不处理
        alert('生成完成！主表已显示。');
    } catch (error) {
        alert('生成失败：' + error.message);
    } finally {
        setLoadingState(false);
    }
}


// 编辑字段函数（示例）
function editField(fieldName) {
    const newValue = prompt(`请输入新的 ${fieldName} 值：`);
    if (newValue !== null) {
        // 实际开发中更新数据模型
        alert(`已将 ${fieldName} 修改为：${newValue}`);
    }
}