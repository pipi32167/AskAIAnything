// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// 创建动态右键菜单
async function createContextMenu() {
  // 获取保存的提示词
  const result = await chrome.storage.sync.get(['prompts']);
  const prompts = result.prompts || getDefaultPrompts();

  // 创建主菜单项
  chrome.contextMenus.create({
    id: "aiPromptMenu",
    title: "Ask AI",
    contexts: ["selection"],
  });

  // 为每个提示词创建子菜单项
  prompts.forEach((prompt, index) => {
    chrome.contextMenus.create({
      id: `prompt_${index}`,
      parentId: "aiPromptMenu",
      title: prompt.name,
      contexts: ["selection"],
    });
  });
}

// 获取默认提示词
function getDefaultPrompts() {
  return [
    {
      name: "解释含义",
      userPromptTemplate: "请解释以下文字的含义：\n\n{text}"
    },
    {
      name: "翻译成中文",
      userPromptTemplate: "请将以下文字翻译成中文：\n\n{text}"
    },
    {
      name: "总结要点",
      userPromptTemplate: "请总结以下文字的主要要点：\n\n{text}"
    },
    {
      name: "分析语法",
      userPromptTemplate: "请分析以下文字的语法结构和用法：\n\n{text}"
    }
  ];
}

// 处理扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  // 发送消息到content script打开侧边栏（不选择任何文字）
  chrome.tabs.sendMessage(tab.id, {
    action: "toggleSidebar"
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith("prompt_") && info.selectionText) {
    // 获取提示词索引
    const promptIndex = parseInt(info.menuItemId.replace("prompt_", ""));

    // 获取提示词配置
    const result = await chrome.storage.sync.get(['prompts']);
    const prompts = result.prompts || getDefaultPrompts();
    const prompt = prompts[promptIndex];

    // 发送消息到content script
    chrome.tabs.sendMessage(tab.id, {
      action: "explainText",
      text: info.selectionText,
      promptTemplate: prompt.userPromptTemplate
    });
  }
});

// 处理来自sidebar的消息（打开设置页面）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSettings") {
    chrome.runtime.openOptionsPage();
  } else if (message.action === "refreshContextMenu") {
    // 刷新右键菜单
    chrome.contextMenus.removeAll();
    createContextMenu();
  }
});
