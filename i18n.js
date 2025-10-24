// 国际化工具模块
class I18n {
  constructor() {
    this.currentLanguage = 'zh'; // 默认中文
    this.messages = {};
    this.loadLanguage();
  }

  // 加载语言配置
  async loadLanguage() {
    try {
      // 从storage读取用户选择的语言
      const settings = await chrome.storage.sync.get(['language']);
      this.currentLanguage = settings.language || this.detectBrowserLanguage();

      // 加载语言文件
      const response = await fetch(chrome.runtime.getURL(`_locales/${this.currentLanguage}/messages.json`));
      this.messages = await response.json();
    } catch (error) {
      console.error('Failed to load language file:', error);
      // 回退到中文
      this.currentLanguage = 'zh';
      const response = await fetch(chrome.runtime.getURL('_locales/zh/messages.json'));
      this.messages = await response.json();
    }
  }

  // 检测浏览器语言
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  }

  // 获取翻译文本
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.messages;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // 替换参数
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value || key;
  }

  // 切换语言
  async switchLanguage(lang) {
    this.currentLanguage = lang;
    await chrome.storage.sync.set({ language: lang });
    await this.loadLanguage();
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // 获取所有可用语言
  getAvailableLanguages() {
    return this.t('languages');
  }
}

// 创建全局实例
const i18n = new I18n();

// 等待语言加载完成
async function initI18n() {
  await i18n.loadLanguage();
  return i18n;
}
