.PHONY: serve build clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  serve    - Start Hugo development server"
	@echo "  build    - Build the site for production"
	@echo "  clean    - Clean build artifacts"
	@echo "  help     - Show this help message"

# Start development server
serve:
	hugo server -D

# Build for production
build:
	hugo --minify

# Clean build artifacts
clean:
	rm -rf public/
	rm -rf resources/
