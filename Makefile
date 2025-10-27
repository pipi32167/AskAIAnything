# Ask AI Anything Chrome Extension - Makefile
# 用于打包和管理 Chrome 扩展

# 版本号
VERSION = 1.0.0

# 打包文件名
PACKAGE_NAME = ask-ai-anything-$(VERSION).zip

# 需要排除的文件和目录
EXCLUDE_FILES = \
	*.zip \
	.git/* \
	.gitignore \
	README.md \
	TODO.md \
	Makefile \
	docs/* \
	node_modules/* \
	.DS_Store

# 需要包含的文件
INCLUDE_FILES = \
	manifest.json \
	background.js \
	content.js \
	sidebar.html \
	sidebar.js \
	sidebar.css \
	markdown.js \
	i18n.js \
	settings.html \
	settings.js \
	settings.css \
	_locales/*

.PHONY: help package clean check list

# 默认目标：显示帮助
help:
	@echo "=========================================="
	@echo "  Ask AI Anything - 打包管理工具"
	@echo "=========================================="
	@echo ""
	@echo "可用命令："
	@echo "  make package  - 创建用于发布到 Chrome Web Store 的 zip 包"
	@echo "  make check    - 检查必要的文件是否存在"
	@echo "  make list     - 列出将要打包的文件"
	@echo "  make clean    - 清理生成的 zip 文件"
	@echo "  make help     - 显示此帮助信息"
	@echo ""
	@echo "当前版本: $(VERSION)"
	@echo ""

# 检查必要的文件是否存在
check:
	@echo "检查必要文件..."
	@test -f manifest.json || (echo "错误: manifest.json 不存在" && exit 1)
	@test -f background.js || (echo "错误: background.js 不存在" && exit 1)
	@test -f content.js || (echo "错误: content.js 不存在" && exit 1)
	@test -f sidebar.html || (echo "错误: sidebar.html 不存在" && exit 1)
	@test -f sidebar.js || (echo "错误: sidebar.js 不存在" && exit 1)
	@test -f settings.html || (echo "错误: settings.html 不存在" && exit 1)
	@test -f settings.js || (echo "错误: settings.js 不存在" && exit 1)
	@test -d _locales || (echo "错误: _locales 目录不存在" && exit 1)
	@echo "✅ 所有必要文件检查通过"

# 列出将要打包的文件
list: check
	@echo "将要打包的文件："
	@echo "=================="
	@for file in $(INCLUDE_FILES); do \
		if [ -f $$file ] || [ -d $$file ]; then \
			echo "  ✓ $$file"; \
		fi; \
	done

# 打包扩展
package: check
	@echo "开始打包 Chrome 扩展..."
	@echo "版本: $(VERSION)"
	@echo "输出文件: $(PACKAGE_NAME)"
	@echo ""
	@rm -f $(PACKAGE_NAME)
	@zip -r $(PACKAGE_NAME) $(INCLUDE_FILES) -x $(EXCLUDE_FILES)
	@echo ""
	@echo "✅ 打包完成: $(PACKAGE_NAME)"
	@echo "📦 文件大小: $$(du -h $(PACKAGE_NAME) | cut -f1)"
	@echo ""
	@echo "下一步："
	@echo "  1. 解压并测试扩展: unzip -l $(PACKAGE_NAME)"
	@echo "  2. 上传到 Chrome Web Store: https://chrome.google.com/webstore/devconsole"
	@echo ""

# 清理生成的文件
clean:
	@echo "清理打包文件..."
	@rm -f *.zip
	@echo "✅ 清理完成"
