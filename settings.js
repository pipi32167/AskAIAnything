// 设置页面逻辑
let i18nInstance;

document.addEventListener('DOMContentLoaded', async () => {
  i18nInstance = await initI18n();
  loadSettings();
  setupEventListeners();
});

// 预设配置
const presets = {
  openai: {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'gpt-3.5-turbo',
    maxTokens: 500
  },
  azure: {
    apiEndpoint: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15',
    apiModel: 'gpt-35-turbo',
    maxTokens: 500
  },
  zhipu: {
    apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiModel: 'glm-4',
    maxTokens: 500
  },
  tongyi: {
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiModel: 'qwen-turbo',
    maxTokens: 500
  }
};

// 设置事件监听器
function setupEventListeners() {
  // 表单提交
  document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);

  // 测试连接
  document.getElementById('testConnection').addEventListener('click', handleTestConnection);

  // 重置设置
  document.getElementById('resetSettings').addEventListener('click', handleResetSettings);

  // 切换密钥可见性
  document.getElementById('toggleKeyVisibility').addEventListener('click', toggleKeyVisibility);

  // 模型选择
  document.getElementById('apiModel').addEventListener('change', handleModelChange);

  // 预设按钮
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = e.currentTarget.dataset.preset;
      applyPreset(preset);
    });
  });

  // 语言切换
  document.getElementById('language').addEventListener('change', handleLanguageChange);
}

// 加载已保存的设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'apiEndpoint',
      'apiKey',
      'apiModel',
      'maxTokens',
      'systemPrompt',
      'userPromptTemplate',
      'language'
    ]);

    if (settings.apiEndpoint) {
      document.getElementById('apiEndpoint').value = settings.apiEndpoint;
    }
    if (settings.apiKey) {
      document.getElementById('apiKey').value = settings.apiKey;
    }
    if (settings.apiModel) {
      const modelSelect = document.getElementById('apiModel');
      const option = Array.from(modelSelect.options).find(opt => opt.value === settings.apiModel);

      if (option) {
        modelSelect.value = settings.apiModel;
      } else {
        // 自定义模型
        modelSelect.value = 'custom';
        document.getElementById('customModel').style.display = 'block';
        document.getElementById('customModel').value = settings.apiModel;
      }
    }
    if (settings.maxTokens) {
      document.getElementById('maxTokens').value = settings.maxTokens;
    }
    if (settings.systemPrompt) {
      document.getElementById('systemPrompt').value = settings.systemPrompt;
    }
    if (settings.userPromptTemplate) {
      document.getElementById('userPromptTemplate').value = settings.userPromptTemplate;
    }
    if (settings.language) {
      document.getElementById('language').value = settings.language;
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    showStatus('加载设置失败', 'error');
  }
}

// 保存设置
async function handleSaveSettings(e) {
  e.preventDefault();

  const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  let apiModel = document.getElementById('apiModel').value;
  const maxTokens = parseInt(document.getElementById('maxTokens').value);
  const systemPrompt = document.getElementById('systemPrompt').value.trim();
  const userPromptTemplate = document.getElementById('userPromptTemplate').value.trim();

  // 如果选择了自定义模型
  if (apiModel === 'custom') {
    apiModel = document.getElementById('customModel').value.trim();
    if (!apiModel) {
      showStatus('请输入自定义模型名称', 'error');
      return;
    }
  }

  // 验证输入
  if (!apiEndpoint || !apiKey || !apiModel) {
    showStatus('请填写所有必填字段', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({
      apiEndpoint,
      apiKey,
      apiModel,
      maxTokens,
      systemPrompt,
      userPromptTemplate
    });

    showStatus('✅ 配置保存成功！', 'success');
  } catch (error) {
    console.error('保存设置失败:', error);
    showStatus('❌ 保存失败: ' + error.message, 'error');
  }
}

// 测试连接
async function handleTestConnection() {
  const btn = document.getElementById('testConnection');
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = '🔄 测试中...';

  try {
    const settings = await chrome.storage.sync.get([
      'apiEndpoint',
      'apiKey',
      'apiModel',
      'maxTokens'
    ]);

    if (!settings.apiKey || !settings.apiEndpoint) {
      showStatus('❌ 请先保存配置后再测试', 'error');
      return;
    }

    // 发送测试请求
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.apiModel || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hi, this is a test message.'
          }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      showStatus('✅ 连接成功！API配置正确。', 'success');
    } else {
      const errorData = await response.json().catch(() => ({}));
      showStatus(`❌ 连接失败: ${response.status} - ${errorData.error?.message || response.statusText}`, 'error');
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    showStatus('❌ 测试失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// 重置设置
async function handleResetSettings() {
  if (!confirm('确定要恢复默认设置吗？这将清除所有已保存的配置。')) {
    return;
  }

  try {
    await chrome.storage.sync.clear();

    // 应用默认预设
    applyPreset('openai');

    showStatus('✅ 已恢复默认设置', 'success');
  } catch (error) {
    console.error('重置设置失败:', error);
    showStatus('❌ 重置失败: ' + error.message, 'error');
  }
}

// 切换密钥可见性
function toggleKeyVisibility() {
  const input = document.getElementById('apiKey');
  const btn = document.getElementById('toggleKeyVisibility');

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.title = '隐藏密钥';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.title = '显示密钥';
  }
}

// 处理模型选择变化
function handleModelChange(e) {
  const customModelInput = document.getElementById('customModel');

  if (e.target.value === 'custom') {
    customModelInput.style.display = 'block';
    customModelInput.required = true;
  } else {
    customModelInput.style.display = 'none';
    customModelInput.required = false;
  }
}

// 处理语言切换
async function handleLanguageChange(e) {
  const newLang = e.target.value;
  await i18nInstance.switchLanguage(newLang);
  // 重新加载页面以应用新语言
  window.location.reload();
}

// 应用预设配置
function applyPreset(presetName) {
  const preset = presets[presetName];

  if (!preset) {
    showStatus('❌ 未知的预设配置', 'error');
    return;
  }

  document.getElementById('apiEndpoint').value = preset.apiEndpoint;

  const modelSelect = document.getElementById('apiModel');
  const option = Array.from(modelSelect.options).find(opt => opt.value === preset.apiModel);

  if (option) {
    modelSelect.value = preset.apiModel;
    document.getElementById('customModel').style.display = 'none';
  } else {
    modelSelect.value = 'custom';
    document.getElementById('customModel').style.display = 'block';
    document.getElementById('customModel').value = preset.apiModel;
  }

  document.getElementById('maxTokens').value = preset.maxTokens;

  showStatus(`✅ 已应用 ${presetName.toUpperCase()} 预设配置，请填写API密钥并保存`, 'info');

  // 聚焦到API密钥输入框
  document.getElementById('apiKey').focus();
}

// 显示状态消息
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = 'block';

  // 3秒后自动隐藏（成功消息）
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}
