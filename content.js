// Content Script - 负责在页面中注入侧边栏
let sidebarIframe = null;

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'explainText') {
    showSidebar(message.text, message.promptTemplate, message.promptName, 'selection');
  } else if (message.action === 'explainPage') {
    // 提取整个页面的文本内容
    const pageText = extractPageText();
    showSidebar(pageText, message.promptTemplate, message.promptName, 'page');
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
function showSidebar(text, promptTemplate, promptName, contextType) {
  // 如果侧边栏不存在，创建它
  if (!sidebarIframe) {
    createSidebar();
  }

  // 显示侧边栏
  sidebarIframe.style.display = 'block';

  // 获取页面标题或选中内容摘要
  const pageTitle = document.title || '未命名页面';
  const sourceInfo = contextType === 'page'
    ? pageTitle
    : (text.length > 30 ? text.substring(0, 30) + '...' : text);

  // 等待iframe加载完成后发送消息
  setTimeout(() => {
    sidebarIframe.contentWindow.postMessage({
      action: 'explainText',
      text: text,
      promptTemplate: promptTemplate,
      promptName: promptName || '解释',
      sourceInfo: sourceInfo,
      contextType: contextType
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
  // 克隆DOM以避免影响原页面
  const clonedBody = document.body.cloneNode(true);

  // 移除不需要的元素类型
  const elementsToRemove = [
    'script', 'style', 'noscript', 'iframe', 'svg',
    'canvas', 'audio', 'video', 'embed', 'object',
    'link', 'meta', 'template'
  ];

  elementsToRemove.forEach(tag => {
    const elements = clonedBody.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].remove();
    }
  });

  // 移除常见的导航、页眉、页脚、侧边栏、广告等
  const commonNonContentSelectors = [
    'nav', 'header', 'footer', 'aside',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
    '.navigation', '.nav', '.navbar', '.menu', '.sidebar', '.side-bar',
    '.header', '.footer', '.advertisement', '.ad', '.ads', '.advert',
    '.cookie', '.cookies', '.cookie-banner', '.cookie-consent',
    '.popup', '.modal', '.overlay', '.dialog',
    '.share', '.social', '.social-share', '.social-media',
    '.comment', '.comments', '.comment-section',
    '.related', '.related-posts', '.related-articles',
    '.breadcrumb', '.breadcrumbs',
    '#header', '#footer', '#sidebar', '#nav', '#navigation',
    '[class*="cookie"]', '[id*="cookie"]',
    '[class*="popup"]', '[id*="popup"]',
    '[class*="modal"]', '[id*="modal"]'
  ];

  commonNonContentSelectors.forEach(selector => {
    try {
      const elements = clonedBody.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    } catch (e) {
      // 忽略无效选择器
    }
  });

  // 移除隐藏元素
  const allElements = clonedBody.getElementsByTagName('*');
  for (let i = allElements.length - 1; i >= 0; i--) {
    const el = allElements[i];
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      el.remove();
    }
  }

  // 移除侧边栏iframe（本扩展自己的）
  const sidebarIframe = clonedBody.querySelector('#ai-explainer-sidebar');
  if (sidebarIframe) {
    sidebarIframe.remove();
  }

  // 尝试找到主要内容区域
  let mainContent = null;
  const contentSelectors = [
    'main',
    '[role="main"]',
    'article',
    '.article',
    '.post',
    '.entry',
    '.content',
    '#content',
    '.main',
    '#main',
    '.post-content',
    '.entry-content',
    '.article-content'
  ];

  for (const selector of contentSelectors) {
    mainContent = clonedBody.querySelector(selector);
    if (mainContent) break;
  }

  // 如果没找到主内容，使用整个body
  if (!mainContent) {
    mainContent = clonedBody;
  }

  // 提取文本
  let text = mainContent.innerText || mainContent.textContent || '';

  // 清理文本
  text = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // 移除多个连续空行
    .trim();

  // 限制最大长度
  const maxLength = 6000; // 降低最大长度以节省token
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '\n\n...（内容已截断，仅显示前' + maxLength + '字符）';
  }

  return text || '无法提取页面内容';
}
