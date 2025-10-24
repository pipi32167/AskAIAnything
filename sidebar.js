// 侧边栏逻辑
let currentText = "";
let history = [];
let i18nInstance;
let hasCurrentExplanation = false; // 标记是否有当前解释

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  i18nInstance = await initI18n();
  updateUILanguage();
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
}

// 设置事件监听
function setupEventListeners() {
  // 关闭按钮
  document.getElementById("closeSidebar").addEventListener("click", () => {
    hideCurrentExplanation(); // 关闭时隐藏当前解释
    window.parent.postMessage({ action: "closeSidebar" }, "*");
  });

  // 设置按钮
  document.getElementById("openSettings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openSettings" });
  });

  // 清空所有历史记录按钮
  document
    .getElementById("clearAllHistory")
    .addEventListener("click", clearAllHistory);

  // 接收来自content script的消息
  window.addEventListener("message", (event) => {
    if (event.data.action === "explainText") {
      handleExplainRequest(
        event.data.text,
        event.data.promptTemplate,
        event.data.promptName,
        event.data.sourceInfo,
        event.data.contextType,
        event.data.pageUrl,
        event.data.pageTitle
      );
    } else if (event.data.action === "reset") {
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
  contextType,
  pageUrl,
  pageTitle
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

  const selectedTextElement = document.getElementById("currentSelectedText");
  selectedTextElement.textContent = text;
  selectedTextElement.title = text; // 添加title以显示完整内容

  document.getElementById(
    "currentExplanation"
  ).innerHTML = `<div class="loading">${i18nInstance.t(
    "sidebar.analyzing"
  )}</div>`;

  try {
    // 调用AI API - 使用自定义提示词（如果提供）
    const explanation = await callAI(text, customPromptTemplate);

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
function displayExplanation(text) {
  const explanationDiv = document.getElementById("currentExplanation");

  if (markdownParser.hasMarkdown(text)) {
    // 如果包含Markdown语法，则渲染
    explanationDiv.innerHTML = `<div class="markdown-content">${markdownParser.parse(
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
async function callAI(text, customPromptTemplate) {
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

  // 使用自定义提示词或默认提示词
  const systemPrompt =
    config.systemPrompt ||
    "你是一个专业的语言助手，擅长解释文字的含义、上下文和用法。请用简洁清晰的中文回答。";

  // 优先使用右键菜单传递的提示词，否则使用设置中的提示词模板
  const userPromptTemplate =
    customPromptTemplate ||
    config.userPromptTemplate ||
    "请解释以下文字的含义：\n\n{text}";
  const userPrompt = userPromptTemplate.replace("{text}", text);

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
        model: config.apiModel || "gpt-3.5-turbo",
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
        max_tokens: config.maxTokens || 500,
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
function addToHistory(
  text,
  explanation,
  promptName,
  sourceInfo,
  pageUrl,
  pageTitle
) {
  const timestamp = new Date().toLocaleString("zh-CN");
  const historyItem = {
    text,
    explanation,
    timestamp,
    promptName: promptName || "解释",
    sourceInfo:
      sourceInfo || text.substring(0, 30) + (text.length > 30 ? "..." : ""),
    pageUrl: pageUrl || "",
    pageTitle: pageTitle || "",
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
  const data = await chrome.storage.local.get(["history"]);
  if (data.history) {
    history = data.history;
    renderHistory();
  }
}

// 渲染历史记录
function renderHistory() {
  const container = document.getElementById("historyAccordion");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `<div class="no-history">${i18nInstance.t(
      "sidebar.noHistory"
    )}</div>`;
    return;
  }

  history.forEach((item, index) => {
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
      deleteHistoryItem(index);
    });

    header.appendChild(headerText);
    header.appendChild(deleteBtn);

    const content = document.createElement("div");
    content.className = "accordion-content";

    // 渲染历史记录的解释（支持Markdown）
    const explanationHTML = markdownParser.hasMarkdown(item.explanation)
      ? `<div class="markdown-content">${markdownParser.parse(
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

    content.innerHTML = `
      <div class="history-timestamp">${item.timestamp}</div>
      ${urlDisplay}
      <div class="history-text" title="${item.text}"><strong>文字：</strong>${item.text}</div>
      <div class="history-explanation"><strong>解释：</strong>${explanationHTML}</div>
      <button class="view-in-main-btn" data-index="${index}">📌 在主区域查看</button>
    `;

    // 查看在主区域按钮
    const viewBtn = content.querySelector(".view-in-main-btn");
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadHistoryToMain(item);
    });

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
  });
}

// 将历史记录加载到主区域
function loadHistoryToMain(item) {
  currentText = item.text;
  hasCurrentExplanation = true;
  showCurrentExplanation();

  // 更新侧边栏标题
  const titleElement = document.getElementById("sidebarTitle");
  if (item.promptName && item.sourceInfo) {
    titleElement.textContent = `${item.promptName} - ${item.sourceInfo}`;
    titleElement.title = `${item.promptName} - ${item.sourceInfo}`;
  } else {
    titleElement.textContent = i18nInstance.t("sidebar.title");
  }

  const selectedTextElement = document.getElementById("currentSelectedText");
  selectedTextElement.textContent = item.text;
  selectedTextElement.title = item.text; // 添加title以显示完整内容

  displayExplanation(item.explanation);

  // 滚动到顶部
  document.querySelector(".sidebar-content").scrollTop = 0;
}

// 删除单个历史记录
function deleteHistoryItem(index) {
  if (confirm(i18nInstance.t("sidebar.deleteConfirm"))) {
    history.splice(index, 1);
    chrome.storage.local.set({ history });
    renderHistory();
  }
}

// 清空所有历史记录
function clearAllHistory() {
  if (confirm(i18nInstance.t("sidebar.clearAllConfirm"))) {
    history = [];
    chrome.storage.local.set({ history });
    renderHistory();
    // 如果没有当前解释，隐藏解释区域
    if (!hasCurrentExplanation) {
      hideCurrentExplanation();
    }
  }
}
