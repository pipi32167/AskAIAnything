// Content Script - 负责提取页面数据并发送给侧边栏

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "preparePageData") {
    // 提取整个页面的文本内容
    const pageText = extractPageText();
    const pageTitle = document.title || "未命名页面";
    const pageUrl = window.location.href;
    const sourceInfo = pageTitle;

    // 发送数据给background，让它打开侧边栏并转发
    chrome.runtime.sendMessage({
      action: "dataReady",
      data: {
        action: "explainText",
        text: pageText,
        promptTemplate: message.promptTemplate,
        promptName: message.promptName,
        sourceInfo: sourceInfo,
        contextType: "page",
        pageUrl: pageUrl,
        pageTitle: pageTitle,
        promptConfig: message.promptConfig,
      },
    });
  } else if (message.action === "prepareImageData") {
    // 处理图片分析
    const pageTitle = document.title || "未命名页面";
    const pageUrl = window.location.href;

    // 将图片转换为base64
    convertImageToBase64(message.imageUrl)
      .then((base64Image) => {
        // 发送数据给background
        chrome.runtime.sendMessage({
          action: "dataReady",
          data: {
            action: "explainImage",
            imageUrl: message.imageUrl,
            imageData: base64Image,
            promptTemplate: message.promptTemplate,
            promptName: message.promptName,
            sourceInfo: "图片分析",
            contextType: "image",
            pageUrl: pageUrl,
            pageTitle: pageTitle,
            promptConfig: message.promptConfig,
          },
        });
      })
      .catch(() => {
        // 图片转换失败很常见（CORS限制），静默处理，直接使用URL
        // 发送数据给background，使用URL而非base64
        chrome.runtime.sendMessage({
          action: "dataReady",
          data: {
            action: "explainImage",
            imageUrl: message.imageUrl,
            imageData: null,
            promptTemplate: message.promptTemplate,
            promptName: message.promptName,
            sourceInfo: "图片分析",
            contextType: "image",
            pageUrl: pageUrl,
            pageTitle: pageTitle,
            promptConfig: message.promptConfig,
          },
        });
      });
  }
});
// 提取整个页面的文本内容
function extractPageText() {
  // 克隆DOM以避免影响原页面
  const clonedBody = document.body.cloneNode(true);

  // 移除不需要的元素类型
  const elementsToRemove = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "audio",
    "video",
    "embed",
    "object",
    "link",
    "meta",
    "template",
  ];

  elementsToRemove.forEach((tag) => {
    const elements = clonedBody.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].remove();
    }
  });

  // 移除常见的导航、页眉、页脚、侧边栏、广告等
  const commonNonContentSelectors = [
    "nav",
    "header",
    "footer",
    "aside",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    ".navigation",
    ".nav",
    ".navbar",
    ".menu",
    ".sidebar",
    ".side-bar",
    ".header",
    ".footer",
    ".advertisement",
    ".ad",
    ".ads",
    ".advert",
    ".cookie",
    ".cookies",
    ".cookie-banner",
    ".cookie-consent",
    ".popup",
    ".modal",
    ".overlay",
    ".dialog",
    ".share",
    ".social",
    ".social-share",
    ".social-media",
    ".comment",
    ".comments",
    ".comment-section",
    ".related",
    ".related-posts",
    ".related-articles",
    ".breadcrumb",
    ".breadcrumbs",
    "#header",
    "#footer",
    "#sidebar",
    "#nav",
    "#navigation",
    '[class*="cookie"]',
    '[id*="cookie"]',
    '[class*="popup"]',
    '[id*="popup"]',
    '[class*="modal"]',
    '[id*="modal"]',
  ];

  commonNonContentSelectors.forEach((selector) => {
    try {
      const elements = clonedBody.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    } catch (e) {
      // 忽略无效选择器
    }
  });

  // 移除隐藏元素
  const allElements = clonedBody.getElementsByTagName("*");
  for (let i = allElements.length - 1; i >= 0; i--) {
    const el = allElements[i];
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      el.remove();
    }
  }

  // 移除侧边栏iframe（本扩展自己的）
  const sidebarIframe = clonedBody.querySelector("#ai-explainer-sidebar");
  if (sidebarIframe) {
    sidebarIframe.remove();
  }

  // 尝试找到主要内容区域
  let mainContent = null;
  // const contentSelectors = [
  //   "main",
  //   '[role="main"]',
  //   "article",
  //   ".article",
  //   ".post",
  //   ".entry",
  //   ".content",
  //   "#content",
  //   ".main",
  //   "#main",
  //   ".post-content",
  //   ".entry-content",
  //   ".article-content",
  // ];

  // for (const selector of contentSelectors) {
  //   mainContent = clonedBody.querySelector(selector);
  //   if (mainContent) break;
  // }

  // 如果没找到主内容，使用整个body
  // if (!mainContent || mainContent.textContent.trim().length < 200) {
  mainContent = clonedBody;
  // }

  // 转换为 Markdown 格式
  let markdown = convertToMarkdown(mainContent);
  // console.log("Extracted Markdown:", markdown);

  // 清理 Markdown
  markdown = markdown
    .replace(/\n{3,}/g, "\n\n") // 移除多个连续空行
    .replace(/^\s+|\s+$/gm, "") // 移除每行首尾空格
    .trim();

  // 限制最大长度
  const maxLength = 8000; // Markdown 格式可以稍微多一些，因为结构更清晰
  if (markdown.length > maxLength) {
    markdown =
      markdown.substring(0, maxLength) +
      "\n\n---\n*（内容已截断，仅显示前 " +
      maxLength +
      " 字符）*";
  }

  return markdown || "无法提取页面内容";
}

// 将 HTML 元素转换为 Markdown
function convertToMarkdown(element) {
  let markdown = "";

  function processNode(node) {
    if (!node) return "";

    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      return text ? text + " " : "";
    }

    // 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      let result = "";

      switch (tagName) {
        // 标题
        case "h1":
          result = "\n\n# " + getTextContent(node) + "\n\n";
          break;
        case "h2":
          result = "\n\n## " + getTextContent(node) + "\n\n";
          break;
        case "h3":
          result = "\n\n### " + getTextContent(node) + "\n\n";
          break;
        case "h4":
          result = "\n\n#### " + getTextContent(node) + "\n\n";
          break;
        case "h5":
          result = "\n\n##### " + getTextContent(node) + "\n\n";
          break;
        case "h6":
          result = "\n\n###### " + getTextContent(node) + "\n\n";
          break;

        // 段落
        case "p":
          result = "\n\n" + processChildren(node) + "\n\n";
          break;

        // 链接
        case "a":
          const href = node.getAttribute("href");
          const text = getTextContent(node);
          if (href && text) {
            result = `[${text}](${href})`;
          } else {
            result = text;
          }
          break;

        // 强调
        case "strong":
        case "b":
          result = "**" + getTextContent(node) + "**";
          break;
        case "em":
        case "i":
          result = "*" + getTextContent(node) + "*";
          break;

        // 代码
        case "code":
          result = "`" + getTextContent(node) + "`";
          break;
        case "pre":
          const code = getTextContent(node);
          result = "\n\n```\n" + code + "\n```\n\n";
          break;

        // 列表
        case "ul":
          result = "\n" + processListItems(node, "-") + "\n";
          break;
        case "ol":
          result = "\n" + processListItems(node, "1.") + "\n";
          break;
        case "li":
          // 由 processListItems 处理
          result = processChildren(node);
          break;

        // 引用
        case "blockquote":
          const quote = processChildren(node)
            .split("\n")
            .map((line) => "> " + line)
            .join("\n");
          result = "\n\n" + quote + "\n\n";
          break;

        // 水平线
        case "hr":
          result = "\n\n---\n\n";
          break;

        // 换行
        case "br":
          result = "  \n";
          break;

        // 图片
        case "img":
          const alt = node.getAttribute("alt") || "image";
          const src = node.getAttribute("src");
          if (src) {
            result = `![${alt}](${src})`;
          }
          break;

        // 表格（简化处理）
        case "table":
          result = "\n\n" + processTable(node) + "\n\n";
          break;

        // Div 和其他容器，递归处理子元素
        default:
          result = processChildren(node);
          break;
      }

      return result;
    }

    return "";
  }

  function processChildren(node) {
    let result = "";
    for (let child of node.childNodes) {
      result += processNode(child);
    }
    return result;
  }

  function getTextContent(node) {
    return (node.textContent || "").trim();
  }

  function processListItems(ul, marker) {
    let result = "";
    const items = ul.querySelectorAll(":scope > li");
    items.forEach((li, index) => {
      const prefix = marker === "1." ? `${index + 1}. ` : "- ";
      const content = processChildren(li).trim();
      if (content) {
        result += prefix + content + "\n";
      }
    });
    return result;
  }

  function processTable(table) {
    let result = "";
    const rows = table.querySelectorAll("tr");
    if (rows.length === 0) return "";

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("th, td");
      const cellContents = Array.from(cells).map((cell) =>
        getTextContent(cell)
      );

      result += "| " + cellContents.join(" | ") + " |\n";

      // 添加表头分隔符
      if (rowIndex === 0 && row.querySelectorAll("th").length > 0) {
        result += "| " + cellContents.map(() => "---").join(" | ") + " |\n";
      }
    });

    return result;
  }

  markdown = processNode(element);
  return markdown;
}
