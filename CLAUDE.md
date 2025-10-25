# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ask AI Anything** is a Chrome Browser Extension (Manifest V3) that allows users to select text on any webpage, ask AI questions about it via context menu, and view results in a sidebar with history management.

**Tech Stack:**
- Pure JavaScript (no build process, no npm, no dependencies)
- Chrome Extension Manifest V3
- Multiple AI provider support (OpenAI, Azure OpenAI, custom endpoints)
- Custom markdown parser and i18n system

## Development Workflow

### Loading the Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select this directory
4. After code changes, click the reload icon on the extension card

### Debugging
- **Service Worker Console**: Go to extension details → "Inspect views: service worker"
- **Sidebar Console**: Right-click sidebar → "Inspect" (opens DevTools for iframe)
- **Content Script**: Use the page's DevTools console

### Testing
- Use provided test HTML files: `test-*.html` (open directly in browser)
- Manual testing via loaded extension
- No automated test suite currently exists

## Architecture

### Message Flow
```
User selects text → Background script (context menu)
  → Content script (injects sidebar iframe)
  → Sidebar (makes AI API call, displays result)
```

### Core Components

**background.js** (160 lines)
- Service worker for Manifest V3
- Creates context menu items dynamically based on configured prompts
- Handles message passing between content script and sidebar

**content.js** (293 lines)
- Injected into all web pages
- Creates and manages sidebar iframe
- Handles communication between page and sidebar
- Key function: `createSidebar()` - injects iframe with proper styling and positioning

**sidebar.js** (687 lines)
- Main UI logic and AI API integration
- Key functions:
  - `handleExplainRequest()` - processes text analysis requests
  - `callAI()` - makes API calls to configured AI provider
  - `addToHistory()` / `renderHistory()` - history management
  - `showSettings()` - inline settings configuration
- Supports multiple AI providers with different authentication schemes

**settings.js** (882 lines)
- Most complex file - manages API configurations and custom prompts
- Multi-provider support: OpenAI, Azure, Chinese AI services
- Dynamic prompt configuration with custom models and system messages
- Handles API key management via chrome.storage.sync

**markdown.js** (216 lines)
- Custom lightweight markdown parser
- Supports: headers, bold, italic, code blocks, inline code, links, lists, horizontal rules
- Optimized for AI response formatting

**i18n.js** (259 lines)
- Custom internationalization system
- Currently supports: Chinese (zh) and English (en)
- Function: `i18n(key, ...args)` for translation with placeholders
- Translations in `_locales/{lang}/messages.json`

### Storage Architecture

**chrome.storage.sync** (cross-device):
- `apiKey`, `apiEndpoint`, `apiModel` - Default API configuration
- `prompts` - Array of custom prompt configurations
- `language` - User's language preference

**chrome.storage.local** (device-specific):
- `history` - Array of analysis history (max 20 items by default)
- Each history item includes: text, answer, timestamp, URL, page title, prompt info

## Key Configuration Patterns

### Adding AI Provider Support
Modify `callAI()` in sidebar.js to handle different authentication headers:
```javascript
// OpenAI-style: Authorization: Bearer {key}
// Azure: api-key: {key}
// Custom: May require different header format
```

### Customizing Prompts
Prompts are stored in chrome.storage.sync with this structure:
```javascript
{
  id: string,
  name: string,
  systemPrompt: string,
  model: string,
  maxTokens: number
}
```

Settings page (`settings.js`) provides UI for managing prompts.

## File Locations

### Core Files
- `manifest.json` - Extension configuration (permissions, scripts, resources)
- `background.js`, `content.js`, `sidebar.{html,js,css}`, `settings.{html,js,css}`
- `i18n.js`, `markdown.js` - Utility modules

### Localization
- `_locales/zh/messages.json` - Chinese translations
- `_locales/en/messages.json` - English translations

### Documentation
- `README.md` - Comprehensive user guide (Chinese)
- `docs/TODO.md` - Feature roadmap

### Test Files
- `test.html`, `test-copy-markdown.html`, `test-filters.html`, `test-markdown-format.html`, `test-prompt-config.html`

## Important Notes

### No Build Process
- This is a **load-unpacked extension** - edit files directly and reload
- No transpilation, bundling, or package management
- All code runs natively in the browser

### API Configuration
- First-time setup requires configuring API key via console or settings UI
- See README.md for detailed API configuration examples
- Supports OpenAI, Azure OpenAI, and custom compatible endpoints

### Limitations
- History limited to 20 items (configurable in sidebar.js)
- Sidebar width: 400px (configurable in content.js)
- No offline mode - requires active API connection

## Common Modifications

**Change sidebar width**: Edit `content.js` → `createSidebar()` → `width: 400px`

**Change history limit**: Edit `sidebar.js` → `addToHistory()` → `if (history.length > 20)`

**Add new AI provider**: Edit `sidebar.js` → `callAI()` function to handle provider's API format

**Add translations**: Add keys to both `_locales/zh/messages.json` and `_locales/en/messages.json`

**Customize context menu**: Edit `background.js` → prompt configurations load from storage
