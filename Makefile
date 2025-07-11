.PHONY: serve build clean install help

# Default target
help:
	@echo "Available commands:"
	@echo "  serve    - Start Hugo development server"
	@echo "  build    - Build the site for production"
	@echo "  clean    - Clean build artifacts"
	@echo "  install  - Install/update theme"
	@echo "  new      - Create new post (usage: make new POST=post-name)"
	@echo "  help     - Show this help message"

# Start development server
serve:
	hugo server -D --bind 0.0.0.0

# Build for production
build:
	hugo --minify

# Clean build artifacts
clean:
	rm -rf public/
	rm -rf resources/

# Install/update theme
install:
	@if [ ! -d "themes/PaperMod" ]; then \
		echo "Installing PaperMod theme..."; \
		git clone https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod; \
	else \
		echo "Updating PaperMod theme..."; \
		cd themes/PaperMod && git pull; \
	fi

# Create new post
new:
	@if [ -z "$(POST)" ]; then \
		echo "Usage: make new POST=post-name"; \
		exit 1; \
	fi
	hugo new content/posts/$(POST).md

# Development server with live reload
dev: serve

# Build and serve production build locally
preview:
	hugo --minify
	hugo server --renderToDisk