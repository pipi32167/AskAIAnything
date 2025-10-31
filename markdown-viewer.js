// Markdown Viewer Script
// 从URL参数获取数据
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get("data");

if (dataParam) {
  try {
    const data = JSON.parse(decodeURIComponent(dataParam));

    // 设置标题
    document.getElementById("pageTitle").textContent =
      data.title || "AI 分析结果";

    // 设置时间戳
    if (data.timestamp) {
      document.getElementById("timestamp").textContent =
        "时间：" + data.timestamp;
    }

    // 设置来源
    if (data.source) {
      document.getElementById("source").textContent = "来源：" + data.source;
    }

    // 渲染markdown内容
    const contentElement = document.getElementById("markdownContent");
    contentElement.innerHTML = markdownParser.parse(data.content);

    // 设置导出信息
    if (data.exportTime) {
      document.getElementById("exportInfo").textContent =
        "导出时间：" + data.exportTime;
    }
  } catch (error) {
    console.error("解析数据失败:", error);
    document.querySelector(".container").innerHTML =
      "<h1>错误</h1><p>无法解析内容数据</p>";
  }
}

// 如果没有数据，显示错误信息
else {
  document.querySelector(".container").innerHTML =
    "<h1>错误</h1><p>无法加载内容</p>";
}
