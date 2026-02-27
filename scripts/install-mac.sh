#!/bin/bash
# Investment Tracker Free - macOS Installer Script
# This script helps install the app when DMG is blocked by macOS security

echo "📦 Investment Tracker Free - macOS Installer"
echo ""

# Check if app exists in current directory
if [ ! -d "Investment Tracker Free.app" ]; then
    echo "❌ Error: Investment Tracker Free.app not found in current directory"
    echo ""
    echo "Please:"
    echo "1. Download the ZIP version (Investment Tracker Free-1.0.0-arm64-mac.zip)"
    echo "2. Extract the ZIP file"
    echo "3. Run this script from the extracted folder"
    exit 1
fi

echo "✅ Found Investment Tracker Free.app"
echo ""

# Remove quarantine attributes
echo "🔧 Removing quarantine attributes..."
xattr -cr "Investment Tracker Free.app"

# Sign with ad-hoc signature
echo "🔐 Signing application..."
codesign --force --deep --sign - "Investment Tracker Free.app" 2>/dev/null

echo ""
echo "✅ Installation complete!"
echo ""
echo "You can now:"
echo "1. Double-click Investment Tracker Free.app to launch"
echo "2. Or drag it to your Applications folder"
