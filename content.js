// Content Script - 负责在页面中注入侧边栏
let sidebarIframe = null;

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'explainText') {
    showSidebar(message.text);
  }
});

// 监听来自侧边栏的消息
window.addEventListener('message', (event) => {
  if (event.data.action === 'closeSidebar') {
    hideSidebar();
  }
});

// 显示侧边栏
function showSidebar(text) {
  // 如果侧边栏不存在，创建它
  if (!sidebarIframe) {
    createSidebar();
  }

  // 显示侧边栏
  sidebarIframe.style.display = 'block';

  // 等待iframe加载完成后发送消息
  setTimeout(() => {
    sidebarIframe.contentWindow.postMessage({
      action: 'explainText',
      text: text
    }, '*');
  }, 100);
}

// 创建侧边栏
function createSidebar() {
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'ai-explainer-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  sidebarIframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    border: none;
    border-left: 2px solid #ccc;
    z-index: 2147483647;
    background: white;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  `;

  document.body.appendChild(sidebarIframe);
}

// 隐藏侧边栏
function hideSidebar() {
  if (sidebarIframe) {
    sidebarIframe.style.display = 'none';
  }
}
