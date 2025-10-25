// 简化的国际化翻译
const translations = {
  zh: {
    sidebar: {
      title: "Ask AI Anything",
      settings: "设置",
      close: "关闭",
      selectedText: "选中内容：",
      aiExplanation: "AI 回答：",
      analyzing: "正在分析中...",
      error: "错误：",
      history: "历史记录",
      clearAll: "清空",
      noHistory: "暂无历史记录",
      noFilterResults: "没有符合条件的历史记录",
      searchPlaceholder: "搜索历史记录...",
      allPrompts: "所有提示词",
      clearSearch: "清空搜索",
      clearFilters: "清空筛选",
      deleteConfirm: "确定要删除这条历史记录吗？",
      clearAllConfirm: "确定要清空所有历史记录吗？此操作不可恢复。",
      copyMarkdown: "复制 Markdown",
      copySuccess: "已复制 Markdown 格式到剪贴板",
      copyFailed: "复制失败，请手动复制内容",
      configRequired:
        '请先配置API密钥。\n\n点击侧边栏右上角的 ⚙️ 设置按钮进行配置，或者点击浏览器工具栏中的扩展图标打开设置页面。\n\n配置后即可使用AI问答功能。\n\n选中的文字: "{text}"',
    },
    settings: {
      title: "API 配置",
      subtitle: "配置你的AI服务提供商",
      apiEndpoint: "API 端点 (Base URL)",
      apiEndpointPlaceholder: "https://api.openai.com/v1/chat/completions",
      apiEndpointHelp: "例如: https://api.openai.com/v1/chat/completions",
      apiKey: "API 密钥",
      apiKeyPlaceholder: "sk-...",
      apiKeyHelp: "你的API密钥将安全地保存在浏览器本地",
      showHideKey: "显示/隐藏密钥",
      model: "模型",
      modelPlaceholder: "-- 选择模型 --",
      modelHelp: "选择要使用的AI模型",
      customModel: "自定义模型名称",
      customModelPlaceholder: "输入自定义模型名称",
      maxTokens: "最大Token数",
      maxTokensHelp: "控制AI响应的长度 (100-4000)",
      systemPrompt: "系统提示词 (System Prompt)",
      systemPromptPlaceholder:
        "你是一个专业的AI助手，可以回答各种关于文字的问题。请用简洁清晰的中文回答，适当使用Markdown格式（如**粗体**、*斜体*、列表等）来提升可读性。",
      systemPromptHelp: "自定义AI的回答风格和角色，留空则使用默认提示词",
      userPromptTemplate: "用户提示词模板",
      userPromptTemplatePlaceholder: "请分析以下文字：\n\n{text}",
      userPromptTemplateHelp:
        "使用 {text} 作为占位符代表选中的文字，留空则使用默认模板",
      language: "界面语言",
      languageHelp: "选择界面显示语言",
      save: "💾 保存配置",
      test: "🔍 测试连接",
      reset: "🔄 恢复默认",
      testing: "🔄 测试中...",
      saveSuccess: "✅ 配置保存成功！",
      saveFailed: "❌ 保存失败：",
      fillRequired: "请填写所有必填字段",
      customModelRequired: "请输入自定义模型名称",
      testSuccess: "✅ 连接成功！API配置正确。",
      testFailed: "❌ 连接失败：",
      configFirst: "❌ 请先保存配置后再测试",
      resetConfirm: "确定要恢复默认设置吗？这将清除所有已保存的配置。",
      resetSuccess: "✅ 已恢复默认设置",
      resetFailed: "❌ 重置失败：",
      quickPresets: "快速配置",
      quickPresetsSubtitle: "点击下方按钮快速填充常见AI服务的配置",
      presetApplied: "✅ 已应用 {preset} 预设配置，请填写API密钥并保存",
      infoTitle: "💡 提示：",
      infoItem1: "配置将自动同步到你的Chrome账号",
      infoItem2: "API密钥安全地保存在本地，不会上传到任何服务器",
      infoItem3: '使用"测试连接"确保配置正确',
      promptsTitle: "右键菜单提示词",
      promptsSubtitle: "管理右键菜单中的提示词选项",
      addPrompt: "➕ 添加提示词",
      resetPrompts: "🔄 恢复默认提示词",
      editPrompt: "编辑",
      deletePrompt: "删除",
      promptNamePlaceholder: "提示词名称",
      promptTemplatePlaceholder: "使用 {text} 作为占位符",
      savePrompt: "保存",
      cancelEdit: "取消",
      promptSaved: "提示词已保存",
      promptDeleted: "提示词已删除",
      promptRequired: "请填写完整的提示词名称和模板",
      promptTextPlaceholder: "提示词模板必须包含 {text} 占位符",
      promptMinRequired: "至少需要保留一个提示词",
      deletePromptConfirm: "确定要删除这个提示词吗？",
      resetPromptsConfirm: "确定要恢复默认提示词吗？这将覆盖所有自定义提示词。",
      promptsReset: "已恢复默认提示词",
      contextTypeSelection: "选中文字",
      contextTypePage: "整个页面",
      contextTypeImage: "图片",
      contextTypeBoth: "多种场景",
    },
  },
  en: {
    sidebar: {
      title: "Ask AI Anything",
      settings: "Settings",
      close: "Close",
      selectedText: "Selected Text:",
      aiExplanation: "AI Answer:",
      analyzing: "Analyzing...",
      error: "Error:",
      history: "History",
      clearAll: "Clear All",
      noHistory: "No history yet",
      noFilterResults: "No history matches the current filter",
      searchPlaceholder: "Search history...",
      allPrompts: "All Prompts",
      clearSearch: "Clear search",
      clearFilters: "Clear filters",
      deleteConfirm: "Are you sure you want to delete this history item?",
      clearAllConfirm:
        "Are you sure you want to clear all history? This action cannot be undone.",
      copyMarkdown: "Copy Markdown",
      copySuccess: "Markdown format copied to clipboard",
      copyFailed: "Copy failed, please copy manually",
      configRequired:
        'Please configure API key first.\n\nClick the ⚙️ Settings button in the sidebar, or click the extension icon in the browser toolbar.\n\nYou can use AI explanation after configuration.\n\nSelected text: "{text}"',
    },
    settings: {
      title: "API Configuration",
      subtitle: "Configure your AI service provider",
      apiEndpoint: "API Endpoint (Base URL)",
      apiEndpointPlaceholder: "https://api.openai.com/v1/chat/completions",
      apiEndpointHelp: "E.g.: https://api.openai.com/v1/chat/completions",
      apiKey: "API Key",
      apiKeyPlaceholder: "sk-...",
      apiKeyHelp: "Your API key will be securely stored locally",
      showHideKey: "Show/Hide Key",
      model: "Model",
      modelPlaceholder: "-- Select Model --",
      modelHelp: "Select the AI model to use",
      customModel: "Custom Model",
      customModelPlaceholder: "Enter custom model name",
      maxTokens: "Max Tokens",
      maxTokensHelp: "Control the length of AI response (100-4000)",
      systemPrompt: "System Prompt",
      systemPromptPlaceholder:
        "You are a professional language assistant, skilled at explaining the meaning, context, and usage of text. Please respond concisely and clearly in English, using Markdown formatting (such as **bold**, *italic*, lists, etc.) to enhance readability.",
      systemPromptHelp:
        "Customize the AI's response style and role, leave blank to use default prompt",
      userPromptTemplate: "User Prompt Template",
      userPromptTemplatePlaceholder:
        "Please explain the meaning of the following text:\n\n{text}",
      userPromptTemplateHelp:
        "Use {text} as placeholder for selected text, leave blank to use default template",
      language: "Language",
      languageHelp: "Select interface language",
      save: "💾 Save Configuration",
      test: "🔍 Test Connection",
      reset: "🔄 Reset to Default",
      testing: "🔄 Testing...",
      saveSuccess: "✅ Configuration saved successfully!",
      saveFailed: "❌ Save failed:",
      fillRequired: "Please fill in all required fields",
      customModelRequired: "Please enter custom model name",
      testSuccess: "✅ Connection successful! API configuration is correct.",
      testFailed: "❌ Connection failed:",
      configFirst: "❌ Please save configuration before testing",
      resetConfirm:
        "Are you sure you want to reset to default settings? This will clear all saved configurations.",
      resetSuccess: "✅ Reset to default settings",
      resetFailed: "❌ Reset failed:",
      quickPresets: "Quick Configuration",
      quickPresetsSubtitle:
        "Click the button below to quickly fill in common AI service configurations",
      presetApplied:
        "✅ Applied {preset} preset configuration, please fill in API key and save",
      infoTitle: "💡 Tips:",
      infoItem1: "Configuration will automatically sync to your Chrome account",
      infoItem2:
        "API key is stored securely locally and will not be uploaded to any server",
      infoItem3: 'Use "Test Connection" to ensure configuration is correct',
      promptsTitle: "Context Menu Prompts",
      promptsSubtitle: "Manage prompt options in the context menu",
      addPrompt: "➕ Add Prompt",
      resetPrompts: "🔄 Reset to Default Prompts",
      editPrompt: "Edit",
      deletePrompt: "Delete",
      promptNamePlaceholder: "Prompt name",
      promptTemplatePlaceholder: "Use {text} as placeholder",
      savePrompt: "Save",
      cancelEdit: "Cancel",
      promptSaved: "Prompt saved",
      promptDeleted: "Prompt deleted",
      promptRequired: "Please fill in complete prompt name and template",
      promptTextPlaceholder: "Prompt template must contain {text} placeholder",
      promptMinRequired: "At least one prompt is required",
      deletePromptConfirm: "Are you sure you want to delete this prompt?",
      resetPromptsConfirm:
        "Are you sure you want to reset to default prompts? This will overwrite all custom prompts.",
      promptsReset: "Reset to default prompts",
      contextTypeSelection: "Selected Text",
      contextTypePage: "Entire Page",
      contextTypeImage: "Image",
      contextTypeBoth: "Multiple Scenarios",
    },
  },
};

// 简化的i18n类
class I18n {
  constructor() {
    this.currentLanguage = "zh";
    this.loadLanguage();
  }

  async loadLanguage() {
    const settings = await chrome.storage.sync.get(["language"]);
    this.currentLanguage = settings.language || this.detectBrowserLanguage();
  }

  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith("zh") ? "zh" : "en";
  }

  t(key, params = {}) {
    const keys = key.split(".");
    let value = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value === "string") {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value || key;
  }

  async switchLanguage(lang) {
    this.currentLanguage = lang;
    await chrome.storage.sync.set({ language: lang });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

const i18n = new I18n();

async function initI18n() {
  await i18n.loadLanguage();
  return i18n;
}
