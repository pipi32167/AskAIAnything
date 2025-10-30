// 使用 marked.js 进行 Markdown 渲染
class MarkdownRenderer {
  constructor() {
    // 配置 marked 选项 - 紧凑模式
    marked.setOptions({
      breaks: false,      // 启用自动换行转换（单换行变成 <br>）
      gfm: true,         // 启用 GitHub Flavored Markdown
      sanitize: false,   // 允许 HTML（已通过 API 清理）
      sanitizeFn: null,
      smartLists: true,  // 智能列表
      smartypants: false, // 关闭智能标点（避免多余处理）
    });
  }

  // 解析 Markdown 文本
  parse(text) {
    if (!text) return '';
    try {
      return marked.parse(text);
    } catch (error) {
      console.error('Markdown 解析错误:', error);
      return text; // 如果解析失败，返回原文本
    }
  }

  // 检测文本是否包含 Markdown 语法
  hasMarkdown(text) {
    if (!text) return false;

    // 简单检测常见 Markdown 语法
    const markdownPatterns = [
      /^#{1,6}\s+/m,           // 标题
      /\*\*.*?\*\*/,           // 粗体
      /\*.*?\*/,               // 斜体
      /```[\s\S]*?```/,        // 代码块
      /`[^`]+`/,               // 内联代码
      /\[.*?\]\(.*?\)/,        // 链接
      /^[\s]*[-*]\s+/m,        // 无序列表
      /^[\s]*\d+\.\s+/m,       // 有序列表
      /^[\s]*[-*_]{3,}[\s]*$/m, // 水平分隔线
      /\n\n/,                  // 段落
      /\n(?!$)/,               // 单个换行（会被转换为 <br>）
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }
}

// 创建全局实例
const markdownParser = new MarkdownRenderer();