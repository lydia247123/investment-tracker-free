# 投资跟踪器应用 - 数据库格式文档

## 存储方式
- **技术**: 浏览器 localStorage
- **格式**: JSON字符串
- **总容量**: 约5-10MB

---

## 📊 数据表结构

### 1. investmentRecords（投资记录表）

**存储键**: `investmentRecords`

**数据结构**:
```json
{
  "股票": [
    {
      "id": "1",
      "date": "2024-01",
      "amount": 1000,
      "snapshot": 11200,
      "account": "支付宝",
      "note": "月定投",
      "currency": "CNY",
      "assetType": "股票"
    },
    {
      "id": "2",
      "date": "2024-02",
      "amount": 1200,
      "snapshot": 12800,
      "account": "支付宝",
      "note": "增加投资",
      "currency": "CNY",
      "assetType": "股票"
    }
  ],
  "基金": [
    {
      "id": "7",
      "date": "2024-01",
      "amount": 2000,
      "snapshot": 22300,
      "account": "银行卡",
      "note": "基金定投",
      "currency": "CNY",
      "assetType": "基金"
    }
  ],
  "债券": [
    {
      "id": "13",
      "date": "2024-02",
      "amount": 5000,
      "snapshot": 10150,
      "account": "支付宝",
      "note": "国债购买",
      "currency": "CNY",
      "assetType": "债券"
    }
  ],
  "黄金": [
    {
      "id": "16",
      "date": "2024-01",
      "amount": 1000,
      "snapshot": 4150,
      "account": "微信",
      "note": "黄金ETF",
      "currency": "CNY",
      "assetType": "黄金"
    }
  ]
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识符 |
| date | string | ✓ | 投资月份 (YYYY-MM) |
| amount | number | ✓ | 投资金额（人民币） |
| amountUSD | number | ✗ | 原始美元金额（可选） |
| currency | string | ✗ | 货币类型 ('CNY' \| 'USD') |
| exchangeRate | number | ✗ | 汇率（USD→CNY） |
| snapshot | number | ✓ | 资产快照（人民币） |
| snapshotUSD | number | ✗ | 原始美元快照（可选） |
| account | string | ✓ | 账户名称 |
| assetType | string | ✓ | 资产类型（作为分组键） |
| note | string | ✗ | 备注信息 |
| isTimeDeposit | boolean | ✗ | 是否为定期存款 |
| depositTermMonths | number | ✗ | 存期（月数） |
| annualInterestRate | number | ✗ | 年化利率（如5%填5） |
| maturityDate | string | ✗ | 到期日期 (YYYY-MM) |

---

### 2. preciousMetalRecords（贵金属记录表）

**存储键**: `preciousMetalRecords`

**数据结构**:
```json
{
  "黄金": [
    {
      "id": "metal-1",
      "date": "2024-01",
      "metalType": "黄金",
      "grams": 100,
      "pricePerGram": 500,
      "averagePrice": 520,
      "note": "初次购买"
    },
    {
      "id": "metal-2",
      "date": "2024-02",
      "metalType": "黄金",
      "grams": 50,
      "pricePerGram": 510,
      "averagePrice": 520,
      "note": "追加投资"
    }
  ],
  "白银": [
    {
      "id": "metal-3",
      "date": "2024-01",
      "metalType": "白银",
      "grams": 1000,
      "pricePerGram": 5,
      "averagePrice": 5.5,
      "note": "白银投资"
    }
  ],
  "铂金": [],
  "钯金": []
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识符 |
| date | string | ✓ | 购买月份 (YYYY-MM) |
| metalType | string | ✓ | 贵金属类型 ('黄金'\|'白银'\|'铂金'\|'钯金') |
| grams | number | ✓ | 购买克数 |
| pricePerGram | number | ✓ | 每克购买价格 |
| averagePrice | number | ✓ | 当月市场均价 |
| note | string | ✗ | 备注信息 |

**核心计算公式**:
```
月度收益 = 当月均价 × 当月累计克数 - 上月均价 × 上月累计克数 - 当月投资金额
```

---

### 3. accounts（账户表）

**存储键**: `accounts`

**数据结构**:
```json
[
  {
    "name": "支付宝",
    "icon": "💳",
    "group": "group-payment"
  },
  {
    "name": "银行卡",
    "icon": "🏦",
    "group": "group-bank"
  },
  {
    "name": "微信",
    "icon": "💰",
    "group": "group-payment"
  },
  {
    "name": "现金",
    "icon": "💵"
  }
]
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✓ | 账户名称（唯一） |
| icon | string | ✓ | emoji图标 |
| group | string | ✗ | 分组ID（可选） |

---

### 4. accountGroups（账户分组表）

**存储键**: `accountGroups`

**数据结构**:
```json
[
  {
    "id": "default",
    "name": "未分组",
    "icon": "📁",
    "color": "#9CA3AF",
    "order": 0
  },
  {
    "id": "group-bank",
    "name": "银行卡",
    "icon": "🏦",
    "color": "#3B82F6",
    "order": 1
  },
  {
    "id": "group-payment",
    "name": "支付平台",
    "icon": "💳",
    "color": "#10B981",
    "order": 2
  },
  {
    "id": "group-investment",
    "name": "投资账户",
    "icon": "📈",
    "color": "#F59E0B",
    "order": 3
  }
]
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识符 |
| name | string | ✓ | 分组名称 |
| icon | string | ✓ | emoji图标 |
| color | string | ✓ | 颜色值（hex格式） |
| order | number | ✓ | 排序序号 |

---

### 5. monthlySpendingRecords（月度支出记录表）

**存储键**: `monthlySpendingRecords`

**数据结构**:
```json
[
  {
    "id": "spending-1",
    "date": "2024-01",
    "amount": 3500,
    "category": "餐饮",
    "note": "日常餐饮消费",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "spending-2",
    "date": "2024-01",
    "amount": 800,
    "category": "交通",
    "note": "地铁卡充值",
    "createdAt": "2024-01-20T14:20:00.000Z"
  },
  {
    "id": "spending-3",
    "date": "2024-02",
    "amount": 2000,
    "category": "购物",
    "note": "衣物采购",
    "createdAt": "2024-02-05T16:45:00.000Z"
  }
]
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识符 |
| date | string | ✓ | 支出月份 (YYYY-MM) |
| amount | number | ✓ | 支出金额（人民币） |
| category | string | ✓ | 支出类别 |
| note | string | ✗ | 备注信息 |
| createdAt | string | ✓ | 创建时间（ISO 8601格式） |

**支出类别**:
- 餐饮 🍜
- 交通 🚗
- 购物 🛍️
- 娱乐 🎮
- 居住 🏠
- 医疗 💊
- 教育 📚
- 其他 📝

---

## 🔧 设置和配置数据

### 配置键值

| 键名 | 数据类型 | 示例值 | 说明 |
|------|---------|--------|------|
| `defaultAccount` | string | "支付宝" | 默认账户 |
| `investmentFilterMonth` | string | "2024-01" | 投资筛选月份 |
| `metalFilterMonth` | string | "2024-01" | 贵金属筛选月份 |
| `accountGroupMigration` | string | "true" | 数据迁移标记 |

---

## 🔗 数据关系图

```
┌─────────────────────────────────────────────────┐
│              localStorage 数据库                 │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│   investmentRecords              │
│   ├── 股票: [记录1, 记录2, ...]  │
│   ├── 基金: [记录1, 记录2, ...]  │
│   ├── 债券: [记录1, 记录2, ...]  │
│   └── 黄金: [记录1, 记录2, ...]  │
└──────────┬───────────────────────┘
           │
           │ account (外键)
           ↓
┌──────────────────────────────────┐
│   accounts                       │
│   ├── [{name: "支付宝",         │
│   │     icon: "💳",             │
│   │     group: "group-1"}]      │
└──────────┬───────────────────────┘
           │
           │ group (外键)
           ↓
┌──────────────────────────────────┐
│   accountGroups                 │
│   ├── [{id: "group-1",          │
│   │     name: "支付平台",        │
│   │     icon: "💳",             │
│   │     color: "#10B981"}]      │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│   preciousMetalRecords          │
│   ├── 黄金: [记录1, 记录2, ...] │
│   ├── 白银: [记录1, 记录2, ...] │
│   ├── 铂金: [记录1, 记录2, ...] │
│   └── 钯金: [记录1, 记录2, ...] │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│   monthlySpendingRecords         │
│   └── [记录1, 记录2, 记录3, ...] │
└─────────────────────────────────┘
```

---

## 💾 数据迁移历史

### v1.0 → v2.0
- ✅ 添加 `assetType` 字段到投资记录
- ✅ 添加 `currency` 字段到投资记录（默认CNY）

### v2.0 → v3.0
- ✅ 添加 `group` 字段到账户表
- ✅ 添加 `accountGroups` 表

---

## 📈 数据统计示例

基于mock数据的数据统计：

**投资概览**:
- 股票投资: 6笔，总额 ¥6,900，当前价值 ¥18,850
- 基金投资: 6笔，总额 ¥12,500，当前价值 ¥34,200
- 债券投资: 3笔，总额 ¥10,000，当前价值 ¥15,300
- 黄金投资: 3笔，总额 ¥3,500，当前价值 ¥6,810

**账户分布**:
- 支付宝: 7笔交易
- 银行卡: 6笔交易
- 微信: 3笔交易

**总计**:
- 总投资: ¥32,900
- 当前价值: ¥75,160
- 总收益: ¥42,260

---

## 🔍 数据查询示例

### 获取所有股票投资
```javascript
const records = JSON.parse(localStorage.getItem('investmentRecords'));
const stockRecords = records['股票'];
```

### 获取指定账户的投资
```javascript
const records = JSON.parse(localStorage.getItem('investmentRecords'));
const alipayRecords = Object.values(records)
  .flat()
  .filter(r => r.account === '支付宝');
```

### 计算黄金总克数
```javascript
const metalRecords = JSON.parse(localStorage.getItem('preciousMetalRecords'));
const goldRecords = metalRecords['黄金'];
const totalGrams = goldRecords.reduce((sum, r) => sum + r.grams, 0);
```

### 获取指定月份的支出
```javascript
const spendings = JSON.parse(localStorage.getItem('monthlySpendingRecords'));
const januarySpendings = spendings.filter(s => s.date === '2024-01');
```

---

## ⚠️ 注意事项

1. **数据备份**: localStorage数据会随浏览器清除而丢失，建议定期导出CSV备份
2. **跨设备**: 数据存储在本地浏览器，无法跨设备自动同步
3. **容量限制**: 通常限制在5-10MB，适合个人使用
4. **数据格式**: 所有日期统一使用 `YYYY-MM` 格式
5. **货币单位**: 所有金额统一使用人民币（CNY）存储

---

## 📝 数据示例导出

完整的数据导出示例文件请参考:
- `src/utils/mockData.ts` - 假数据生成
- `src/__tests__/unit/store/*.test.ts` - 测试用例中的数据示例
