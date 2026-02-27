#!/bin/bash
# Fix macOS app signing issues
# This script removes problematic signatures and re-signs correctly

APP_PATH="$1"

if [ -z "$APP_PATH" ]; then
    echo "Usage: $0 <path-to-app>"
    exit 1
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at $APP_PATH"
    exit 1
fi

echo "Fixing $APP_PATH..."

# Remove quarantine attribute
xattr -cr "$APP_PATH"

# Remove all existing signatures
find "$APP_PATH" -name "*.app" -exec codesign --remove-signature {} \; 2>/dev/null
find "$APP_PATH/Contents/Frameworks" -type f -exec codesign --remove-signature {} \; 2>/dev/null
codesign --remove-signature "$APP_PATH" 2>/dev/null

# Re-sign with ad-hoc signature (from inside out)
find "$APP_PATH/Contents/Frameworks" -type f -perm +111 -exec codesign --force --sign - {} \; 2>/dev/null
codesign --force --deep --sign - "$APP_PATH" 2>/dev/null

echo "Done! The app should now work."
