// Markdown Viewer Script
// 从URL参数获取数据ID
const urlParams = new URLSearchParams(window.location.search);
const dataId = urlParams.get("id");
const dataParam = urlParams.get("data"); // 兼容旧方式

// 异步加载数据
(async function loadData() {
  try {
    let data = null;

    // 优先尝试从 chrome.storage 加载（新方式）
    if (dataId) {
      const result = await chrome.storage.local.get([dataId]);
      data = result[dataId];

      // 加载后清理临时数据
      if (data) {
        await chrome.storage.local.remove([dataId]);
      }
    }
    // 降级：尝试从 URL 参数加载（旧方式）
    else if (dataParam) {
      try {
        data = JSON.parse(decodeURIComponent(dataParam));
      } catch (e) {
        console.error("URL参数解析失败:", e);
      }
    }

    if (data) {
      // 设置标题
      document.getElementById("pageTitle").textContent =
        data.title || "AI 分析结果";

      // 设置时间戳
      if (data.timestamp) {
        document.getElementById("timestamp").textContent =
          "时间：" + data.timestamp;
      }

      // 设置来源（解析 Markdown 链接）
      if (data.source) {
        const sourceElement = document.getElementById("source");
        // 解析 Markdown 并移除外层的 <p> 标签以保持内联显示
        const parsedSource = markdownParser.parse(data.source);
        const cleanSource = parsedSource.replace(/^<p>|<\/p>$/g, "");
        sourceElement.innerHTML = "来源：" + cleanSource;
      }

      // 渲染markdown内容
      const contentElement = document.getElementById("markdownContent");
      contentElement.innerHTML = markdownParser.parse(data.content);

      // 设置导出信息
      if (data.exportTime) {
        document.getElementById("exportInfo").textContent =
          "导出时间：" + data.exportTime;
      }
    } else {
      throw new Error("未找到数据");
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    document.querySelector(".container").innerHTML =
      "<h1>错误</h1><p>无法加载内容数据</p>";
  }
})();
