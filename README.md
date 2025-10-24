# Ask AI Anything - Chrome 扩展

一个Chrome扩展，可以选择网页上的任意文字，向AI询问任何问题，并在侧边栏中显示结果和历史记录。

![演示效果](https://via.placeholder.com/800x450.png?text=Ask+AI+Anything+Demo)

## 功能特点

- ✨ 选择网页文字，右键即可向AI提问
- 📊 侧边栏显示AI回答
- 📝 自动保存历史记录（最多20条）
- 🗂️ 折叠式历史列表，仅显示文字标题
- ⚙️ 支持自定义AI API配置
- 🎨 美观的UI设计，响应式布局

---

## 快速开始

### 1. 安装扩展

#### 方式一：从源码安装（开发者模式）

1. **下载项目**
   ```bash
   git clone https://github.com/your-username/ask-ai-anything.git
   cd ask-ai-anything
   ```
   或直接下载ZIP并解压

2. **打开Chrome扩展管理页面**
   - 在Chrome地址栏输入：`chrome://extensions/`
   - 或点击菜单 → 更多工具 → 扩展程序

3. **启用开发者模式**
   - 在页面右上角找到"开发者模式"开关
   - 点击开启

4. **加载扩展**
   - 点击左上角"加载已解压的扩展程序"按钮
   - 选择项目文件夹（包含 `manifest.json` 的目录）
   - 点击"选择"

5. **验证安装**
   - 扩展图标应该出现在浏览器工具栏中
   - 在扩展列表中可以看到"Ask AI Anything"

---

### 2. 配置AI API

扩展支持OpenAI API及其他兼容的AI服务。首次使用需要配置API密钥。

#### 方法一：通过控制台配置 ⭐ 推荐

1. **打开扩展详情页**
   - 访问 `chrome://extensions/`
   - 找到"Ask AI Anything"扩展
   - 点击"详情"按钮

2. **打开开发者控制台**
   - 在"检查视图"部分，点击 `service worker` 链接
   - 会打开一个开发者工具窗口

3. **配置API密钥**
   在控制台中粘贴并运行以下代码：

   ```javascript
   // OpenAI API配置
   chrome.storage.sync.set({
     apiKey: 'sk-your-openai-api-key-here',  // 替换为你的API密钥
     apiEndpoint: 'https://api.openai.com/v1/chat/completions',
     apiModel: 'gpt-3.5-turbo'
   });
   ```

4. **验证配置**
   ```javascript
   // 查看当前配置
   chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'apiModel'], (result) => {
     console.log('当前配置:', result);
   });
   ```

#### 方法二：使用其他AI服务

**使用Azure OpenAI：**
```javascript
chrome.storage.sync.set({
  apiKey: 'your-azure-api-key',
  apiEndpoint: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15',
  apiModel: 'gpt-35-turbo'
});
```

**使用国内AI服务（如智谱AI、通义千问等）：**

修改 `sidebar.js` 文件中的 `callAI` 函数，参考以下示例：

```javascript
// 智谱AI GLM-4 示例
async function callAI(text) {
  const config = await chrome.storage.sync.get(['apiKey']);

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: `请分析以下文字：\n\n${text}`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

---

### 3. 使用扩展

#### 基本使用流程

1. **选择文字**
   - 在任意网页上，用鼠标选中你想要解释的文字
   - 可以是单词、句子、段落或任意文本片段

2. **向AI提问**
   - 右键点击选中的文字
   - 在弹出菜单中选择AI分析选项

3. **查看解释**
   - 页面右侧会自动弹出侧边栏
   - 显示"正在分析中..."加载状态
   - AI回答将在几秒钟内显示

4. **查看历史记录**
   - 向下滚动侧边栏，可以看到"历史记录"部分
   - 点击任意历史记录标题，展开查看完整内容
   - 历史记录按时间倒序排列，最新的在最上面

5. **关闭侧边栏**
   - 点击侧边栏右上角的 ✕ 按钮
   - 或刷新页面

#### 使用场景示例

- 📚 **阅读外文文章**：遇到不懂的单词或短语，快速获取解释
- 🔬 **学习专业知识**：解释专业术语和概念
- 📰 **浏览新闻**：理解新闻中的背景知识和术语
- 💼 **工作文档**：快速理解技术文档中的复杂概念
- 🎓 **学术研究**：辅助理解论文中的专业内容

---

## 界面说明

### 侧边栏结构

```
┌─────────────────────────────────┐
│  Ask AI Anything           [✕]  │  ← 标题栏
├─────────────────────────────────┤
│  选中文字：                      │
│  ┌───────────────────────────┐  │
│  │ 你选择的文字内容           │  │  ← 当前选中文字
│  └───────────────────────────┘  │
│                                 │
│  AI 解释：                      │
│  ┌───────────────────────────┐  │
│  │ AI生成的回答内容           │  │  ← AI回答结果
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  历史记录                        │
│  ─────────────────────────────  │
│  ▼ quantum mechanics ...        │  ← 折叠的历史项
│  ▼ machine learning ...         │
│  ▶ artificial intelligence ...  │
│                                 │
└─────────────────────────────────┘
```

### 交互说明

- **关闭按钮**：点击右上角 ✕ 关闭侧边栏
- **历史记录折叠**：点击历史项标题展开/折叠详细内容
- **滚动查看**：内容过多时可以滚动查看
- **自动保存**：每次解释都会自动保存到历史记录

---

## 常见问题

### Q1: 扩展安装后没有反应？

**解决方案：**
- 确认扩展已启用（在 `chrome://extensions/` 中查看）
- 刷新网页后重试
- 检查浏览器控制台是否有错误信息

### Q2: 提示"请先配置API密钥"？

**解决方案：**
- 按照上面"配置AI API"步骤配置密钥
- 确认API密钥有效且有余额
- 检查配置是否正确保存

### Q3: API调用失败，显示错误信息？

**可能原因：**
- API密钥无效或过期
- API余额不足
- 网络连接问题
- API端点配置错误

**解决方案：**
```javascript
// 1. 检查当前配置
chrome.storage.sync.get(['apiKey', 'apiEndpoint'], (result) => {
  console.log(result);
});

// 2. 重新配置
chrome.storage.sync.set({
  apiKey: 'your-new-api-key',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiModel: 'gpt-3.5-turbo'
});

// 3. 清除配置（如需重置）
chrome.storage.sync.clear();
```

### Q4: 历史记录丢失了？

**说明：**
- 历史记录保存在浏览器本地存储中
- 清除浏览器数据会导致历史记录丢失
- 卸载扩展会清除所有数据

### Q5: 如何清除历史记录？

```javascript
// 在扩展的service worker控制台中运行
chrome.storage.local.remove('history', () => {
  console.log('历史记录已清除');
});
```

### Q6: 侧边栏遮挡了网页内容？

**解决方案：**
- 点击关闭按钮临时关闭侧边栏
- 修改 `content.js` 中的宽度设置：
  ```javascript
  width: 300px;  // 改为更小的宽度
  ```

### Q7: 能否在无痕模式下使用？

**说明：**
- 需要在扩展设置中允许在无痕模式下运行
- 步骤：`chrome://extensions/` → 找到扩展 → 详情 → 启用"在无痕模式下启用"

---

## 高级配置

### 自定义侧边栏宽度

编辑 `content.js` 的第30行左右：

```javascript
sidebarIframe.style.cssText = `
  ...
  width: 400px;  // 改为 300px 或其他值
  ...
`;
```

### 修改历史记录保存数量

编辑 `sidebar.js` 的第80行左右：

```javascript
if (history.length > 20) {  // 改为 50 或其他值
  history = history.slice(0, 20);
}
```

### 自定义AI提示词

编辑 `sidebar.js` 的 `callAI` 函数中的 system message：

```javascript
{
  role: 'system',
  content: '你是一个专业的语言助手...'  // 修改这里
}
```

### 更改主题颜色

编辑 `sidebar.css` 的第48行左右：

```javascript
.sidebar-header {
  background: #4A90E2;  // 改为你喜欢的颜色
  ...
}
```

---

## 文件结构说明

```
ask-me-anything/
├── manifest.json       # Chrome扩展配置文件
├── background.js       # 后台服务worker（处理右键菜单）
├── content.js          # 内容脚本（页面侧边栏注入）
├── sidebar.html        # 侧边栏HTML结构
├── sidebar.js          # 侧边栏逻辑和AI API调用
├── sidebar.css         # 侧边栏样式
├── README.md           # 本说明文档
└── icons/              # 扩展图标（可选）
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 核心文件说明

- **manifest.json**: 定义扩展权限、脚本加载等配置
- **background.js**: 创建右键菜单，处理用户点击事件
- **content.js**: 在网页中注入侧边栏iframe
- **sidebar.html/js/css**: 侧边栏的界面、逻辑和样式
- **sidebar.js 核心函数**：
  - `handleExplainRequest()`: 处理解释请求
  - `callAI()`: 调用AI API
  - `addToHistory()`: 保存历史记录
  - `renderHistory()`: 渲染历史列表

---

## 技术栈

- Manifest V3
- Vanilla JavaScript (无依赖)
- Chrome Extension APIs
- OpenAI/Azure OpenAI API
- CSS3 动画和过渡效果

---

## 性能优化建议

1. **限制请求频率**：避免短时间内频繁调用API
2. **缓存结果**：相同文字可以从历史记录中查找
3. **控制Token**：调整 `max_tokens` 参数控制响应长度
4. **使用更便宜的模型**：如 `gpt-3.5-turbo` 而非 `gpt-4`

---

## 安全说明

- API密钥保存在Chrome同步存储中，与Chrome账号同步
- 不会上传任何用户数据到第三方服务器
- 仅在用户主动触发时调用AI API
- 建议使用有使用限额的API密钥

---

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 更新日志

### v1.0.0 (2025-10-23)
- 初始版本发布
- 支持选中文字向AI提问
- 侧边栏展示和历史记录功能
- 支持OpenAI API配置

---

## 许可证

MIT License

---

## 联系方式

- 项目地址：[GitHub Repository](https://github.com/your-username/ai-text-explainer)
- 问题反馈：[Issues](https://github.com/your-username/ai-text-explainer/issues)
- 邮箱：your-email@example.com

---

## 致谢

感谢所有为本项目提供建议和反馈的用户！

## 文件结构

```
.
├── manifest.json      # 扩展配置文件
├── background.js      # 后台脚本（处理右键菜单）
├── content.js         # 内容脚本（注入侧边栏）
├── sidebar.html       # 侧边栏HTML
├── sidebar.js         # 侧边栏逻辑和AI调用
├── sidebar.css        # 侧边栏样式
└── README.md          # 说明文档
```

## 图标

扩展需要以下尺寸的图标（可选）：
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

你可以创建自己的图标，或者使用任意图标生成工具创建。

## 注意事项

- 需要有效的AI API密钥才能使用
- API调用可能产生费用，请注意使用量
- 历史记录保存在本地，最多保存20条
- 侧边栏宽度为400px，固定在页面右侧

## 自定义

### 修改侧边栏宽度

编辑 `content.js` 中的样式：
```javascript
width: 400px;  // 修改为你想要的宽度
```

### 修改历史记录数量

编辑 `sidebar.js` 中的限制：
```javascript
if (history.length > 20) {  // 修改为你想要的数量
  history = history.slice(0, 20);
}
```

### 更换AI服务

修改 `sidebar.js` 中的 `callAI` 函数，替换为你的AI服务API调用逻辑。

## 许可证

MIT License
