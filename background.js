// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainText",
    title: '使用AI解释 "%s"',
    contexts: ["selection"],
  });
});

// 处理扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  // 发送消息到content script打开侧边栏（不选择任何文字）
  chrome.tabs.sendMessage(tab.id, {
    action: "toggleSidebar"
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explainText" && info.selectionText) {
    // 发送消息到content script
    chrome.tabs.sendMessage(tab.id, {
      action: "explainText",
      text: info.selectionText,
    });
  }
});

// 处理来自sidebar的消息（打开设置页面）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSettings") {
    chrome.runtime.openOptionsPage();
  }
});
