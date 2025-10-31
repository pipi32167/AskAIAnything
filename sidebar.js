// 侧边栏逻辑
let currentText = "";
let history = [];
let filteredHistory = []; // 过滤后的历史记录
let i18nInstance;
let hasCurrentExplanation = false; // 标记是否有当前解释

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  i18nInstance = await initI18n();
  updateUILanguage();

  // 初始化数据库
  try {
    await window.dbManager.initDB();
    console.log("数据库初始化完成");

    // 检查并迁移旧数据（仅运行一次）
    const migrated = await chrome.storage.local.get(["dbMigrated"]);
    if (!migrated.dbMigrated) {
      await window.dbManager.migrateOldData();
      await chrome.storage.local.set({ dbMigrated: true });
      console.log("数据迁移完成");
    }
  } catch (error) {
    console.error("数据库初始化失败:", error);
  }

  loadHistory();
  setupEventListeners();
  hideCurrentExplanation(); // 初始时隐藏
});

// 更新UI语言
function updateUILanguage() {
  document.getElementById("sidebarTitle").textContent =
    i18nInstance.t("sidebar.title");
  document.getElementById("openSettings").title =
    i18nInstance.t("sidebar.settings");
  document.getElementById("selectedTextLabel").textContent = i18nInstance.t(
    "sidebar.selectedText"
  );
  document.getElementById("explanationLabel").textContent = i18nInstance.t(
    "sidebar.aiExplanation"
  );
  document.getElementById("loadingText").textContent =
    i18nInstance.t("sidebar.analyzing");
  document.getElementById("historyTitle").textContent =
    i18nInstance.t("sidebar.history");
  document.getElementById("clearAllText").textContent = i18nInstance
    .t("sidebar.clearAll")
    .replace("🗑️ ", "");
  document.getElementById("clearAllHistory").title = i18nInstance.t(
    "sidebar.clearAllConfirm"
  );

  // 更新搜索和过滤器的UI
  document.getElementById("historySearch").placeholder = i18nInstance.t(
    "sidebar.searchPlaceholder"
  );
  document.getElementById("clearSearch").title = i18nInstance.t(
    "sidebar.clearSearch"
  );
  document.getElementById("clearFilters").title = i18nInstance.t(
    "sidebar.clearFilters"
  );

  // 更新提示词过滤器选项
  updatePromptFilterOptions();
}

// 设置事件监听
function setupEventListeners() {
  // 关闭按钮 - Side Panel 由浏览器控制，这里只隐藏当前解释
  document.getElementById("closeSidebar").addEventListener("click", () => {
    hideCurrentExplanation();
  });

  // 设置按钮
  document.getElementById("openSettings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openSettings" });
  });

  // 清空所有历史记录按钮
  document
    .getElementById("clearAllHistory")
    .addEventListener("click", clearAllHistory);

  // 搜索框事件监听
  document
    .getElementById("historySearch")
    .addEventListener("input", filterHistory);
  document.getElementById("clearSearch").addEventListener("click", clearSearch);

  // 提示词过滤器事件监听
  document
    .getElementById("promptFilter")
    .addEventListener("change", filterHistory);
  document
    .getElementById("clearFilters")
    .addEventListener("click", clearFilters);

  // 接收来自background和content script的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "explainText") {
      handleExplainRequest(
        message.text,
        message.promptTemplate,
        message.promptName,
        message.sourceInfo,
        message.contextType,
        message.pageUrl,
        message.pageTitle,
        message.promptConfig
      );
    } else if (message.action === "explainImage") {
      handleExplainImageRequest(
        message.imageUrl,
        message.imageData,
        message.promptTemplate,
        message.promptName,
        message.sourceInfo,
        message.pageUrl,
        message.pageTitle,
        message.promptConfig
      );
    } else if (message.action === "reset") {
      hideCurrentExplanation();
    }
  });
}

// 处理解释请求
async function handleExplainRequest(
  text,
  customPromptTemplate,
  promptName,
  sourceInfo,
  _contextType,
  pageUrl,
  pageTitle,
  promptConfig
) {
  currentText = text;
  hasCurrentExplanation = true;
  showCurrentExplanation(); // 显示当前解释区域

  // 更新侧边栏标题
  const titleElement = document.getElementById("sidebarTitle");
  if (promptName && sourceInfo) {
    titleElement.textContent = `${promptName} - ${sourceInfo}`;
    titleElement.title = `${promptName} - ${sourceInfo}`; // 完整标题作为 tooltip
  } else {
    titleElement.textContent = i18nInstance.t("sidebar.title");
  }

  // 恢复标签为"选中文字"
  const selectedTextLabel = document.getElementById("selectedTextLabel");
  selectedTextLabel.textContent = i18nInstance.t("sidebar.selectedText");

  const selectedTextElement = document.getElementById("currentSelectedText");
  selectedTextElement.textContent = text;
  selectedTextElement.title = text; // 添加title以显示完整内容

  document.getElementById(
    "currentExplanation"
  ).innerHTML = `<div class="loading">${i18nInstance.t(
    "sidebar.analyzing"
  )}</div>`;

  try {
    // 调用AI API - 使用自定义提示词和配置（如果提供）
    const explanation = await callAI(text, customPromptTemplate, promptConfig);

    // 显示解释 - 支持Markdown渲染
    displayExplanation(explanation);

    // 保存到历史记录
    addToHistory(text, explanation, promptName, sourceInfo, pageUrl, pageTitle);
  } catch (error) {
    document.getElementById(
      "currentExplanation"
    ).innerHTML = `<div class="error">${i18nInstance.t("sidebar.error")} ${
      error.message
    }</div>`;
  }
}

// 处理图片分析请求
async function handleExplainImageRequest(
  imageUrl,
  imageData,
  customPromptTemplate,
  promptName,
  sourceInfo,
  pageUrl,
  pageTitle,
  promptConfig
) {
  hasCurrentExplanation = true;
  showCurrentExplanation(); // 显示当前解释区域

  // 更新侧边栏标题
  const titleElement = document.getElementById("sidebarTitle");
  if (promptName && sourceInfo) {
    titleElement.textContent = `${promptName} - ${sourceInfo}`;
    titleElement.title = `${promptName} - ${sourceInfo}`;
  } else {
    titleElement.textContent = i18nInstance.t("sidebar.title");
  }

  // 将标签改为"选中图片"
  const selectedTextLabel = document.getElementById("selectedTextLabel");
  selectedTextLabel.textContent = "选中图片：";

  // 显示图片预览
  const selectedTextElement = document.getElementById("currentSelectedText");
  selectedTextElement.innerHTML = `<img src="${imageUrl}" alt="Selected image" style="max-width: 100%; border-radius: 4px; margin-top: 8px;" onerror="this.style.display='none'">`;
  selectedTextElement.title = imageUrl;

  document.getElementById(
    "currentExplanation"
  ).innerHTML = `<div class="loading">${i18nInstance.t(
    "sidebar.analyzing"
  )}</div>`;

  try {
    // 调用AI Vision API - 使用自定义提示词和配置
    const explanation = await callAIWithImage(
      imageUrl,
      imageData,
      customPromptTemplate,
      promptConfig
    );

    // 显示解释 - 支持Markdown渲染
    displayExplanation(explanation);

    // 保存到历史记录
    addToHistory(
      imageUrl,
      explanation,
      promptName,
      sourceInfo,
      pageUrl,
      pageTitle,
      "image",
      imageData
    );
  } catch (error) {
    document.getElementById(
      "currentExplanation"
    ).innerHTML = `<div class="error">${i18nInstance.t("sidebar.error")} ${
      error.message
    }</div>`;
  }
}

// 显示当前解释区域
function showCurrentExplanation() {
  const explanationSection = document.querySelector(".current-explanation");
  if (explanationSection) {
    explanationSection.style.display = "block";
    hasCurrentExplanation = true;
  }
}

// 隐藏当前解释区域
function hideCurrentExplanation() {
  const explanationSection = document.querySelector(".current-explanation");
  if (explanationSection) {
    explanationSection.style.display = "none";
    hasCurrentExplanation = false;
  }
}

// 显示解释内容（支持Markdown）
async function displayExplanation(text) {
  const explanationDiv = document.getElementById("currentExplanation");

  // 获取 Markdown 显示模式设置
  const settings = await chrome.storage.sync.get(["markdownMode"]);
  const markdownMode = settings.markdownMode || "compact";
  const modeClass = markdownMode === "relaxed" ? "relaxed-mode" : "";

  if (markdownParser.hasMarkdown(text)) {
    // 如果包含Markdown语法，则渲染
    explanationDiv.innerHTML = `<div class="markdown-content ${modeClass}">${markdownParser.parse(
      text
    )}</div>`;
  } else {
    // 如果是纯文本，直接显示（保持换行）
    explanationDiv.innerHTML = `<div class="plain-text">${text.replace(
      /\n/g,
      "<br>"
    )}</div>`;
  }
}

// 调用AI API
async function callAI(text, customPromptTemplate, promptConfig) {
  // 从storage获取API配置
  const config = await chrome.storage.sync.get([
    "apiKey",
    "apiEndpoint",
    "apiModel",
    "maxTokens",
    "systemPrompt",
    "userPromptTemplate",
  ]);

  // 如果没有配置，返回示例说明
  if (!config.apiKey) {
    return i18nInstance.t("sidebar.configRequired", { text });
  }

  // 使用提示词特定的系统提示词，或默认提示词
  let systemPrompt =
    config.systemPrompt ||
    "你是一个专业的AI助手，可以回答各种关于文字的问题。请用简洁清晰的中文回答。";

  // 如果提示词配置中指定了系统提示词，且不是"default"，则使用它
  if (
    promptConfig &&
    promptConfig.systemPrompt &&
    promptConfig.systemPrompt !== "default"
  ) {
    systemPrompt = promptConfig.systemPrompt;
  }

  // 优先使用右键菜单传递的提示词，否则使用设置中的提示词模板
  const userPromptTemplate =
    customPromptTemplate ||
    config.userPromptTemplate ||
    "请分析以下文字：\n\n{text}";
  const userPrompt = userPromptTemplate.replace("{text}", text);

  // 确定使用的模型
  let apiModel = config.apiModel || "gpt-3.5-turbo";
  if (
    promptConfig &&
    promptConfig.apiModel &&
    promptConfig.apiModel !== "default"
  ) {
    apiModel = promptConfig.apiModel;
  }

  // 确定使用的最大token数
  let maxTokens = config.maxTokens || 500;
  if (
    promptConfig &&
    promptConfig.maxTokens &&
    promptConfig.maxTokens !== "default"
  ) {
    maxTokens = parseInt(promptConfig.maxTokens) || 500;
  }

  // 调用API
  const response = await fetch(
    config.apiEndpoint || "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 调用AI Vision API（支持图片）
async function callAIWithImage(
  imageUrl,
  imageData,
  customPromptTemplate,
  promptConfig
) {
  // 从storage获取API配置
  const config = await chrome.storage.sync.get([
    "apiKey",
    "apiEndpoint",
    "apiModel",
    "maxTokens",
    "systemPrompt",
    "userPromptTemplate",
  ]);

  // 如果没有配置，返回示例说明
  if (!config.apiKey) {
    return i18nInstance.t("sidebar.configRequired", { text: imageUrl });
  }

  // 使用提示词特定的系统提示词，或默认提示词
  let systemPrompt =
    config.systemPrompt ||
    "你是一个专业的AI助手，可以回答各种关于文字的问题。请用简洁清晰的中文回答。";

  // 如果提示词配置中指定了系统提示词，且不是"default"，则使用它
  if (
    promptConfig &&
    promptConfig.systemPrompt &&
    promptConfig.systemPrompt !== "default"
  ) {
    systemPrompt = promptConfig.systemPrompt;
  }

  // 优先使用右键菜单传递的提示词，否则使用设置中的提示词模板
  const userPromptTemplate =
    customPromptTemplate ||
    config.userPromptTemplate ||
    "请分析这张图片的内容：";
  const userPrompt = userPromptTemplate.replace("{text}", imageUrl);

  // 确定使用的模型（对于图片分析，默认使用支持vision的模型）
  let apiModel = config.apiModel || "gpt-4o";
  if (
    promptConfig &&
    promptConfig.apiModel &&
    promptConfig.apiModel !== "default"
  ) {
    apiModel = promptConfig.apiModel;
  }

  // 确定使用的最大token数
  let maxTokens = config.maxTokens || 500;
  if (
    promptConfig &&
    promptConfig.maxTokens &&
    promptConfig.maxTokens !== "default"
  ) {
    maxTokens = parseInt(promptConfig.maxTokens) || 500;
  }

  // 构建消息数组
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: userPrompt,
        },
        {
          type: "image_url",
          image_url: {
            url: imageData || imageUrl, // 优先使用base64数据，否则使用URL
            detail: "auto",
          },
        },
      ],
    },
  ];

  // 调用API
  const response = await fetch(
    config.apiEndpoint || "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: apiModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 添加到历史记录
async function addToHistory(
  text,
  explanation,
  promptName,
  sourceInfo,
  pageUrl,
  pageTitle,
  contextType = "text",
  imageData = null
) {
  const timestamp = new Date().toLocaleString("zh-CN");
  const historyItem = {
    text,
    explanation,
    timestamp,
    promptName: promptName || "解释",
    sourceInfo:
      sourceInfo ||
      (contextType === "image"
        ? "图片分析"
        : text.substring(0, 30) + (text.length > 30 ? "..." : "")),
    pageUrl: pageUrl || "",
    pageTitle: pageTitle || "",
    contextType: contextType,
    imageData: imageData, // 保存图片数据用于历史记录显示
  };

  // 保存到数据库
  try {
    await window.dbManager.addHistory(historyItem);
    console.log("历史记录已保存到数据库");

    // 重新加载历史记录
    await loadHistory();

    // 更新UI
    updatePromptFilterOptions();
    await filterHistory(); // 重新应用当前的过滤条件
  } catch (error) {
    console.error("保存历史记录失败:", error);
    // 降级：保存到旧的 chrome.storage
    history.unshift(historyItem);
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    chrome.storage.local.set({ history });
    updatePromptFilterOptions();
    await filterHistory();
  }
}

// 加载历史记录
async function loadHistory() {
  try {
    // 从数据库加载
    history = await window.dbManager.getAllHistory();
    filteredHistory = [...history]; // 初始时显示所有历史记录
    updatePromptFilterOptions();
    await renderHistory();
  } catch (error) {
    console.error("从数据库加载历史记录失败:", error);
    // 降级：从 chrome.storage 加载
    const data = await chrome.storage.local.get(["history"]);
    if (data.history) {
      history = data.history;
      filteredHistory = [...history];
      updatePromptFilterOptions();
      await renderHistory();
    }
  }
}

// 渲染历史记录
async function renderHistory() {
  const container = document.getElementById("historyAccordion");
  if (!container) {
    console.error("historyAccordion container not found");
    return;
  }

  container.innerHTML = "";

  if (history.length === 0) {
    const noHistoryText =
      i18nInstance?.t("sidebar.noHistory") || "暂无历史记录";
    container.innerHTML = `<div class="no-history">${noHistoryText}</div>`;
    return;
  }

  if (filteredHistory.length === 0) {
    const noFilterResultsText =
      i18nInstance?.t("sidebar.noFilterResults") || "无匹配结果";
    container.innerHTML = `<div class="no-history">${noFilterResultsText}</div>`;
    return;
  }

  // 获取 Markdown 显示模式设置（在循环外部获取一次）
  const settings = await chrome.storage.sync.get(["markdownMode"]);
  const markdownMode = settings.markdownMode || "compact";
  const modeClass = markdownMode === "relaxed" ? "relaxed-mode" : "";

  filteredHistory.forEach((item) => {
    try {
      // 使用数据库ID而不是索引
      const id = item.id;
      const accordionItem = document.createElement("div");
      accordionItem.className = "accordion-item";

      const header = document.createElement("div");
      header.className = "accordion-header";

      const headerText = document.createElement("span");
      headerText.className = "accordion-header-text";

      // 显示提示词名称和来源信息
      const displayName =
        item.promptName && item.sourceInfo
          ? `${item.promptName} - ${item.sourceInfo}`
          : item.text.length > 30
          ? item.text.substring(0, 30) + "..."
          : item.text;

      headerText.textContent = displayName;
      headerText.title = displayName; // 完整标题作为 tooltip

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-history-btn";
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "删除此记录";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // 防止触发accordion展开
        deleteHistoryItem(id);
      });

      header.appendChild(headerText);
      header.appendChild(deleteBtn);

      const content = document.createElement("div");
      content.className = "accordion-content";

      // 渲染历史记录的解释（支持Markdown）
      const explanationHTML = markdownParser.hasMarkdown(item.explanation)
        ? `<div class="markdown-content ${modeClass}">${markdownParser.parse(
            item.explanation
          )}</div>`
        : `<div class="plain-text">${item.explanation.replace(
            /\n/g,
            "<br>"
          )}</div>`;

      // 构建URL显示内容
      const urlDisplay = item.pageUrl
        ? `
      <div class="history-url">
        <strong>来源：</strong>
        <a href="${item.pageUrl}" target="_blank" title="${item.pageUrl}">
          ${item.pageTitle || item.pageUrl}
        </a>
      </div>
    `
        : "";

      const copyMarkdownText =
        i18nInstance?.t("sidebar.copyMarkdown") || "复制 Markdown";

      // 根据内容类型显示不同的内容
      const contentDisplay =
        item.contextType === "image"
          ? `<div class="history-image" title="${item.text}">
             <strong>图片：</strong><br>
             <img src="${item.text}" alt="History image" style="max-width: 100%; border-radius: 4px; margin-top: 8px;" onerror="this.style.display='none'">
           </div>`
          : `<div class="history-text" title="${item.text}"><strong>文字：</strong>${item.text}</div>`;

      content.innerHTML = `
      <div class="history-timestamp">${item.timestamp}</div>
      ${urlDisplay}
      ${contentDisplay}
      <div class="history-explanation"><strong>解释：</strong>${explanationHTML}</div>
      <div class="history-actions">
        <button class="view-in-main-btn" data-id="${id}">📌 在主区域查看</button>
        <button class="copy-markdown-btn" data-id="${id}">📋 ${copyMarkdownText}</button>
      </div>
    `;

      // 查看在主区域按钮
      const viewBtn = content.querySelector(".view-in-main-btn");
      if (viewBtn) {
        viewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          loadHistoryToMain(item);
        });
      }

      // 复制 Markdown 按钮
      const copyBtn = content.querySelector(".copy-markdown-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyHistoryAsMarkdown(item);
        });
      }

      header.addEventListener("click", () => {
        const isOpen = accordionItem.classList.contains("open");
        // 关闭所有其他项
        document.querySelectorAll(".accordion-item").forEach((el) => {
          el.classList.remove("open");
        });
        // 切换当前项
        if (!isOpen) {
          accordionItem.classList.add("open");
        }
      });

      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      container.appendChild(accordionItem);
    } catch (error) {
      console.error("Error rendering history item:", error, item);
    }
  });
}

// 将历史记录加载到主区域
async function loadHistoryToMain(item) {
  // 生成markdown内容，根据类型显示不同的标题
  let markdownContent = "";

  if (item.contextType === "image") {
    // 图片类型
    markdownContent = `## 选中图片\n\n`;
    markdownContent += `![图片](${item.text})\n\n`;
  } else {
    // 文字类型
    markdownContent = `## 选中文字\n\n`;
    // 如果文字包含特殊字符，需要转义或用代码块包围
    if (item.text.includes("\n") || item.text.includes("`")) {
      markdownContent += `\`\`\`\n${item.text}\n\`\`\`\n\n`;
    } else {
      markdownContent += `${item.text}\n\n`;
    }
  }

  // 添加AI回答
  markdownContent += `## AI 解释\n\n${item.explanation}\n\n`;

  // 准备传递给新标签页的数据
  const data = {
    title: item.promptName || "AI分析",
    timestamp: item.timestamp,
    source:
      item.pageUrl && item.pageTitle
        ? `[${item.pageTitle}](${item.pageUrl})`
        : item.pageUrl
        ? `<${item.pageUrl}>`
        : "",
    content: markdownContent,
    exportTime: new Date().toLocaleString("zh-CN"),
    contextType: item.contextType || "text", // 传递内容类型
  };

  // 使用 chrome.storage.local 临时存储数据，避免 URL 长度限制和编码问题
  const dataId = `markdown-viewer-${Date.now()}`;
  await chrome.storage.local.set({ [dataId]: data });

  // 在新标签页中打开markdown查看器，传递数据ID
  const viewerUrl =
    chrome.runtime.getURL("markdown-viewer.html") + "?id=" + dataId;

  chrome.tabs.create({ url: viewerUrl });
}

// 删除单个历史记录
async function deleteHistoryItem(id) {
  if (confirm(i18nInstance.t("sidebar.deleteConfirm"))) {
    try {
      await window.dbManager.deleteHistory(id);
      console.log("历史记录已删除");

      // 重新加载历史记录
      await loadHistory();
      updatePromptFilterOptions();
      await filterHistory(); // 重新应用过滤条件
    } catch (error) {
      console.error("删除历史记录失败:", error);
      // 降级处理
      const index = history.findIndex((h) => h.id === id);
      if (index !== -1) {
        history.splice(index, 1);
        chrome.storage.local.set({ history });
        updatePromptFilterOptions();
        await filterHistory();
      }
    }
  }
}

// 清空所有历史记录
async function clearAllHistory() {
  if (confirm(i18nInstance.t("sidebar.clearAllConfirm"))) {
    try {
      await window.dbManager.clearAllHistory();
      console.log("所有历史记录已清空");

      // 重新加载历史记录
      await loadHistory();
      updatePromptFilterOptions();
      renderHistory();
      // 如果没有当前解释，隐藏解释区域
      if (!hasCurrentExplanation) {
        hideCurrentExplanation();
      }
    } catch (error) {
      console.error("清空历史记录失败:", error);
      // 降级处理
      history = [];
      filteredHistory = [];
      chrome.storage.local.set({ history });
      updatePromptFilterOptions();
      renderHistory();
      if (!hasCurrentExplanation) {
        hideCurrentExplanation();
      }
    }
  }
}

// 复制历史记录为 Markdown 格式
function copyHistoryAsMarkdown(item) {
  // 构建 Markdown 格式的文本
  let markdownText = `# ${item.promptName || "AI分析"}\n\n`;

  // 添加时间戳
  markdownText += `**时间：** ${item.timestamp}\n\n`;

  // 添加来源信息
  if (item.pageUrl && item.pageTitle) {
    markdownText += `**来源：** [${item.pageTitle}](${item.pageUrl})\n\n`;
  } else if (item.pageUrl) {
    markdownText += `**来源：** <${item.pageUrl}>\n\n`;
  }

  // 添加选中的内容，根据类型显示不同的标题
  if (item.contextType === "image") {
    // 图片类型
    markdownText += `## 选中图片\n\n`;
    markdownText += `![图片](${item.text})\n\n`;
  } else {
    // 文字类型
    markdownText += `## 选中文字\n\n`;
    // 如果文字包含特殊字符，需要转义或用代码块包围
    if (item.text.includes("\n") || item.text.includes("`")) {
      markdownText += `\`\`\`\n${item.text}\n\`\`\`\n\n`;
    } else {
      markdownText += `${item.text}\n\n`;
    }
  }

  // 添加AI回答
  markdownText += `## AI 解释\n\n${item.explanation}\n\n`;

  // 添加分隔线
  markdownText += `---\n\n*导出时间：${new Date().toLocaleString("zh-CN")}*`;

  // 使用 Clipboard API 复制到剪贴板
  navigator.clipboard
    .writeText(markdownText)
    .then(() => {
      // 显示复制成功的提示
      showCopySuccessMessage();
    })
    .catch((err) => {
      console.error("复制失败:", err);
      // 降级到传统的复制方法
      fallbackCopyToClipboard(markdownText);
    });
}

// 显示复制成功的消息
function showCopySuccessMessage() {
  // 创建一个临时的提示元素
  const message = document.createElement("div");
  message.className = "copy-success-message";
  message.textContent = "✅ " + i18nInstance.t("sidebar.copySuccess");
  document.body.appendChild(message);

  // 3秒后移除提示
  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }, 3000);
}

// 降级复制方法（兼容旧浏览器）
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand("copy"); // 降级方案，用于不支持 Clipboard API 的旧浏览器
    showCopySuccessMessage();
  } catch (err) {
    console.error("复制失败:", err);
    alert(i18nInstance.t("sidebar.copyFailed"));
  }

  document.body.removeChild(textArea);
}

// 更新提示词过滤器选项
async function updatePromptFilterOptions() {
  const promptFilter = document.getElementById("promptFilter");
  const currentValue = promptFilter.value;

  try {
    // 从数据库获取唯一的提示词名称
    const promptNames = await window.dbManager.getUniquePromptNames();

    // 清空现有选项
    promptFilter.innerHTML = `<option value="">${i18nInstance.t(
      "sidebar.allPrompts"
    )}</option>`;

    // 添加提示词选项
    promptNames.forEach((promptName) => {
      const option = document.createElement("option");
      option.value = promptName;
      option.textContent = promptName;
      promptFilter.appendChild(option);
    });

    // 恢复之前的选择（如果还存在）
    if (currentValue && promptNames.includes(currentValue)) {
      promptFilter.value = currentValue;
    }
  } catch (error) {
    console.error("获取提示词列表失败:", error);
    // 降级：从内存中获取
    const promptNames = [
      ...new Set(history.map((item) => item.promptName).filter(Boolean)),
    ];

    promptFilter.innerHTML = `<option value="">${i18nInstance.t(
      "sidebar.allPrompts"
    )}</option>`;

    promptNames.forEach((promptName) => {
      const option = document.createElement("option");
      option.value = promptName;
      option.textContent = promptName;
      promptFilter.appendChild(option);
    });

    if (currentValue && promptNames.includes(currentValue)) {
      promptFilter.value = currentValue;
    }
  }
}

// 过滤历史记录
async function filterHistory() {
  const searchQuery = document
    .getElementById("historySearch")
    .value.toLowerCase()
    .trim();
  const selectedPrompt = document.getElementById("promptFilter").value;

  try {
    // 使用数据库搜索
    if (searchQuery || selectedPrompt) {
      filteredHistory = await window.dbManager.searchHistory(
        searchQuery,
        selectedPrompt
      );
    } else {
      // 如果没有过滤条件，显示所有历史记录
      filteredHistory = [...history];
    }
  } catch (error) {
    console.error("搜索历史记录失败:", error);
    // 降级：使用内存过滤
    filteredHistory = history.filter((item) => {
      // 提示词过滤
      if (selectedPrompt && item.promptName !== selectedPrompt) {
        return false;
      }

      // 关键词搜索（在文本内容和解释中搜索）
      if (searchQuery) {
        const searchableText = (
          (item.text || "") +
          " " +
          (item.explanation || "") +
          " " +
          (item.promptName || "") +
          " " +
          (item.sourceInfo || "") +
          " " +
          (item.pageTitle || "")
        ).toLowerCase();

        if (!searchableText.includes(searchQuery)) {
          return false;
        }
      }

      return true;
    });
  }

  await renderHistory();
}

// 清空搜索
async function clearSearch() {
  document.getElementById("historySearch").value = "";
  await filterHistory();
}

// 清空所有过滤器
async function clearFilters() {
  document.getElementById("historySearch").value = "";
  document.getElementById("promptFilter").value = "";
  await filterHistory();
}
