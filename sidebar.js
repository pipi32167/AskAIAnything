// 侧边栏逻辑
let currentText = '';
let history = [];
let i18nInstance;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  i18nInstance = await initI18n();
  updateUILanguage();
  loadHistory();
  setupEventListeners();
});

// 更新UI语言
function updateUILanguage() {
  document.getElementById('sidebarTitle').textContent = i18nInstance.t('sidebar.title');
  document.getElementById('openSettings').title = i18nInstance.t('sidebar.settings');
  document.getElementById('selectedTextLabel').textContent = i18nInstance.t('sidebar.selectedText');
  document.getElementById('explanationLabel').textContent = i18nInstance.t('sidebar.aiExplanation');
  document.getElementById('loadingText').textContent = i18nInstance.t('sidebar.analyzing');
  document.getElementById('historyTitle').textContent = i18nInstance.t('sidebar.history');
  document.getElementById('clearAllText').textContent = i18nInstance.t('sidebar.clearAll').replace('🗑️ ', '');
  document.getElementById('clearAllHistory').title = i18nInstance.t('sidebar.clearAllConfirm');
}

// 设置事件监听
function setupEventListeners() {
  // 关闭按钮
  document.getElementById('closeSidebar').addEventListener('click', () => {
    window.parent.postMessage({ action: 'closeSidebar' }, '*');
  });

  // 设置按钮
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSettings' });
  });

  // 清空所有历史记录按钮
  document.getElementById('clearAllHistory').addEventListener('click', clearAllHistory);

  // 接收来自content script的消息
  window.addEventListener('message', (event) => {
    if (event.data.action === 'explainText') {
      handleExplainRequest(event.data.text);
    }
  });
}

// 处理解释请求
async function handleExplainRequest(text) {
  currentText = text;
  document.getElementById('currentSelectedText').textContent = text;
  document.getElementById('currentExplanation').innerHTML = `<div class="loading">${i18nInstance.t('sidebar.analyzing')}</div>`;

  try {
    // 调用AI API - 这里使用OpenAI API作为示例
    // 你需要替换成你自己的API密钥和端点
    const explanation = await callAI(text);

    // 显示解释
    document.getElementById('currentExplanation').textContent = explanation;

    // 保存到历史记录
    addToHistory(text, explanation);
  } catch (error) {
    document.getElementById('currentExplanation').innerHTML =
      `<div class="error">${i18nInstance.t('sidebar.error')} ${error.message}</div>`;
  }
}

// 调用AI API
async function callAI(text) {
  // 从storage获取API配置
  const config = await chrome.storage.sync.get([
    'apiKey',
    'apiEndpoint',
    'apiModel',
    'maxTokens',
    'systemPrompt',
    'userPromptTemplate'
  ]);

  // 如果没有配置，返回示例说明
  if (!config.apiKey) {
    return i18nInstance.t('sidebar.configRequired', { text });
  }

  // 使用自定义提示词或默认提示词
  const systemPrompt = config.systemPrompt || '你是一个专业的语言助手，擅长解释文字的含义、上下文和用法。请用简洁清晰的中文回答。';

  const userPromptTemplate = config.userPromptTemplate || '请解释以下文字的含义：\n\n{text}';
  const userPrompt = userPromptTemplate.replace('{text}', text);

  // 调用API
  const response = await fetch(config.apiEndpoint || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.apiModel || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: config.maxTokens || 500
    })
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 添加到历史记录
function addToHistory(text, explanation) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const historyItem = {
    text,
    explanation,
    timestamp
  };

  history.unshift(historyItem); // 添加到开头

  // 限制历史记录数量
  if (history.length > 20) {
    history = history.slice(0, 20);
  }

  // 保存到storage
  chrome.storage.local.set({ history });

  // 更新UI
  renderHistory();
}

// 加载历史记录
async function loadHistory() {
  const data = await chrome.storage.local.get(['history']);
  if (data.history) {
    history = data.history;
    renderHistory();
  }
}

// 渲染历史记录
function renderHistory() {
  const container = document.getElementById('historyAccordion');
  container.innerHTML = '';

  if (history.length === 0) {
    container.innerHTML = `<div class="no-history">${i18nInstance.t('sidebar.noHistory')}</div>`;
    return;
  }

  history.forEach((item, index) => {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    const header = document.createElement('div');
    header.className = 'accordion-header';

    const headerText = document.createElement('span');
    headerText.className = 'accordion-header-text';
    headerText.textContent = item.text.length > 30
      ? item.text.substring(0, 30) + '...'
      : item.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-history-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除此记录';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发accordion展开
      deleteHistoryItem(index);
    });

    header.appendChild(headerText);
    header.appendChild(deleteBtn);

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.innerHTML = `
      <div class="history-timestamp">${item.timestamp}</div>
      <div class="history-text"><strong>文字：</strong>${item.text}</div>
      <div class="history-explanation"><strong>解释：</strong>${item.explanation}</div>
    `;

    header.addEventListener('click', () => {
      const isOpen = accordionItem.classList.contains('open');
      // 关闭所有其他项
      document.querySelectorAll('.accordion-item').forEach(el => {
        el.classList.remove('open');
      });
      // 切换当前项
      if (!isOpen) {
        accordionItem.classList.add('open');
      }
    });

    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    container.appendChild(accordionItem);
  });
}

// 删除单个历史记录
function deleteHistoryItem(index) {
  if (confirm(i18nInstance.t('sidebar.deleteConfirm'))) {
    history.splice(index, 1);
    chrome.storage.local.set({ history });
    renderHistory();
  }
}

// 清空所有历史记录
function clearAllHistory() {
  if (confirm(i18nInstance.t('sidebar.clearAllConfirm'))) {
    history = [];
    chrome.storage.local.set({ history });
    renderHistory();
  }
}
