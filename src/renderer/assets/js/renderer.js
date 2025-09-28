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

      // 检查文件类型
    const allowedExtensions = ['.docx', '.txt', '.md'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  
    if (!allowedExtensions.includes(fileExt)) {
        alert('请选择.docx或.txt格式的文件');
        event.target.value = ''; // 清空文件选择
        return;
    }
    
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


// 修改showReviewForm函数 0927 19:47
function showReviewForm(data) {
    // 确保数据结构正确
    const mainTable = data.mainTable || {};
    const confirmationTable = data.confirmationTable || {};
    
    let html = `
        <h2>请确认以下信息</h2>
        <div class="tabs">
            <button class="tab-btn active" onclick="showTab('mainTab')">已提取信息</button>
            <button class="tab-btn" onclick="showTab('confirmTab')">待确认信息</button>
        </div>
        
        <div id="mainTab" class="tab-content active">
            <h3>已提取的信息</h3>
            <table border="1" cellpadding="5">
                <tr><th>字段</th><th>值</th><th>状态</th></tr>
    `;
    
    // 显示主表信息（已确认的）
    Object.entries(mainTable).forEach(([key, value]) => {
        if (value !== null && value !== '') {
            html += `
                <tr>
                    <td>${key}</td>
                    <td>${value}</td>
                    <td>✅ 已确认</td>
                </tr>
            `;
        }
    });
    
    html += `</table></div>
        <div id="confirmTab" class="tab-content">
            <h3>请确认或补充以下信息</h3>
            <form id="reviewForm">
            <table border="1" cellpadding="5">
                <tr><th>字段</th><th>当前值/建议值</th><th>请输入确认值</th></tr>
    `;
    
    // 显示待确认表信息
    Object.entries(confirmationTable).forEach(([key, value]) => {
        const defaultValue = value === null ? '' : value;
        html += `
            <tr>
                <td>${key}</td>
                <td>${defaultValue || '（需补充）'}</td>
                <td><input type="text" id="confirm_${key}" value="${defaultValue}" /></td>
            </tr>
        `;
    });
    
    html += `</table></form></div>`;
    document.getElementById('infoReview').innerHTML = html;
    document.getElementById('generateBtn').disabled = false;
    
    // 存储主表数据供后续使用
    window.mainTableData = mainTable;
}

// 添加标签切换功能 0927 19:47
function showTab(tabId) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 取消所有标签按钮的激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签
    document.getElementById(tabId).classList.add('active');
    
    // 激活对应的按钮
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

//用于从表单中收集用户输入的数据
function collectFormData() {
    const form = document.getElementById('reviewForm');
    const inputs = form.querySelectorAll('input');
    const confirmedData = {};
    
    inputs.forEach(input => {
        const fieldName = input.id.replace('confirm_', '');
        confirmedData[fieldName] = input.value;
    });
    
    return confirmedData;
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
  setLoadingState(true);
  try {
    // 收集确认后的数据
    const confirmedData = collectFormData();
    // 合并到主表
    const finalData = {
      ...window.mainTableData,
      ...confirmedData
    };
    
    // 调用主进程生成文档
    const result = await window.electronAPI.generateDocument(finalData);
    if (result.success) {
      alert(`生成成功！文档已保存到: ${result.path}`);
      displayMainTable(finalData);
    } else {
      alert('生成失败: ' + result.error);
    }
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