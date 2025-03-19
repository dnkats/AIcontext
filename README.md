# AI Context Helper

AI Context Helper is a Chrome extension that makes it easy to add context to your conversations with various AI assistants. It supports multiple platforms including Claude, ChatGPT, Gemini, Perplexity, Bing Chat, and more.

## Features

- Add custom context to AI chat interfaces with a single click
- Save and manage templates for frequently used context
- Works across multiple AI platforms:
  - Claude (claude.ai, anthropic.com)
  - ChatGPT (chat.openai.com, openai.com)
  - Google Gemini and Bard
  - Perplexity AI
  - Bing Chat and Microsoft Copilot
- Automatic platform detection
- Simple and intuitive user interface

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to [`chrome://extensions/`](chrome://extensions/)
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" and select the directory containing the extension files
5. The AI Context Helper icon should now appear in your browser toolbar

## Usage

1. Navigate to any supported AI assistant website
2. Click the AI Context Helper icon in your browser toolbar
3. Type or paste your context in the text area
4. Click "Add to Chat" to insert the context into the AI chat input
5. Optionally, save the context as a template for future use

## Saving Templates

1. Enter your context in the text area
2. Click "Save as Template"
3. Enter a name for your template and click "Save"
4. Your saved templates will appear in the "Saved Templates" section
5. Click on a template to load it into the text area
6. Use the "Edit" or "Delete" buttons to manage your templates

## Files

- `popup.html`: The extension popup interface
- `popup.js`: Logic for the popup interface and template management
- `content.js`: Logic for detecting AI platforms and injecting context
- `manifest.json`: Extension configuration

## License

This project is open source and available for use and modification.
