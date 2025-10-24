// 轻量级Markdown解析器
class SimpleMarkdown {
  constructor() {
    this.rules = {
      // 标题 (##)
      headers: {
        pattern: /^(#{1,6})\s+(.+)$/gm,
        replacement: (match, hashes, content) => {
          const level = hashes.length;
          return `<h${level}>${content.trim()}</h${level}>`;
        }
      },

      // 粗体 (**text**)
      bold: {
        pattern: /\*\*(.+?)\*\*/g,
        replacement: '<strong>$1</strong>'
      },

      // 斜体 (*text*)
      italic: {
        pattern: /\*(.+?)\*/g,
        replacement: '<em>$1</em>'
      },

      // 代码块 (```code```)
      codeBlock: {
        pattern: /```([\s\S]*?)```/g,
        replacement: '<pre><code>$1</code></pre>'
      },

      // 内联代码 (`code`)
      inlineCode: {
        pattern: /`([^`]+)`/g,
        replacement: '<code>$1</code>'
      },

      // 水平分隔线 (---)
      horizontalRule: {
        pattern: /^[\s]*[-*_]{3,}[\s]*$/gm,
        replacement: '<hr>'
      },

      // 链接 ([text](url))
      link: {
        pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
        replacement: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      },

      // 无序列表 (- 或 * 开头)
      unorderedList: {
        pattern: /^[\s]*[-*]\s+(.+)$/gm,
        replacement: '<li>$1</li>',
        process: (text) => {
          const lines = text.split('\n');
          let inList = false;
          let result = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[\s]*[-*]\s+/.test(line)) {
              if (!inList) {
                result.push('<ul>');
                inList = true;
              }
              result.push(line.replace(/^[\s]*[-*]\s+/, '<li>').replace(/<\/li>$/, '</li>'));
            } else {
              if (inList) {
                result.push('</ul>');
                inList = false;
              }
              result.push(line);
            }
          }

          if (inList) {
            result.push('</ul>');
          }

          return result.join('\n');
        }
      },

      // 有序列表 (1. 开头)
      orderedList: {
        pattern: /^[\s]*\d+\.\s+(.+)$/gm,
        replacement: '<li>$1</li>',
        process: (text) => {
          const lines = text.split('\n');
          let inList = false;
          let result = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[\s]*\d+\.\s+/.test(line)) {
              if (!inList) {
                result.push('<ol>');
                inList = true;
              }
              result.push(line.replace(/^[\s]*\d+\.\s+/, '<li>').replace(/<\/li>$/, '</li>'));
            } else {
              if (inList) {
                result.push('</ol>');
                inList = false;
              }
              result.push(line);
            }
          }

          if (inList) {
            result.push('</ol>');
          }

          return result.join('\n');
        }
      },

      // 段落 (空行分隔)
      paragraph: {
        pattern: /^(?!<[h|u|o]|<p|<hr)(.+)$/gm,
        replacement: '<p>$1</p>',
        process: (text) => {
          return text.split('\n\n')
            .filter(line => line.trim() && !/^<[^>]+>/.test(line.trim()))
            .map(line => line.trim() ? `<p>${line.trim()}</p>` : '')
            .join('\n');
        }
      },

      // 换行 (单个换行符)
      lineBreak: {
        pattern: /\n/g,
        replacement: ''
      }
    };
  }

  parse(text) {
    if (!text) return '';

    let html = text;

    // 处理代码块（优先处理，避免被其他规则干扰）
    html = html.replace(this.rules.codeBlock.pattern, this.rules.codeBlock.replacement);

    // 处理水平分隔线
    html = html.replace(this.rules.horizontalRule.pattern, this.rules.horizontalRule.replacement);

    // 处理标题
    html = html.replace(this.rules.headers.pattern, this.rules.headers.replacement);

    // 处理列表
    html = this.rules.unorderedList.process ?
      this.rules.unorderedList.process(html) :
      html.replace(this.rules.unorderedList.pattern, this.rules.unorderedList.replacement);

    html = this.rules.orderedList.process ?
      this.rules.orderedList.process(html) :
      html.replace(this.rules.orderedList.pattern, this.rules.orderedList.replacement);

    // 处理内联元素
    html = html.replace(this.rules.bold.pattern, this.rules.bold.replacement);
    html = html.replace(this.rules.italic.pattern, this.rules.italic.replacement);
    html = html.replace(this.rules.inlineCode.pattern, this.rules.inlineCode.replacement);
    html = html.replace(this.rules.link.pattern, this.rules.link.replacement);

    // 处理段落
    const lines = html.split('\n\n');
    const processedLines = [];

    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith('<') && !line.startsWith('</')) {
        // 如果不是HTML标签，包装成段落
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }

    html = processedLines.join('\n');

    // 处理换行
    html = html.replace(/\n/g, '');

    // 清理多余的段落标签
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>|<ol>|<pre>|<hr>)/g, '$1');
    html = html.replace(/(<\/ul>|<\/ol>|<\/pre>|<hr>)<\/p>/g, '$1');

    return html;
  }

  // 检测文本是否包含Markdown语法
  hasMarkdown(text) {
    if (!text) return false;

    const markdownPatterns = [
      /#{1,6}\s+/, // 标题
      /\*\*.*?\*\*/, // 粗体
      /\*.*?\*/, // 斜体
      /```.*?```/, // 代码块
      /`[^`]+`/, // 内联代码
      /\[.*?\]\(.*?\)/, // 链接
      /^[\s]*[-*]\s+/m, // 无序列表
      /^[\s]*\d+\.\s+/m, // 有序列表
      /^[\s]*[-*_]{3,}[\s]*$/m // 水平分隔线
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }
}

// 创建全局实例
const markdownParser = new SimpleMarkdown();