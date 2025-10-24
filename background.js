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
    contexts: ["selection", "page"],
  });

  // 过滤并创建选中文字的子菜单
  const selectionPrompts = prompts.filter(p => p.contextType === 'selection' || p.contextType === 'both');
  const pagePrompts = prompts.filter(p => p.contextType === 'page' || p.contextType === 'both');

  // 为选中文字创建子菜单
  if (selectionPrompts.length > 0) {
    selectionPrompts.forEach((prompt, index) => {
      chrome.contextMenus.create({
        id: `prompt_selection_${prompts.indexOf(prompt)}`,
        parentId: "aiPromptMenu",
        title: prompt.name,
        contexts: ["selection"],
      });
    });
  }

  // 为整个页面创建子菜单
  if (pagePrompts.length > 0) {
    // 如果同时有选中文字的菜单，添加分隔符
    if (selectionPrompts.length > 0) {
      chrome.contextMenus.create({
        id: "separator",
        parentId: "aiPromptMenu",
        type: "separator",
        contexts: ["page"],
      });
    }

    pagePrompts.forEach((prompt, index) => {
      chrome.contextMenus.create({
        id: `prompt_page_${prompts.indexOf(prompt)}`,
        parentId: "aiPromptMenu",
        title: `📄 ${prompt.name}`,
        contexts: ["page"],
      });
    });
  }
}

// 获取默认提示词
function getDefaultPrompts() {
  return [
    {
      name: "解释含义",
      userPromptTemplate: "请解释以下文字的含义：\n\n{text}",
      contextType: "selection" // selection: 选中文字, page: 整个页面
    },
    {
      name: "翻译成中文",
      userPromptTemplate: "请将以下文字翻译成中文：\n\n{text}",
      contextType: "selection"
    },
    {
      name: "总结要点",
      userPromptTemplate: "请总结以下文字的主要要点：\n\n{text}",
      contextType: "both" // both: 两种场景都支持
    },
    {
      name: "分析语法",
      userPromptTemplate: "请分析以下文字的语法结构和用法：\n\n{text}",
      contextType: "selection"
    },
    {
      name: "总结网页内容",
      userPromptTemplate: "请总结以下网页的主要内容：\n\n{text}",
      contextType: "page"
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
  if (info.menuItemId.toString().startsWith("prompt_")) {
    // 解析菜单项ID
    const match = info.menuItemId.toString().match(/prompt_(\w+)_(\d+)/);
    if (match) {
      const contextType = match[1]; // selection 或 page
      const promptIndex = parseInt(match[2]);

      // 获取提示词配置
      const result = await chrome.storage.sync.get(['prompts']);
      const prompts = result.prompts || getDefaultPrompts();
      const prompt = prompts[promptIndex];

      // 发送消息到content script
      chrome.tabs.sendMessage(tab.id, {
        action: contextType === 'page' ? "explainPage" : "explainText",
        text: contextType === 'page' ? null : info.selectionText,
        promptTemplate: prompt.userPromptTemplate,
        promptName: prompt.name // 传递提示词名称
      });
    }
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
