# Investment Tracker Free

<div align="center">

A powerful, free desktop application for tracking your investment portfolio.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF.svg)](https://vitejs.dev/)

**🌐 Visit our website:** [https://lydia247123.github.io/investment-tracker-website](https://lydia247123.github.io/investment-tracker-website)

</div>

---

## 📖 About

Investment Tracker Free is a cross-platform desktop investment management application that helps you easily track and manage multiple investment types, including stocks, funds, bonds, time deposits, and precious metals. With intuitive visualization charts and detailed data analysis, your investment status is at a glance.

### 🎯 Target Users

- Individual investors
- Personal finance enthusiasts
- Users managing multiple asset types
- Users who prefer offline investment data management

---

## ✨ Features

### 📊 Investment Tracking

- **Multiple Asset Types** - Support for stocks, funds, bonds, time deposits, cash, and more
- **Precious Metals** - Separate management for gold, silver, platinum, and palladium investments
- **Multiple Accounts** - Manage investments across different accounts with flexible switching
- **Monthly Records** - Track investments and asset snapshots by month
- **Time Deposits** - Maturity reminders and interest calculation for fixed-term deposits

### 📈 Analytics

- **Dashboard** - Comprehensive portfolio overview with key metrics
- **Multiple Charts** - Line charts, bar charts, pie charts for trend visualization
- **Risk Analysis** - 5-level risk assessment system
- **Profit Calculation** - Automatic profit/loss and ROI calculations
- **Monthly Comparison** - Compare investment changes across different months

### 💾 Data Management

- **CSV Export** - Export data for external analysis
- **Data Import** - Batch import from CSV files
- **Local Storage** - Offline-first, data stays on your device
- **Backup** - Built-in backup and restore functionality
- **Filter & Sort** - Filter by type, account, and date

### 🎨 User Experience

- **Modern UI** - Clean and elegant Apple-inspired design
- **Green Theme** - Fresh green gradient theme
- **Responsive Layout** - Adapts to different screen sizes
- **Tutorial System** - Built-in onboarding for new users
- **Fast Operations** - Edit, delete, filter with ease

---

## 💻 System Requirements

### Supported Platforms

- **macOS**:
  - Intel: macOS 10.14 or later
  - Apple Silicon: macOS 11.0 or later (Big Sur or newer)
- **Windows**: Windows 10 or later (x64, ia32)
- **Linux**: Major distributions (Ubuntu, Fedora, Debian, etc.)

### Hardware

- **Memory**: 4GB RAM (8GB recommended)
- **Disk**: 200MB free space
- **Display**: 1200x900 or higher resolution

---

## 🚀 Installation

### Option 1: Download Pre-built Packages

Download the latest version from the [Releases](https://github.com/lydia247123/investment-tracker-free/releases) page:

#### macOS

```bash
# Intel Mac
Investment Tracker Free-1.0.0.dmg
Investment Tracker Free-1.0.0-mac.zip

# Apple Silicon (M1/M2/M3) ⭐ Recommended
Investment Tracker Free-1.0.0-arm64.dmg
Investment Tracker Free-1.0.0-arm64-mac.zip
```

**Installation Method 1: Using ZIP (Recommended)**

If the DMG shows "file is damaged" error:
1. Download the **ZIP version** (e.g., `Investment Tracker Free-1.0.0-arm64-mac.zip`)
2. Extract the ZIP file
3. **Important**: Open Terminal and run:
   ```bash
   xattr -cr ~/Downloads/Investment\ Tracker\ Free.app
   ```
4. Double-click `Investment Tracker Free.app` to launch
5. Optionally: Drag the app to your Applications folder

**Installation Method 2: Using DMG**

1. Download the `.dmg` file
2. **Right-click** the DMG and select "Open" (or use Ctrl+Click)
3. Click "Open" in the security dialog
4. Drag the app to Applications folder
5. Open Terminal and run:
   ```bash
   xattr -cr /Applications/Investment\ Tracker\ Free.app
   ```
6. Launch from Applications folder

> **Note**: Due to macOS security requirements, you MUST run the `xattr -cr` command to remove the quarantine flag before launching the app. This is normal for unsigned apps. See [macOS Installation Guide](docs/macos-installation-guide.md) for detailed instructions.

#### Windows

```bash
# Installer (Recommended)
Investment Tracker Free Setup 1.0.0.exe

# Portable version
Investment Tracker Free 1.0.0.exe
```

Installation steps:
1. Download the `.exe` installer
2. Run the installer and follow the prompts
3. Launch from desktop or Start menu

#### Linux

```bash
# AppImage (Universal)
Investment Tracker Free-1.0.0.AppImage

# Install and run
chmod +x Investment Tracker Free-1.0.0.AppImage
./Investment Tracker Free-1.0.0.AppImage
```

### Option 2: Build from Source

#### Prerequisites

- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later
- **Git**: For cloning the repository

#### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/lydia247123/investment-tracker-free.git
cd investment-tracker-free

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Build for current platform
npm run build

# 5. Build for all platforms
npm run build-all
```

---

## 📸 Screenshots

> 📋 TODO: Add application screenshots

<!-- Add screenshots here
![Dashboard](assets/screenshots/dashboard.png)
![Investment Tracking](assets/screenshots/tracker.png)
![Analytics](assets/screenshots/analytics.png)
-->

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI Framework |
| **TypeScript** | 5.9.3 | Type Safety |
| **Vite** | 5.4.21 | Build Tool |
| **Tailwind CSS** | 3.4.19 | Styling |
| **Recharts** | 3.6.0 | Data Visualization |
| **Zustand** | 4.5.7 | State Management |
| **React Router** | 6.30.2 | Routing |

### Desktop

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 28.0.0 | Cross-platform Framework |
| **Electron Builder** | 24.9.1 | Application Packaging |

### Development Tools

- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking

---

## 📖 User Guide

### Quick Start

#### 1. First Time Use

1. **Add Accounts** - Add your investment accounts in the "Settings" page
2. **Select Asset Types** - Choose asset types to track in the "Tracker" page
3. **Add Records** - Fill in investment amount, asset snapshot, etc.
4. **View Analytics** - Check overall status and charts in the "Dashboard"

#### 2. Add Investment Records

- Select asset type (stocks, funds, bonds, etc.)
- Select investment month
- Enter investment amount in USD
- Enter current asset snapshot (optional)
- Select account
- Add notes (optional)
- For time deposits, also fill in term and interest rate

#### 3. Track Precious Metals

- Switch to precious metals mode
- Select metal type (gold, silver, platinum, palladium)
- Record buy/sell transactions
- Track holdings and average cost

#### 4. Data Analysis

- **Dashboard** - View total assets, profits, risk analysis
- **Charts** - View asset trends and profit curves
- **Filter** - Filter by type, account, month

#### 5. Data Management

- **Edit** - Click "Edit" button on records to modify
- **Delete** - Remove incorrect or expired records
- **Export** - Export CSV files for external analysis
- **Backup** - Regularly backup data to prevent loss

### FAQ

<details>
<summary><b>Q: Where is my data stored?</b></summary>

A: All data is stored locally on your device using localStorage technology. Nothing is uploaded to any server, ensuring your privacy and data security.
</details>

<details>
<summary><b>Q: How do I backup my data?</b></summary>

A: Use the "Export Data" feature to export CSV files as backups. We recommend regularly exporting and saving to multiple locations.
</details>

<details>
<summary><b>Q: Which currencies are supported?</b></summary>

A: Currently supports USD (US Dollar) only.
</details>

<details>
<summary><b>Q: How is time deposit interest calculated?</b></summary>

A: The system automatically calculates interest based on the deposit term, annual interest rate, and current date. You'll receive reminders when deposits mature.
</details>

<details>
<summary><b>Q: How do I migrate to a new device?</b></summary>

A:
1. Export all data from old device (CSV format)
2. Install the app on new device
3. Use import functionality to import data
</details>

---

## 🔧 Development

### Development Setup

```bash
# Clone repository
git clone https://github.com/lydia247123/investment-tracker-free.git
cd investment-tracker-free

# Install dependencies
npm install

# Start development server
npm run dev
```

Development mode will automatically:
- Start Vite dev server (with hot reload)
- Open Electron window
- Enable DevTools

### Project Structure

```
investment-tracker-free/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main process entry
│   │   └── ipc/                # IPC communication handlers
│   │       ├── dataHandlers.ts # Data operations
│   │       └── importHandlers.ts # Import operations
│   ├── preload/                # Preload scripts
│   │   └── index.ts           # Context Bridge
│   ├── renderer/               # Renderer process (React app)
│   │   ├── components/         # Reusable components
│   │   │   ├── ui/            # Basic UI components
│   │   │   └── layout/        # Layout components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard/    # Dashboard
│   │   │   ├── Tracker/      # Tracker
│   │   │   ├── Analytics/    # Analytics
│   │   │   ├── Settings/     # Settings
│   │   │   └── Import/       # Import
│   │   ├── store/            # Zustand state management
│   │   │   ├── investmentStore.ts
│   │   │   ├── preciousMetalStore.ts
│   │   │   ├── accountStore.ts
│   │   │   └── uiStore.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── calculations.ts
│   │   │   └── csvHandlers.ts
│   │   ├── types/            # TypeScript type definitions
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # React entry
│   └── shared/               # Shared code
├── assets/                   # Static assets
│   ├── icon.png             # App icon
│   └── icon.ico/.icns       # Platform-specific icons
├── docs/                     # Developer documentation
│   ├── BUILD.md            # Build instructions
│   ├── DEBUG_GUIDE.md      # Debugging guide
│   ├── DATA_FORMAT.md      # Data format documentation
│   └── CLAUDE.md           # Claude Code instructions
├── scripts/                  # Build and deployment scripts
│   ├── build.sh            # Build script for Linux/macOS
│   ├── build.bat           # Build script for Windows
│   ├── package-all-platforms.sh  # Build all platforms
│   ├── installer.nsh       # NSIS installer configuration
│   └── quick-start.js      # Quick start helper script
├── config/                   # Configuration files
│   ├── postcss.config.js   # PostCSS configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── vitest.config.ts    # Vitest test configuration
│   └── vitest.setup.ts     # Vitest test setup
├── electron-builder.yml     # Build configuration
├── package.json            # Project configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start development mode
npm run dev:debug        # Start development mode with debugging

# Build
npm run build            # Build for current platform
npm run build-all        # Build for all platforms
npm run build-mac        # Build for macOS
npm run build-win        # Build for Windows
npm run build-linux      # Build for Linux

# Package
npm run pack             # Package only, no installer

# Test
npm run test             # Run tests
npm run test:coverage    # Test coverage

# Code quality
npm run lint             # ESLint check
npm run format           # Prettier format
```

### Adding Features

1. **Add New Pages**:
   - Create component in `src/renderer/pages/`
   - Add route in `src/renderer/App.tsx`
   - Add navigation entry

2. **Add New State**:
   - Create new store in `src/renderer/store/`
   - Use Zustand API

3. **Add IPC Communication**:
   - Add handler in `src/main/ipc/`
   - Expose API in `src/preload/index.ts`
   - Call from renderer process

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for code formatting
- Use functional components + Hooks
- Use Zustand for state management
- Use Tailwind CSS for styling

---

## 📦 Build & Release

### Build Configuration

Build configuration is located in `electron-builder.yml`:

```yaml
appId: com.investmenttracker.free
productName: Investment Tracker Free
directories:
  buildResources: build
  output: dist
files:
  - dist-renderer/**/*
  - package.json
```

### Release New Version

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Build for all platforms
npm run build-all

# 3. Test installers

# 4. Create GitHub Release
# Upload build artifacts to GitHub Releases page

# 5. Publish to npm (optional)
npm publish
```

---

## 🤝 Contributing

We welcome all forms of contributions!

### How to Contribute

1. **Report Issues** - Report bugs or request features in Issues
2. **Submit Code** - Fork repository, create branch, submit Pull Request
3. **Improve Docs** - Improve documentation, add usage examples
4. **Share Feedback** - Provide user experience and improvement suggestions

### Development Workflow

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Code Review Standards

- Code passes all tests
- Follows project code style guidelines
- Includes necessary comments and documentation
- Updates relevant documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Investment Tracker Free

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💬 Contact

- **Email**: lydia247@163.com
- **Repository**: [https://github.com/lydia247123/investment-tracker-free](https://github.com/lydia247123/investment-tracker-free)

---

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Recharts](https://recharts.org/) - Data visualization library
- [Zustand](https://github.com/pmndrs/zustand) - State management library

---

## 🗺️ Roadmap

### v1.1 (Planned)

- [ ] Cloud sync functionality
- [ ] More chart types
- [ ] Custom reports
- [ ] Multi-language support (Spanish, Japanese)

### v1.2 (Future)

- [ ] Mobile app
- [ ] AI investment suggestions
- [ ] Community features
- [ ] Plugin system

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

Made with ❤️ by Investment Tracker Free Team

</div>

---

## 📄 License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Summary

✅ **You are free to:**
- **Share** — Copy and redistribute the material in any medium or format
- **Adapt** — Remix, transform, and build upon the material

⚠️ **Under the following terms:**
- **Attribution** — You must give appropriate credit to the original author
- **NonCommercial** — You may not use the material for commercial purposes
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license

### Important Restrictions

❌ **Commercial use is strictly prohibited:**
- No commercial use for profit-making purposes
- No corporate or organizational use
- No sale, resale, or commercial transactions
- No use in commercial products or services

👤 **Personal use only:**
- This software is intended for personal use only
- Individuals may use, modify, and share for personal purposes

To view the full license text, visit: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
