// 创建右键菜单
chrome.runtime.onInstalled.addListener(async () => {
  await migratePromptsIfNeeded();
  createContextMenu();
});

// 迁移旧配置，添加图片提示词（如果不存在）
async function migratePromptsIfNeeded() {
  const result = await chrome.storage.sync.get(["prompts"]);
  let prompts = result.prompts;

  // 如果没有配置，不需要迁移
  if (!prompts || prompts.length === 0) {
    return;
  }

  // 检查是否已有图片类型的提示词
  const hasImagePrompt = prompts.some(p => p.contextType === "image");

  // 如果没有图片提示词，添加默认的
  if (!hasImagePrompt) {
    const imagePrompt = {
      name: "分析图片",
      userPromptTemplate: "请描述并分析这张图片的内容",
      contextType: "image",
      systemPrompt:
        "你是一个专业的图像分析助手，能够准确描述图片内容并提供深入的分析。请用中文详细描述图片中的元素、场景、文字等信息。",
      apiModel: "default",
      maxTokens: "default",
    };
    prompts.push(imagePrompt);

    // 保存更新后的配置
    await chrome.storage.sync.set({ prompts });
    console.log("已自动添加图片分析提示词");
  }
}

// 创建动态右键菜单
async function createContextMenu() {
  // 获取保存的提示词
  const result = await chrome.storage.sync.get(["prompts"]);
  const prompts = result.prompts || getDefaultPrompts();

  // 创建主菜单项
  chrome.contextMenus.create({
    id: "aiPromptMenu",
    title: "Ask AI",
    contexts: ["selection", "page", "image"],
  });

  // 过滤并创建选中文字的子菜单
  const selectionPrompts = prompts.filter(
    (p) => p.contextType === "selection" || p.contextType === "both"
  );
  const pagePrompts = prompts.filter(
    (p) => p.contextType === "page" || p.contextType === "both"
  );
  const imagePrompts = prompts.filter(
    (p) => p.contextType === "image" || p.contextType === "both"
  );

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

  // 为图片创建子菜单
  if (imagePrompts.length > 0) {
    // 如果有其他菜单项，添加分隔符
    if (selectionPrompts.length > 0 || pagePrompts.length > 0) {
      chrome.contextMenus.create({
        id: "imageSeparator",
        parentId: "aiPromptMenu",
        type: "separator",
        contexts: ["image"],
      });
    }

    imagePrompts.forEach((prompt, index) => {
      chrome.contextMenus.create({
        id: `prompt_image_${prompts.indexOf(prompt)}`,
        parentId: "aiPromptMenu",
        title: `🖼️ ${prompt.name}`,
        contexts: ["image"],
      });
    });
  }
}

// 获取默认提示词
function getDefaultPrompts() {
  return [
    {
      name: "分析文字",
      userPromptTemplate: "请分析以下文字：\n\n{text}",
      contextType: "selection", // selection: 选中文字, page: 整个页面, image: 图片
      systemPrompt:
        "你是一个专业的AI助手,可以回答各种关于文字的问题。请用简洁清晰的中文回答。",
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
      contextType: "both", // both: 两种场景都支持
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
    {
      name: "分析图片",
      userPromptTemplate: "请描述并分析这张图片的内容",
      contextType: "image",
      systemPrompt:
        "你是一个专业的图像分析助手，能够准确描述图片内容并提供深入的分析。请用中文详细描述图片中的元素、场景、文字等信息。",
      apiModel: "default",
      maxTokens: "default",
    },
  ];
}

// 处理扩展图标点击 - 打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  // 打开侧边栏
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.toString().startsWith("prompt_")) {
    // 解析菜单项ID
    const match = info.menuItemId.toString().match(/prompt_(\w+)_(\d+)/);
    if (match) {
      const contextType = match[1]; // selection, page 或 image
      const promptIndex = parseInt(match[2]);

      // 获取提示词配置
      const result = await chrome.storage.sync.get(["prompts"]);
      const prompts = result.prompts || getDefaultPrompts();
      const prompt = prompts[promptIndex];

      // 根据不同的上下文类型发送不同的消息
      if (contextType === "image") {
        // 处理图片 - 需要content script转换图片
        chrome.tabs.sendMessage(tab.id, {
          action: "prepareImageData",
          imageUrl: info.srcUrl,
          promptTemplate: prompt.userPromptTemplate,
          promptName: prompt.name,
          promptConfig: {
            systemPrompt: prompt.systemPrompt,
            apiModel: prompt.apiModel,
            maxTokens: prompt.maxTokens,
          },
        });
      } else if (contextType === "page") {
        // 处理整个页面 - 需要content script提取页面文本
        chrome.tabs.sendMessage(tab.id, {
          action: "preparePageData",
          promptTemplate: prompt.userPromptTemplate,
          promptName: prompt.name,
          promptConfig: {
            systemPrompt: prompt.systemPrompt,
            apiModel: prompt.apiModel,
            maxTokens: prompt.maxTokens,
          },
        });
      } else {
        // 处理选中文本 - 直接发送给sidebar
        const pageTitle = tab.title || "未命名页面";
        const pageUrl = tab.url;
        const text = info.selectionText;
        const sourceInfo = text.length > 30 ? text.substring(0, 30) + "..." : text;

        // 打开侧边栏并发送数据
        await chrome.sidePanel.open({ windowId: tab.windowId });

        // 延迟一下确保sidebar已加载
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: "explainText",
            text: text,
            promptTemplate: prompt.userPromptTemplate,
            promptName: prompt.name,
            sourceInfo: sourceInfo,
            contextType: "selection",
            pageUrl: pageUrl,
            pageTitle: pageTitle,
            promptConfig: {
              systemPrompt: prompt.systemPrompt,
              apiModel: prompt.apiModel,
              maxTokens: prompt.maxTokens,
            },
          });
        }, 100);
      }
    }
  }
});

// 处理来自sidebar和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSettings") {
    chrome.runtime.openOptionsPage();
  } else if (message.action === "refreshContextMenu") {
    // 刷新右键菜单
    chrome.contextMenus.removeAll();
    createContextMenu();
  } else if (message.action === "dataReady") {
    // Content script已准备好数据，打开侧边栏
    // 获取tab的windowId
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        await chrome.sidePanel.open({ windowId: tabs[0].windowId });

        // 延迟一下确保sidebar已加载，然后转发消息
        setTimeout(() => {
          chrome.runtime.sendMessage(message.data);
        }, 100);
      }
    });
  }
});
