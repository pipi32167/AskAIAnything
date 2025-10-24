// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainText",
    title: '使用AI解释 "%s"',
    contexts: ["selection"],
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
