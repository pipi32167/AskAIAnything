// Content Script - 负责在页面中注入侧边栏
let sidebarIframe = null;

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'explainText') {
    showSidebar(message.text, message.promptTemplate);
  } else if (message.action === 'explainPage') {
    // 提取整个页面的文本内容
    const pageText = extractPageText();
    showSidebar(pageText, message.promptTemplate);
  } else if (message.action === 'toggleSidebar') {
    toggleSidebar();
  }
});

// 监听来自侧边栏的消息
window.addEventListener('message', (event) => {
  if (event.data.action === 'closeSidebar') {
    hideSidebar();
  }
});

// 切换侧边栏显示/隐藏
function toggleSidebar() {
  // 如果侧边栏不存在，创建并显示
  if (!sidebarIframe) {
    createSidebar();
    sidebarIframe.style.display = 'block';
  } else {
    // 切换显示状态
    if (sidebarIframe.style.display === 'none') {
      sidebarIframe.style.display = 'block';
    } else {
      // 隐藏前重置当前解释状态
      sidebarIframe.contentWindow.postMessage({ action: 'reset' }, '*');
      sidebarIframe.style.display = 'none';
    }
  }
}

// 显示侧边栏
function showSidebar(text, promptTemplate) {
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
      text: text,
      promptTemplate: promptTemplate
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
    // 隐藏前重置当前解释���态
    sidebarIframe.contentWindow.postMessage({ action: 'reset' }, '*');
    sidebarIframe.style.display = 'none';
  }
}

// 提取整个页面的文本内容
function extractPageText() {
  // 移除不需要的元素
  const elementsToRemove = ['script', 'style', 'noscript', 'iframe', 'svg'];
  const clonedDocument = document.cloneNode(true);

  // 移除脚本和样��元素
  elementsToRemove.forEach(tag => {
    const elements = clonedDocument.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].remove();
    }
  });

  // 移除隐藏的元素
  const hiddenElements = clonedDocument.querySelectorAll('[style*="display: none"], [style*="display:none"]');
  hiddenElements.forEach(el => el.remove());

  // 提取主要内容区域
  const mainContent =
    clonedDocument.querySelector('main') ||
    clonedDocument.querySelector('[role="main"]') ||
    clonedDocument.querySelector('article') ||
    clonedDocument.querySelector('.content') ||
    clonedDocument.querySelector('#content') ||
    clonedDocument.querySelector('.main') ||
    clonedDocument.body;

  if (!mainContent) {
    return '无法提取页面内容';
  }

  // 提取文本并清理
  let text = mainContent.innerText || mainContent.textContent || '';

  // 清理文本：移除多余空白字符，保留基本结构
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // 移除多个连续换行
    .replace(/[ \t]+/g, ' ') // 合并多个空格和制表符
    .replace(/^\s+|\s+$/g, '') // 移除首尾空白
    .trim();

  // 如果文本太短，尝试其他方法
  if (text.length < 100) {
    // 尝试提取标题和段落
    const paragraphs = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
      .map(el => el.textContent.trim())
      .filter(text => text.length > 10)
      .join('\n\n');

    if (paragraphs.length > text.length) {
      text = paragraphs;
    }
  }

  // 限制最大长度
  if (text.length > 8000) {
    text = text.substring(0, 8000) + '...（内容已截断）';
  }

  return text || '无法提取页面内容';
}
