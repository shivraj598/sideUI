#!/bin/bash

# SideUI Chrome Extension - Installation Script
# This script sets up the extension and provides next steps

set -e

echo "🚀 SideUI - Chrome Extension Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Build the extension
echo "🔨 Building extension..."
npm run build
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo ""
echo "2. Enable 'Developer mode' (toggle in top right)"
echo ""
echo "3. Click 'Load unpacked' button"
echo ""
echo "4. Select the 'dist' folder in this project"
echo ""
echo "5. The SideUI icon should now appear in your Chrome toolbar!"
echo ""
echo "💡 Usage Tips:"
echo "=============="
echo "• Click the SideUI icon to open the popup"
echo "• Press Cmd+Shift+U (Mac) or Ctrl+Shift+U (Windows/Linux) to toggle sidebar"
echo "• Use quick add bar to paste URLs"
echo "• Search to filter your favorites"
echo ""
echo "🔧 Development:"
echo "==============="
echo "Run 'npm run dev' to watch for changes and auto-rebuild"
echo ""
echo "📚 Documentation:"
echo "================="
echo "• Read QUICKSTART.md for a quick guide"
echo "• Read DEVELOPMENT.md for architecture details"
echo "• Read README.md for complete documentation"
echo ""
echo "Happy browsing! 🎉"
