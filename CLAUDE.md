# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Electron-based desktop investment tracker application** (定期投资收益跟踪器) written in Chinese. The application allows users to track monthly investments, calculate returns, visualize data with charts, and export data to CSV.

## Key Commands

### Development
- `npm start` - Start the application in normal mode
- `npm run dev` - Start the application in development mode (opens DevTools)
- `node quick-start.js` - Quick start script (installs deps and launches)
- `node quick-start.js --dev` - Quick start in development mode

### Building
- `npm run build` - Build the application for current platform
- `npm run build-win` - Build for Windows
- `npm run build-mac` - Build for macOS
- `npm run build-linux` - Build for Linux
- `npm run build-all` - Build for all platforms
- `npm run pack` - Package without creating installer
- `npm run dist` - Build and publish (never publishes)

### Utility Scripts
- `chmod +x build.sh && ./build.sh` - Linux/macOS build script
- `build.bat` - Windows build script

## Architecture

### Core Files Structure
- `main.js` - Electron main process (window creation, menu setup, IPC handlers)
- `preload.js` - Secure bridge between main and renderer processes using contextBridge
- `investment-tracker.html` - Single-page application (HTML, CSS, JavaScript all in one file)
- `quick-start.js` - Development helper script for easy startup

### Key Technical Details

**Security Model:**
- Context isolation enabled, node integration disabled
- All renderer-to-main communication goes through preload.js via `electronAPI`
- External links handled securely through `shell.openExternal()`

**Data Storage:**
- Uses localStorage for data persistence
- No external databases or APIs
- Data format: JSON objects stored in browser localStorage

**UI Framework:**
- Pure HTML5/CSS3/JavaScript (no frameworks)
- Apple-style design with gradient backgrounds
- Canvas API for chart rendering
- Responsive design with fixed navigation bar

**Electron Configuration:**
- Window: 1200x900 minimum, resizable
- Icon: `assets/icon.png` (platform-specific icons in build config)
- Menu: Custom Chinese menu with File/Edit/View/Help sections
- DevTools: Available in development mode

### Main Process Features
- Custom application menu with Chinese labels
- IPC handlers for app version and platform detection
- Export data trigger (handled in renderer)
- About dialog trigger (handled in renderer)

### Renderer Process Features
- Investment record management (CRUD operations)
- Monthly return calculations
- Data visualization with Canvas charts
- CSV export functionality
- Settings management (default investment amounts)

## Development Notes

### Debugging
- Development mode automatically opens DevTools
- Use `npm run dev` for development with debugging enabled

### Localization
- Application is primarily in Chinese (Simplified)
- UI text, menu items, and user-facing strings are in Chinese
- Consider maintaining Chinese language when making changes

### Adding Features
- All new JavaScript functionality should go in `<script>` tags in `investment-tracker.html`
- New IPC communication requires updates to both `main.js` and `preload.js`
- Follow existing Apple-style design patterns for UI consistency
- Use localStorage for any new data persistence needs

### Platform Considerations
- Cross-platform builds supported (Windows, macOS, Linux)
- Platform-specific menu handling for macOS
- Icon files needed for each platform (icon.ico, icon.icns, icon.png)