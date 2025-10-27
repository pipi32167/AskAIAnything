// 设置页面逻辑
let i18nInstance;
let prompts = [];

document.addEventListener("DOMContentLoaded", async () => {
  i18nInstance = await initI18n();
  loadSettings();
  await loadPrompts();
  setupEventListeners();
  renderPrompts();
  updateUILanguage();
});

// 预设配置
const presets = {
  openai: {
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    apiModel: "gpt-3.5-turbo",
    maxTokens: 500,
  },
  azure: {
    apiEndpoint:
      "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15",
    apiModel: "gpt-35-turbo",
    maxTokens: 500,
  },
  zhipu: {
    apiEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiModel: "glm-4",
    maxTokens: 500,
  },
  tongyi: {
    apiEndpoint:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    apiModel: "qwen-turbo",
    maxTokens: 500,
  },
};

// 设置事件监听器
function setupEventListeners() {
  // 表单提交
  document
    .getElementById("settingsForm")
    .addEventListener("submit", handleSaveSettings);

  // 测试连接
  document
    .getElementById("testConnection")
    .addEventListener("click", handleTestConnection);

  // 重置设置
  document
    .getElementById("resetSettings")
    .addEventListener("click", handleResetSettings);

  // 导出设置
  document
    .getElementById("exportSettings")
    .addEventListener("click", handleExportSettings);

  // 导入设置
  document
    .getElementById("importSettings")
    .addEventListener("click", () => {
      document.getElementById("importFile").click();
    });

  // 导入文件选择
  document
    .getElementById("importFile")
    .addEventListener("change", handleImportFile);

  // 切换密钥可见性
  document
    .getElementById("toggleKeyVisibility")
    .addEventListener("click", toggleKeyVisibility);

  // 模型选择
  document
    .getElementById("apiModel")
    .addEventListener("change", handleModelChange);

  // 预设按钮
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const preset = e.currentTarget.dataset.preset;
      applyPreset(preset);
    });
  });

  // 语言切换
  document
    .getElementById("language")
    .addEventListener("change", handleLanguageChange);

  // 提示词管理
  document
    .getElementById("addPrompt")
    .addEventListener("click", handleAddPrompt);
  document
    .getElementById("resetPrompts")
    .addEventListener("click", handleResetPrompts);
}

// 加载已保存的设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      "apiEndpoint",
      "apiKey",
      "apiModel",
      "maxTokens",
      "systemPrompt",
      "userPromptTemplate",
      "language",
    ]);

    if (settings.apiEndpoint) {
      document.getElementById("apiEndpoint").value = settings.apiEndpoint;
    }
    if (settings.apiKey) {
      document.getElementById("apiKey").value = settings.apiKey;
    }
    if (settings.apiModel) {
      const modelSelect = document.getElementById("apiModel");
      const option = Array.from(modelSelect.options).find(
        (opt) => opt.value === settings.apiModel
      );

      if (option) {
        modelSelect.value = settings.apiModel;
      } else {
        // 自定义模型
        modelSelect.value = "custom";
        document.getElementById("customModel").style.display = "block";
        document.getElementById("customModel").value = settings.apiModel;
      }
    }
    if (settings.maxTokens) {
      document.getElementById("maxTokens").value = settings.maxTokens;
    }
    if (settings.systemPrompt) {
      document.getElementById("systemPrompt").value = settings.systemPrompt;
    }
    if (settings.userPromptTemplate) {
      document.getElementById("userPromptTemplate").value =
        settings.userPromptTemplate;
    }
    if (settings.language) {
      document.getElementById("language").value = settings.language;
    }
  } catch (error) {
    console.error("加载设置失败:", error);
    showStatus("加载设置失败", "error");
  }
}

// 保存设置
async function handleSaveSettings(e) {
  e.preventDefault();

  const apiEndpoint = document.getElementById("apiEndpoint").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  let apiModel = document.getElementById("apiModel").value;
  const maxTokens = parseInt(document.getElementById("maxTokens").value);
  const systemPrompt = document.getElementById("systemPrompt").value.trim();
  const userPromptTemplate = document
    .getElementById("userPromptTemplate")
    .value.trim();

  // 如果选择了自定义模型
  if (apiModel === "custom") {
    apiModel = document.getElementById("customModel").value.trim();
    if (!apiModel) {
      showStatus("请输入自定义模型名称", "error");
      return;
    }
  }

  // 验证输入
  if (!apiEndpoint || !apiKey || !apiModel) {
    showStatus("请填写所有必填字段", "error");
    return;
  }

  try {
    await chrome.storage.sync.set({
      apiEndpoint,
      apiKey,
      apiModel,
      maxTokens,
      systemPrompt,
      userPromptTemplate,
    });

    showStatus("✅ 配置保存成功！", "success");
  } catch (error) {
    console.error("保存设置失败:", error);
    showStatus("❌ 保存失败: " + error.message, "error");
  }
}

// 测试连接
async function handleTestConnection() {
  const btn = document.getElementById("testConnection");
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = "🔄 测试中...";

  try {
    const settings = await chrome.storage.sync.get([
      "apiEndpoint",
      "apiKey",
      "apiModel",
      "maxTokens",
    ]);

    if (!settings.apiKey || !settings.apiEndpoint) {
      showStatus("❌ 请先保存配置后再测试", "error");
      return;
    }

    // 发送测试请求
    const response = await fetch(settings.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.apiModel || "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hi, this is a test message.",
          },
        ],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      showStatus("✅ 连接成功！API配置正确。", "success");
    } else {
      const errorData = await response.json().catch(() => ({}));
      showStatus(
        `❌ 连接失败: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`,
        "error"
      );
    }
  } catch (error) {
    console.error("测试连接失败:", error);
    showStatus("❌ 测试失败: " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// 重置设置
async function handleResetSettings() {
  if (!confirm("确定要恢复默认设置吗？这将清除所有已保存的配置。")) {
    return;
  }

  try {
    await chrome.storage.sync.clear();

    // 应用默认预设
    applyPreset("openai");

    showStatus("✅ 已恢复默认设置", "success");
  } catch (error) {
    console.error("重置设置失败:", error);
    showStatus("❌ 重置失败: " + error.message, "error");
  }
}

// 切换密钥可见性
function toggleKeyVisibility() {
  const input = document.getElementById("apiKey");
  const btn = document.getElementById("toggleKeyVisibility");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
    btn.title = "隐藏密钥";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
    btn.title = "显示密钥";
  }
}

// 处理模型选择变化
function handleModelChange(e) {
  const customModelInput = document.getElementById("customModel");

  if (e.target.value === "custom") {
    customModelInput.style.display = "block";
    customModelInput.required = true;
  } else {
    customModelInput.style.display = "none";
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

// 更新UI语言
function updateUILanguage() {
  // Update prompts section
  document.getElementById("promptsTitle").textContent = i18nInstance.t(
    "settings.promptsTitle"
  );
  document.getElementById("promptsSubtitle").textContent = i18nInstance.t(
    "settings.promptsSubtitle"
  );
  document.getElementById("addPrompt").innerHTML =
    i18nInstance.t("settings.addPrompt");
  document.getElementById("resetPrompts").innerHTML = i18nInstance.t(
    "settings.resetPrompts"
  );
}

// 应用预设配置
function applyPreset(presetName) {
  const preset = presets[presetName];

  if (!preset) {
    showStatus("❌ 未知的预设配置", "error");
    return;
  }

  document.getElementById("apiEndpoint").value = preset.apiEndpoint;

  const modelSelect = document.getElementById("apiModel");
  const option = Array.from(modelSelect.options).find(
    (opt) => opt.value === preset.apiModel
  );

  if (option) {
    modelSelect.value = preset.apiModel;
    document.getElementById("customModel").style.display = "none";
  } else {
    modelSelect.value = "custom";
    document.getElementById("customModel").style.display = "block";
    document.getElementById("customModel").value = preset.apiModel;
  }

  document.getElementById("maxTokens").value = preset.maxTokens;

  showStatus(
    `✅ 已应用 ${presetName.toUpperCase()} 预设配置，请填写API密钥并保存`,
    "info"
  );

  // 聚焦到API密钥输入框
  document.getElementById("apiKey").focus();
}

// 显示状态消息
function showStatus(message, type = "info") {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = "block";

  // 3秒后自动隐藏（成功消息）
  if (type === "success") {
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 3000);
  }
}

// 提示词管理功能

// 加载提示词
async function loadPrompts() {
  try {
    const result = await chrome.storage.sync.get(["prompts"]);
    prompts = result.prompts || getDefaultPrompts();

    // 为旧版本的提示词添加默认配置
    let needUpdate = false;
    prompts = prompts.map((prompt) => {
      if (
        !prompt.hasOwnProperty("systemPrompt") ||
        !prompt.hasOwnProperty("apiModel") ||
        !prompt.hasOwnProperty("maxTokens")
      ) {
        needUpdate = true;
        return {
          ...prompt,
          systemPrompt: prompt.systemPrompt || "default",
          apiModel: prompt.apiModel || "default",
          maxTokens: prompt.maxTokens || "default",
        };
      }
      return prompt;
    });

    // 如果有更新，保存到storage
    if (needUpdate) {
      await chrome.storage.sync.set({ prompts });
    }
  } catch (error) {
    console.error("加载提示词失败:", error);
    prompts = getDefaultPrompts();
  }
}

// 获取默认提示词
function getDefaultPrompts() {
  return [
    {
      name: "分析文字",
      userPromptTemplate: "请分析以下文字：\n\n{text}",
      contextType: "selection",
      systemPrompt:
        "你是一个专业的AI助手，可以回答各种关于文字的问题。请用简洁清晰的中文回答。",
      apiModel: "default", // default表示使用全局设置
      maxTokens: "default",
    },
    {
      name: "翻译成中文",
      userPromptTemplate: "请将以下文字翻译成中文：\n\n{text}",
      contextType: "selection",
      systemPrompt:
        "你是一个专业的翻译助手，能够准确地将各种语言翻译成中文。请保持原文的语义和语调。",
      apiModel: "default",
      maxTokens: "default",
    },
    {
      name: "总结要点",
      userPromptTemplate: "请总结以下文字的主要要点：\n\n{text}",
      contextType: "both",
      systemPrompt:
        "你是一个专业的内容分析师，善于提取和总结文本的核心要点。请用条理清晰的方式呈现主要内容。",
      apiModel: "default",
      maxTokens: "default",
    },
    {
      name: "分析语法",
      userPromptTemplate: "请分析以下文字的语法结构和用法：\n\n{text}",
      contextType: "selection",
      systemPrompt:
        "你是一个专业的语言学专家，精通各种语言的语法结构。请详细分析文本的语法特点。",
      apiModel: "default",
      maxTokens: "default",
    },
    {
      name: "总结网页内容",
      userPromptTemplate: "请总结以下网页的主要内容：\n\n{text}",
      contextType: "page",
      systemPrompt:
        "你是一个专业的内容总结助手，能够快速理解和总结网页内容的核心信息。",
      apiModel: "default",
      maxTokens: "default",
    },
  ];
}

// 渲染提示词列表
function renderPrompts() {
  const container = document.getElementById("promptsList");
  container.innerHTML = "";

  prompts.forEach((prompt, index) => {
    const promptItem = document.createElement("div");
    promptItem.className = "prompt-item";
    promptItem.dataset.index = index;

    // 获取上下文类型显示文本
    const contextTypeText = getContextTypeText(prompt.contextType || "both");
    const contextTypeIcon = getContextTypeIcon(prompt.contextType || "both");

    // 生成配置信息显示
    const configInfo = [];
    if (prompt.apiModel && prompt.apiModel !== "default") {
      configInfo.push(`模型: ${prompt.apiModel}`);
    }
    if (prompt.maxTokens && prompt.maxTokens !== "default") {
      configInfo.push(`Token: ${prompt.maxTokens}`);
    }
    if (prompt.systemPrompt && prompt.systemPrompt !== "default") {
      configInfo.push(`自定义系统提示词`);
    }
    const configDisplay =
      configInfo.length > 0
        ? `<div class="prompt-config-info">🔧 ${configInfo.join(" • ")}</div>`
        : "";

    promptItem.innerHTML = `
      <div class="prompt-header">
        <div class="prompt-name">
          <span class="prompt-index">${index + 1}</span>
          <span class="prompt-name-text">${prompt.name}</span>
          <span class="context-type-indicator" title="${contextTypeText}">${contextTypeIcon} ${contextTypeText}</span>
        </div>
        <div class="prompt-actions">
          <button class="prompt-btn edit" title="编辑">✏️</button>
          <button class="prompt-btn delete" title="删除">🗑️</button>
        </div>
      </div>
      ${configDisplay}
      <div class="prompt-template">${prompt.userPromptTemplate}</div>
    `;

    // 添加事件监听器
    const editBtn = promptItem.querySelector(".edit");
    const deleteBtn = promptItem.querySelector(".delete");

    editBtn.addEventListener("click", () => startEditPrompt(index));
    deleteBtn.addEventListener("click", () => deletePrompt(index));

    container.appendChild(promptItem);
  });
}

// 获取上下文类型显示文本
function getContextTypeText(contextType) {
  switch (contextType) {
    case "selection":
      return i18nInstance
        ? i18nInstance.t("settings.contextTypeSelection")
        : "选中文字";
    case "page":
      return i18nInstance
        ? i18nInstance.t("settings.contextTypePage")
        : "整个页面";
    case "image":
      return i18nInstance
        ? i18nInstance.t("settings.contextTypeImage")
        : "图片";
    case "both":
      return i18nInstance
        ? i18nInstance.t("settings.contextTypeBoth")
        : "多种场景";
    default:
      return "多种场景";
  }
}

// 获取上下文类型图标
function getContextTypeIcon(contextType) {
  switch (contextType) {
    case "selection":
      return "📝";
    case "page":
      return "📄";
    case "image":
      return "🖼️";
    case "both":
      return "🔀";
    default:
      return "🔀";
  }
}

// 开始编辑提示词
function startEditPrompt(index) {
  const prompt = prompts[index];
  const promptItem = document.querySelector(
    `.prompt-item[data-index="${index}"]`
  );

  const promptNamePlaceholder = i18nInstance.t(
    "settings.promptNamePlaceholder"
  );
  const promptTemplatePlaceholder = i18nInstance.t(
    "settings.promptTemplatePlaceholder"
  );
  const cancelText = i18nInstance.t("settings.cancelEdit");
  const saveText = i18nInstance.t("settings.savePrompt");
  const contextTypeSelection = i18nInstance.t("settings.contextTypeSelection");
  const contextTypePage = i18nInstance.t("settings.contextTypePage");
  const contextTypeImage = i18nInstance.t("settings.contextTypeImage");
  const contextTypeBoth = i18nInstance.t("settings.contextTypeBoth");

  const currentContextType = prompt.contextType || "both";
  const currentSystemPrompt = prompt.systemPrompt || "default";
  const currentApiModel = prompt.apiModel || "default";
  const currentMaxTokens = prompt.maxTokens || "default";

  promptItem.innerHTML = `
    <div class="prompt-edit-form">
      <div class="form-row">
        <label class="form-label">提示词名称:</label>
        <input type="text" class="prompt-name-input" value="${
          prompt.name
        }" placeholder="${promptNamePlaceholder}">
      </div>

      <div class="form-row">
        <label class="form-label">使用场景:</label>
        <select class="prompt-context-select">
          <option value="selection" ${
            currentContextType === "selection" ? "selected" : ""
          }>📝 ${contextTypeSelection}</option>
          <option value="page" ${
            currentContextType === "page" ? "selected" : ""
          }>📄 ${contextTypePage}</option>
          <option value="image" ${
            currentContextType === "image" ? "selected" : ""
          }>🖼️ ${contextTypeImage}</option>
          <option value="both" ${
            currentContextType === "both" ? "selected" : ""
          }>🔀 ${contextTypeBoth}</option>
        </select>
      </div>
      
      <div class="form-row">
        <label class="form-label">AI模型:</label>
        <select class="prompt-model-select">
          <option value="default" ${
            currentApiModel === "default" ? "selected" : ""
          }>🔧 使用全局设置</option>
          <optgroup label="OpenAI">
            <option value="gpt-4" ${
              currentApiModel === "gpt-4" ? "selected" : ""
            }>GPT-4</option>
            <option value="gpt-4-turbo" ${
              currentApiModel === "gpt-4-turbo" ? "selected" : ""
            }>GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo" ${
              currentApiModel === "gpt-3.5-turbo" ? "selected" : ""
            }>GPT-3.5 Turbo</option>
          </optgroup>
          <option value="custom" ${
            !["default", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"].includes(
              currentApiModel
            )
              ? "selected"
              : ""
          }>自定义模型</option>
        </select>
        <input type="text" class="prompt-custom-model" placeholder="输入自定义模型名称" 
               style="display: ${
                 !["default", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"].includes(
                   currentApiModel
                 )
                   ? "block"
                   : "none"
               }; margin-top: 4px;"
               value="${
                 !["default", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"].includes(
                   currentApiModel
                 )
                   ? currentApiModel
                   : ""
               }">
      </div>
      
      <div class="form-row">
        <label class="form-label">最大Token:</label>
        <select class="prompt-tokens-select">
          <option value="default" ${
            currentMaxTokens === "default" ? "selected" : ""
          }>🔧 使用全局设置</option>
          <option value="200" ${
            currentMaxTokens === "200" ? "selected" : ""
          }>200</option>
          <option value="500" ${
            currentMaxTokens === "500" ? "selected" : ""
          }>500</option>
          <option value="1000" ${
            currentMaxTokens === "1000" ? "selected" : ""
          }>1000</option>
          <option value="2000" ${
            currentMaxTokens === "2000" ? "selected" : ""
          }>2000</option>
          <option value="custom" ${
            !["default", "200", "500", "1000", "2000"].includes(
              currentMaxTokens
            )
              ? "selected"
              : ""
          }>自定义</option>
        </select>
        <input type="number" class="prompt-custom-tokens" placeholder="输入自定义Token数" min="100" max="4000" step="100"
               style="display: ${
                 !["default", "200", "500", "1000", "2000"].includes(
                   currentMaxTokens
                 )
                   ? "block"
                   : "none"
               }; margin-top: 4px;"
               value="${
                 !["default", "200", "500", "1000", "2000"].includes(
                   currentMaxTokens
                 )
                   ? currentMaxTokens
                   : ""
               }">
      </div>
      
      <div class="form-row">
        <label class="form-label">系统提示词:</label>
        <select class="prompt-system-select">
          <option value="default" ${
            currentSystemPrompt === "default" ? "selected" : ""
          }>🔧 使用全局设置</option>
          <option value="custom" ${
            currentSystemPrompt !== "default" ? "selected" : ""
          }>自定义系统提示词</option>
        </select>
        <textarea class="prompt-system-input" placeholder="输入自定义系统提示词..."
                  style="display: ${
                    currentSystemPrompt !== "default" ? "block" : "none"
                  }; margin-top: 4px; height: 80px;">${
    currentSystemPrompt !== "default" ? currentSystemPrompt : ""
  }</textarea>
      </div>
      
      <div class="form-row">
        <label class="form-label">用户提示词模板:</label>
        <textarea class="prompt-edit-template" placeholder="${promptTemplatePlaceholder}">${
    prompt.userPromptTemplate
  }</textarea>
      </div>

      <div class="form-row">
        <button class="ai-optimize-btn" title="使用AI优化此提示词">
          🤖 AI优化提示词
        </button>
      </div>

      <div class="prompt-edit-actions">
        <button class="cancel-btn">${cancelText}</button>
        <button class="save-btn">${saveText}</button>
      </div>
    </div>
  `;

  const nameInput = promptItem.querySelector(".prompt-name-input");
  const contextSelect = promptItem.querySelector(".prompt-context-select");
  const templateInput = promptItem.querySelector(".prompt-edit-template");
  const modelSelect = promptItem.querySelector(".prompt-model-select");
  const customModelInput = promptItem.querySelector(".prompt-custom-model");
  const tokensSelect = promptItem.querySelector(".prompt-tokens-select");
  const customTokensInput = promptItem.querySelector(".prompt-custom-tokens");
  const systemSelect = promptItem.querySelector(".prompt-system-select");
  const systemInput = promptItem.querySelector(".prompt-system-input");
  const cancelBtn = promptItem.querySelector(".cancel-btn");
  const saveBtn = promptItem.querySelector(".save-btn");
  const aiOptimizeBtn = promptItem.querySelector(".ai-optimize-btn");

  nameInput.focus();

  // 监听模型选择变化
  modelSelect.addEventListener("change", () => {
    customModelInput.style.display =
      modelSelect.value === "custom" ? "block" : "none";
  });

  // 监听Token选择变化
  tokensSelect.addEventListener("change", () => {
    customTokensInput.style.display =
      tokensSelect.value === "custom" ? "block" : "none";
  });

  // 监听系统提示词选择变化
  systemSelect.addEventListener("change", () => {
    systemInput.style.display =
      systemSelect.value === "custom" ? "block" : "none";
  });

  cancelBtn.addEventListener("click", () => renderPrompts());

  // AI优化提示词按钮事件
  aiOptimizeBtn.addEventListener("click", () => {
    aiOptimizePrompt(templateInput, aiOptimizeBtn);
  });

  saveBtn.addEventListener("click", () => {
    const promptConfig = collectPromptConfig(promptItem);
    savePrompt(
      index,
      nameInput.value,
      templateInput.value,
      contextSelect.value,
      promptConfig
    );
  });
}

// 收集提示词配置
function collectPromptConfig(promptItem) {
  const modelSelect = promptItem.querySelector(".prompt-model-select");
  const customModelInput = promptItem.querySelector(".prompt-custom-model");
  const tokensSelect = promptItem.querySelector(".prompt-tokens-select");
  const customTokensInput = promptItem.querySelector(".prompt-custom-tokens");
  const systemSelect = promptItem.querySelector(".prompt-system-select");
  const systemInput = promptItem.querySelector(".prompt-system-input");

  // 确定API模型
  let apiModel = modelSelect.value;
  if (apiModel === "custom") {
    apiModel = customModelInput.value.trim() || "default";
  }

  // 确定最大Token数
  let maxTokens = tokensSelect.value;
  if (maxTokens === "custom") {
    maxTokens = customTokensInput.value.trim() || "default";
  }

  // 确定系统提示词
  let systemPrompt = systemSelect.value;
  if (systemPrompt === "custom") {
    systemPrompt = systemInput.value.trim() || "default";
  }

  return {
    apiModel,
    maxTokens,
    systemPrompt,
  };
}

// 保存提示词
async function savePrompt(
  index,
  name,
  userPromptTemplate,
  contextType,
  promptConfig
) {
  if (!name.trim() || !userPromptTemplate.trim()) {
    showStatus(i18nInstance.t("settings.promptRequired"), "error");
    return;
  }

  // 对于非图片类型的提示词，检查是否包含 {text} 占位符
  if (contextType !== "image" && !userPromptTemplate.includes("{text}")) {
    showStatus(i18nInstance.t("settings.promptTextPlaceholder"), "error");
    return;
  }

  prompts[index] = {
    name: name.trim(),
    userPromptTemplate: userPromptTemplate.trim(),
    contextType: contextType || "both",
    systemPrompt: promptConfig.systemPrompt || "default",
    apiModel: promptConfig.apiModel || "default",
    maxTokens: promptConfig.maxTokens || "default",
  };
  await chrome.storage.sync.set({ prompts });

  renderPrompts();
  showStatus(i18nInstance.t("settings.promptSaved"), "success");

  // 刷新右键菜单
  chrome.runtime.sendMessage({ action: "refreshContextMenu" });
}

// 删除提示词
async function deletePrompt(index) {
  if (prompts.length <= 1) {
    showStatus(i18nInstance.t("settings.promptMinRequired"), "error");
    return;
  }

  if (confirm(i18nInstance.t("settings.deletePromptConfirm"))) {
    prompts.splice(index, 1);
    await chrome.storage.sync.set({ prompts });

    renderPrompts();
    showStatus(i18nInstance.t("settings.promptDeleted"), "success");

    // 刷新右键菜单
    chrome.runtime.sendMessage({ action: "refreshContextMenu" });
  }
}

// 添加新提示词
function handleAddPrompt() {
  const newPrompt = {
    name: "新提示词",
    userPromptTemplate: "请分析以下文字：\n\n{text}",
    contextType: "both",
    systemPrompt: "default",
    apiModel: "default",
    maxTokens: "default",
  };

  prompts.push(newPrompt);
  chrome.storage.sync.set({ prompts });

  renderPrompts();

  // 自动开始编辑新添加的提示词
  setTimeout(() => {
    startEditPrompt(prompts.length - 1);
  }, 100);
}

// 重置提示词
async function handleResetPrompts() {
  if (confirm(i18nInstance.t("settings.resetPromptsConfirm"))) {
    prompts = getDefaultPrompts();
    await chrome.storage.sync.set({ prompts });

    renderPrompts();
    showStatus(i18nInstance.t("settings.promptsReset"), "success");

    // 刷新右键菜单
    chrome.runtime.sendMessage({ action: "refreshContextMenu" });
  }
}

// AI优化提示词功能
async function aiOptimizePrompt(templateTextarea, buttonElement) {
  const originalText = buttonElement.textContent;
  const currentPrompt = templateTextarea.value.trim();

  if (!currentPrompt) {
    showStatus("请先输入提示词内容", "error");
    return;
  }

  // 显示加载状态
  buttonElement.textContent = "🔄 优化中...";
  buttonElement.disabled = true;

  try {
    // 获取API配置
    const config = await chrome.storage.sync.get([
      "apiKey",
      "apiEndpoint",
      "apiModel",
      "maxTokens",
    ]);

    if (!config.apiKey) {
      throw new Error("请先配置API密钥");
    }

    // 构建AI优化请求
    const optimizationPrompt = `请帮我优化以下提示词，使其更加清晰、有效和专业。原始提示词的用途是通过右键菜单分析用户选中的文字内容。

原始提示词：
"""
${currentPrompt}
"""

请提供一个优化后的版本，要求：
1. 保持原始意图和功能不变
2. 使表达更清晰、更具体
3. 提高AI生成内容的质量和相关性
4. 保持简洁，避免冗长

请只返回优化后的提示词内容，不要包含其他解释。`;

    const response = await fetch(
      config.apiEndpoint || "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.apiModel || "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "你是一个专业的提示词优化专家，擅长改进AI提示词的质量和效果。",
            },
            {
              role: "user",
              content: optimizationPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0].message.content.trim();

    if (optimizedPrompt) {
      // 更新文本框内容
      templateTextarea.value = optimizedPrompt;
      showStatus("提示词优化成功！", "success");
    } else {
      throw new Error("AI返回的优化结果为空");
    }

  } catch (error) {
    console.error("AI优化提示词失败:", error);
    showStatus(`优化失败: ${error.message}`, "error");
  } finally {
    // 恢复按钮状态
    buttonElement.textContent = originalText;
    buttonElement.disabled = false;
  }
}

// 导出设置功能
async function handleExportSettings() {
  try {
    // 获取所有设置
    const syncSettings = await chrome.storage.sync.get([
      "apiEndpoint",
      "apiKey",
      "apiModel",
      "maxTokens",
      "systemPrompt",
      "userPromptTemplate",
      "language",
      "prompts"
    ]);

    // 获取本地存储的历史记录
    const localSettings = await chrome.storage.local.get(["history"]);

    // 构建导出数据
    const exportData = {
      version: "1.0.0",
      exportTime: new Date().toISOString(),
      syncSettings: {
        apiEndpoint: syncSettings.apiEndpoint || "",
        apiKey: syncSettings.apiKey || "",
        apiModel: syncSettings.apiModel || "gpt-3.5-turbo",
        maxTokens: syncSettings.maxTokens || 500,
        systemPrompt: syncSettings.systemPrompt || "",
        userPromptTemplate: syncSettings.userPromptTemplate || "",
        language: syncSettings.language || "zh",
        prompts: syncSettings.prompts || []
      },
      localSettings: {
        history: localSettings.history || []
      }
    };

    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ask-ai-anything-settings-${new Date().toISOString().split('T')[0]}.json`;

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理URL对象
    URL.revokeObjectURL(url);

    showStatus("设置导出成功！", "success");

  } catch (error) {
    console.error("导出设置失败:", error);
    showStatus(`导出失败: ${error.message}`, "error");
  }
}

// 处理导入文件选择
async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);

    // 验证导入数据格式
    if (!importData.version || !importData.syncSettings) {
      throw new Error("无效的设置文件格式");
    }

    // 显示导入选项对话框
    showImportDialog(importData);

  } catch (error) {
    console.error("导入文件解析失败:", error);
    showStatus(`导入失败: ${error.message}`, "error");
  }

  // 清空文件输入，允许重复选择同一文件
  event.target.value = "";
}

// 显示导入选项对话框
function showImportDialog(importData) {
  // 创建对话框HTML
  const dialogHTML = `
    <div id="importDialog" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="margin: 0 0 20px 0; color: #333;">导入设置</h2>

        <div style="margin-bottom: 20px; color: #666; font-size: 14px;">
          <p><strong>导出时间:</strong> ${new Date(importData.exportTime).toLocaleString()}</p>
          <p><strong>版本:</strong> ${importData.version}</p>
          <p><strong>包含内容:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>API配置: ${importData.syncSettings.apiEndpoint ? '✓' : '✗'}</li>
            <li>API密钥: ${importData.syncSettings.apiKey ? '✓' : '✗'}</li>
            <li>提示词配置: ${importData.syncSettings.prompts?.length || 0} 条</li>
            <li>历史记录: ${importData.localSettings?.history?.length || 0} 条</li>
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">导入选项</h3>
          <label style="display: block; margin-bottom: 10px; cursor: pointer;">
            <input type="radio" name="importOption" value="replace" checked>
            <strong>完全替换</strong> - 删除当前设置，完全使用导入的设置
          </label>
          <label style="display: block; margin-bottom: 10px; cursor: pointer;">
            <input type="radio" name="importOption" value="merge">
            <strong>合并设置</strong> - 保留现有设置，与导入设置合并
          </label>
          <div id="mergeOptions" style="margin-left: 25px; display: none;">
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="mergeApiConfig" checked>
              API配置（端点、密钥、模型等）
            </label>
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="mergePrompts" checked>
              提示词配置（会合并，不会替换）
            </label>
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="mergeHistory">
              历史记录
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancelImport" class="btn btn-secondary">取消</button>
          <button id="confirmImport" class="btn btn-primary">确认导入</button>
        </div>
      </div>
    </div>
  `;

  // 添加对话框到页面
  document.body.insertAdjacentHTML('beforeend', dialogHTML);

  const dialog = document.getElementById('importDialog');
  const cancelBtn = document.getElementById('cancelImport');
  const confirmBtn = document.getElementById('confirmImport');
  const mergeOptions = document.getElementById('mergeOptions');

  // 监听导入选项变化
  document.querySelectorAll('input[name="importOption"]').forEach(radio => {
    radio.addEventListener('change', () => {
      mergeOptions.style.display =
        document.querySelector('input[name="importOption"]:checked').value === 'merge'
          ? 'block' : 'none';
    });
  });

  // 取消按钮
  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });

  // 确认导入按钮
  confirmBtn.addEventListener('click', () => {
    const option = document.querySelector('input[name="importOption"]:checked').value;
    dialog.remove();
    executeImport(importData, option);
  });

  // 点击背景关闭对话框
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
}

// 执行导入设置
async function executeImport(importData, option) {
  try {
    if (option === 'replace') {
      // 完全替换现有设置
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();

      await chrome.storage.sync.set(importData.syncSettings);
      if (importData.localSettings?.history) {
        await chrome.storage.local.set({ history: importData.localSettings.history });
      }

      showStatus("设置导入成功！页面将刷新...", "success");
      setTimeout(() => {
        location.reload();
      }, 2000);

    } else if (option === 'merge') {
      // 合并设置
      const mergeApiConfig = document.getElementById('mergeApiConfig').checked;
      const mergePrompts = document.getElementById('mergePrompts').checked;
      const mergeHistory = document.getElementById('mergeHistory').checked;

      const currentSyncSettings = await chrome.storage.sync.get([
        "apiEndpoint", "apiKey", "apiModel", "maxTokens",
        "systemPrompt", "userPromptTemplate", "language", "prompts"
      ]);
      const currentLocalSettings = await chrome.storage.local.get(["history"]);

      const newSyncSettings = { ...currentSyncSettings };
      const newLocalSettings = { ...currentLocalSettings };

      // 合并API配置
      if (mergeApiConfig) {
        ['apiEndpoint', 'apiKey', 'apiModel', 'maxTokens',
         'systemPrompt', 'userPromptTemplate', 'language'].forEach(key => {
          if (importData.syncSettings[key]) {
            newSyncSettings[key] = importData.syncSettings[key];
          }
        });
      }

      // 合并提示词配置
      if (mergePrompts && importData.syncSettings.prompts) {
        const existingPrompts = newSyncSettings.prompts || [];
        const importPrompts = importData.syncSettings.prompts;

        // 合并提示词，避免重复
        const mergedPrompts = [...existingPrompts];
        importPrompts.forEach(importPrompt => {
          const isDuplicate = existingPrompts.some(existing =>
            existing.name === importPrompt.name &&
            existing.userPromptTemplate === importPrompt.userPromptTemplate
          );
          if (!isDuplicate) {
            mergedPrompts.push(importPrompt);
          }
        });

        newSyncSettings.prompts = mergedPrompts;
      }

      // 合并历史记录
      if (mergeHistory && importData.localSettings?.history) {
        const existingHistory = newLocalSettings.history || [];
        const importHistory = importData.localSettings.history;

        // 合并历史记录，按时间排序，限制数量
        const mergedHistory = [...existingHistory, ...importHistory]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50); // 限制最多50条历史记录

        newLocalSettings.history = mergedHistory;
      }

      await chrome.storage.sync.set(newSyncSettings);
      await chrome.storage.local.set(newLocalSettings);

      showStatus("设置合并成功！页面将刷新...", "success");
      setTimeout(() => {
        location.reload();
      }, 2000);
    }

  } catch (error) {
    console.error("导入设置失败:", error);
    showStatus(`导入失败: ${error.message}`, "error");
  }
}
