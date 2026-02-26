# React重构实施计划

## 项目概述

将现有的单体HTML应用（`investment-tracker.html`，约5300行代码）重构为现代化的React + TypeScript + Tailwind CSS + Vite组件架构，同时保持Electron桌面应用功能不变。

## 技术栈

- **React 18.3+** - 函数组件 + Hooks
- **TypeScript 5.0+** - 类型安全
- **Vite** - 快速构建工具
- **Tailwind CSS** - 现代化CSS框架
- **Zustand** - 轻量级状态管理
- **React Router v6** - 客户端路由
- **Electron** - 桌面应用框架（保持不变）

## 项目结构

```
investment-tracker-app/
├── electron/
│   ├── main.js                 # Electron主进程（需修改）
│   ├── preload.js              # 预加载脚本（保持不变）
│   └── helpers/
│       └── window-manager.js   # 窗口管理逻辑
│
├── src/
│   ├── main/
│   │   ├── index.tsx           # React入口
│   │   └── App.tsx             # 根组件
│   │
│   ├── pages/                  # 页面组件
│   │   ├── Dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── MonthlyProfitChart.tsx
│   │   │   └── AssetsChart.tsx
│   │   │
│   │   ├── Tracker/
│   │   │   ├── index.tsx
│   │   │   ├── AddRecordForm.tsx
│   │   │   ├── RecordsTable.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── AssetTypeTabs.tsx
│   │   │   └── AccountFilter.tsx
│   │   │
│   │   ├── Analytics/
│   │   │   ├── index.tsx
│   │   │   ├── AssetDistributionChart.tsx
│   │   │   └── AssetDetailsTable.tsx
│   │   │
│   │   └── Settings/
│   │       ├── index.tsx
│   │       ├── AccountManagement.tsx
│   │       └── AccountModal.tsx
│   │
│   ├── components/             # 共享组件
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx   # 主布局
│   │   │   ├── Sidebar.tsx     # 侧边栏导航
│   │   │   └── MobileHeader.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   └── charts/
│   │       ├── BarChart.tsx    # Canvas柱状图
│   │       └── PieChart.tsx    # 饼图
│   │
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useInvestmentData.ts
│   │   └── useElectron.ts
│   │
│   ├── store/                  # Zustand状态管理
│   │   ├── investmentStore.ts
│   │   ├── accountStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── types/                  # TypeScript类型定义
│   │   ├── investment.ts
│   │   ├── account.ts
│   │   └── index.ts
│   │
│   └── utils/                  # 工具函数
│       ├── formatters.ts       # 格式化函数
│       ├── calculations.ts     # 计算逻辑
│       └── exportHelper.ts     # 导出功能
│
├── public/
│   └── assets/                 # 图标和资源
│
├── package.json               # 需要更新
├── vite.config.ts            # 新增
├── tailwind.config.js        # 新增
├── tsconfig.json             # 新增
└── README.md                 # 需要更新
```

## 实施步骤

### 阶段1：项目初始化（第1步）

**目标**：建立React + TypeScript + Vite + Electron基础架构

#### 1.1 安装依赖
```bash
npm install --save-dev \
  vite@^5.0.0 \
  @vitejs/plugin-react@^4.2.0 \
  typescript@^5.3.0 \
  @types/react@^18.2.0 \
  @types/react-dom@^18.2.0 \
  tailwindcss@^3.4.0 \
  autoprefixer@^10.4.0 \
  postcss@^8.4.0 \
  concurrently@^8.2.0 \
  cross-env@^7.0.3

npm install \
  react@^18.3.1 \
  react-dom@^18.3.1 \
  react-router-dom@^6.22.0 \
  zustand@^4.5.0
```

#### 1.2 创建配置文件

**vite.config.ts** - Vite配置
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 5173,
  },
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
  },
})
```

**tailwind.config.js** - Tailwind配置
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gradient-start': '#667eea',
        'apple-gradient-end': '#764ba2',
      },
      backgroundImage: {
        'apple-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    },
  },
  plugins: [],
}
```

**tsconfig.json** - TypeScript配置
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@store/*": ["./src/store/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**src/styles/globals.css** - 全局样式
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
```

#### 1.3 更新package.json脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder"
  }
}
```

#### 1.4 修改Electron主进程

**electron/main.js** - 关键修改
```javascript
// 修改 createWindow 函数中的加载逻辑
function createWindow() {
  mainWindow = new BrowserWindow({
    // ... 保持现有配置
  });

  // 开发模式：加载Vite开发服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载构建后的HTML
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  // ... 保持其余代码
}
```

**交付成果**：能够启动React开发服务器并在Electron中显示

---

### 阶段2：类型定义和状态管理（第2步）

**目标**：建立TypeScript类型系统和Zustand状态管理

#### 2.1 创建类型定义

**src/types/investment.ts**
```typescript
export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM格式
  amount: number;
  account: string;
  note?: string;
}

export interface RecordsByType {
  [assetType: string]: InvestmentRecord[];
}

export interface InitialAssetsByType {
  [assetType: string]: number;
}

export interface AssetTypeStats {
  totalInvestment: number;
  currentAssets: number;
  totalProfit: number;
  returnRate: number;
}
```

**src/types/account.ts**
```typescript
export interface Account {
  name: string;
  icon: string;
}
```

#### 2.2 创建Zustand Store

**src/store/investmentStore.ts** - 投资数据状态管理
**src/store/accountStore.ts** - 账户状态管理
**src/store/uiStore.ts** - UI状态管理

（完整代码见上方详细内容）

**交付成果**：完整的类型系统和状态管理架构

---

### 阶段3：布局和路由（第3步）

**目标**：创建应用主布局和导航系统

#### 3.1 创建React Router配置

**src/main/index.tsx** - React入口
**src/main/App.tsx** - 根组件配置路由

#### 3.2 创建布局组件

**src/components/Layout/AppLayout.tsx** - 主布局
**src/components/Layout/Sidebar.tsx** - 侧边栏导航
**src/components/Layout/MobileHeader.tsx** - 移动端头部

**交付成果**：完整的响应式布局和导航系统

---

### 阶段4：仪表板页面（第4步）

**目标**：实现仪表板页面及其图表组件

#### 4.1 创建仪表板统计卡片

**src/pages/Dashboard/DashboardStats.tsx**

#### 4.2 创建Canvas图表组件

**src/components/charts/BarChart.tsx** - 可复用的柱状图组件
**src/pages/Dashboard/MonthlyProfitChart.tsx** - 月度利润图表
**src/pages/Dashboard/index.tsx** - 仪表板页面主组件

**交付成果**：完整的仪表板页面，包含统计卡片和图表

---

### 阶段5：投资跟踪页面（第5步）

**目标**：实现投资跟踪功能（最复杂的页面）

#### 5.1 创建添加记录表单

**src/pages/Tracker/AddRecordForm.tsx**

#### 5.2 创建记录表格

**src/pages/Tracker/RecordsTable.tsx** - 记录列表表格
**src/pages/Tracker/index.tsx** - 投资跟踪页面主组件

**交付成果**：完整的投资跟踪页面

---

### 阶段6：分析和设置页面（第6步）

**目标**：实现剩余的两个页面

#### 6.1 分析页面

**src/pages/Analytics/AssetDistributionChart.tsx** - 资产分布饼图
**src/pages/Analytics/index.tsx** - 分析页面主组件

#### 6.2 设置页面

**src/pages/Settings/AccountManagement.tsx** - 账户管理
**src/pages/Settings/index.tsx** - 设置页面主组件

**交付成果**：完整的分析和设置页面

---

### 阶段7：工具函数和常量（第7步）

**目标**：提取工具函数和常量

**src/utils/constants.ts** - 常量定义
**src/utils/formatters.ts** - 格式化函数
**src/utils/calculations.ts** - 计算逻辑

**交付成果**：可复用的工具函数库

---

### 阶段8：Electron集成和构建（第8步）

**目标**：完成Electron集成和构建配置

#### 8.1 创建Electron Hook

**src/hooks/useElectron.ts**

#### 8.2 更新构建配置

更新package.json中的build配置和scripts

**交付成果**：完整的Electron + React集成和构建系统

---

### 阶段9：测试和优化（第9步）

**目标**：测试所有功能并优化性能

#### 测试清单

- [ ] 所有页面正确渲染
- [ ] 导航功能正常
- [ ] 添加/编辑/删除记录
- [ ] 数据持久化（localStorage）
- [ ] 图表正确渲染
- [ ] 响应式设计（桌面/移动端）
- [ ] Electron菜单功能（导出、关于）
- [ ] 跨平台构建（Windows/macOS/Linux）

#### 性能优化

1. **React.memo**：对图表组件使用memo优化
2. **useMemo**：缓存计算结果
3. **代码分割**：使用React.lazy延迟加载页面

**交付成果**：完全测试通过的应用

---

## 关键文件清单

需要修改的关键文件：
1. `electron/main.js` - 修改loadFile逻辑，支持开发/生产模式
2. `package.json` - 更新依赖和脚本
3. `investment-tracker.html` - **提取逻辑，最终删除**

需要创建的主要文件（按优先级）：
1. 配置文件：`vite.config.ts`, `tailwind.config.js`, `tsconfig.json`
2. 类型定义：`src/types/investment.ts`, `src/types/account.ts`
3. 状态管理：`src/store/investmentStore.ts`, `src/store/accountStore.ts`, `src/store/uiStore.ts`
4. 布局组件：`src/components/Layout/AppLayout.tsx`, `Sidebar.tsx`, `MobileHeader.tsx`
5. 页面组件：`src/pages/Dashboard/index.tsx`, `Tracker/index.tsx`, `Analytics/index.tsx`, `Settings/index.tsx`
6. 工具函数：`src/utils/constants.ts`, `formatters.ts`, `calculations.ts`
7. 入口文件：`src/main/index.tsx`, `App.tsx`

---

## 数据迁移策略

保持与现有localStorage格式的兼容性：

```typescript
// 现有数据结构（保持不变）
{
  investmentRecords: {
    '股票': [{ id, date, amount, account, note }],
    '基金': [...]
  },
  accounts: [{ name, icon }],
  defaultAccount: '支付宝',
  initialAssets: {
    '股票': 10000,
    '基金': 5000
  }
}

// 无需迁移，直接读取现有localStorage数据
```

---

## 预期成果

重构后的应用将具有以下优势：

### 开发体验
- ✅ 热模块替换（HMR），快速迭代
- ✅ TypeScript类型检查，减少bug
- ✅ 组件化开发，代码复用性高
- ✅ 清晰的项目结构，易于维护

### 用户体验
- ✅ 保持原有Apple风格设计
- ✅ 更流畅的页面切换动画
- ✅ 更好的响应式体验
- ✅ 功能完全一致

### 性能
- ✅ Vite构建速度极快
- ✅ 代码分割，按需加载
- ✅ 生产环境优化

---

## 实施顺序总结

按照上述步骤，依次实施：
1. 项目初始化和配置
2. 类型定义和状态管理
3. 布局和路由
4. 仪表板页面
5. 投资跟踪页面（最复杂）
6. 分析和设置页面
7. 工具函数提取
8. Electron集成
9. 测试和优化

每一步都有明确的交付成果，确保可以逐步验证功能。
