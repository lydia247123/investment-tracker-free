import { InvestmentRecord } from '../types/investment';

/**
 * 专门用于测试 AssetsTrendChart 的快照测试数据
 * 这个数据集设计用于验证图表正确显示多账户、多资产类型的快照趋势
 */
export const generateSnapshotTestData = () => {
  const snapshotRecords: InvestmentRecord[] = [
    // 2024年9月数据（用户指定的测试案例）
    {
      id: 'snapshot-test-202409-1',
      date: '2024-09',
      amount: 1000,
      snapshot: 10,
      account: '支付宝',
      assetType: '股票',
      note: '测试快照数据 - 9月支付宝股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202409-2',
      date: '2024-09',
      amount: 1500,
      snapshot: 20,
      account: '支付宝',
      assetType: '基金',
      note: '测试快照数据 - 9月支付宝基金',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202409-3',
      date: '2024-09',
      amount: 1200,
      snapshot: 30,
      account: '微信',
      assetType: '股票',
      note: '测试快照数据 - 9月微信股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202409-4',
      date: '2024-09',
      amount: 1800,
      snapshot: 12,
      account: '微信',
      assetType: '基金',
      note: '测试快照数据 - 9月微信基金',
      currency: 'CNY'
    },

    // 2024年8月数据（用于显示趋势）
    {
      id: 'snapshot-test-202408-1',
      date: '2024-08',
      amount: 1000,
      snapshot: 12000,
      account: '支付宝',
      assetType: '股票',
      note: '测试快照数据 - 8月支付宝股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202408-2',
      date: '2024-08',
      amount: 1500,
      snapshot: 22000,
      account: '支付宝',
      assetType: '基金',
      note: '测试快照数据 - 8月支付宝基金',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202408-3',
      date: '2024-08',
      amount: 1200,
      snapshot: 18000,
      account: '微信',
      assetType: '股票',
      note: '测试快照数据 - 8月微信股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202408-4',
      date: '2024-08',
      amount: 1800,
      snapshot: 28000,
      account: '微信',
      assetType: '基金',
      note: '测试快照数据 - 8月微信基金',
      currency: 'CNY'
    },

    // 2024年7月数据（用于显示趋势起点）
    {
      id: 'snapshot-test-202407-1',
      date: '2024-07',
      amount: 1000,
      snapshot: 10000,
      account: '支付宝',
      assetType: '股票',
      note: '测试快照数据 - 7月支付宝股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202407-2',
      date: '2024-07',
      amount: 1500,
      snapshot: 20000,
      account: '支付宝',
      assetType: '基金',
      note: '测试快照数据 - 7月支付宝基金',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202407-3',
      date: '2024-07',
      amount: 1200,
      snapshot: 15000,
      account: '微信',
      assetType: '股票',
      note: '测试快照数据 - 7月微信股票',
      currency: 'CNY'
    },
    {
      id: 'snapshot-test-202407-4',
      date: '2024-07',
      amount: 1800,
      snapshot: 25000,
      account: '微信',
      assetType: '基金',
      note: '测试快照数据 - 7月微信基金',
      currency: 'CNY'
    },
  ];

  // 按资产类型组织记录
  const recordsByType: { [assetType: string]: InvestmentRecord[] } = {
    '股票': snapshotRecords.filter(r => r.assetType === '股票'),
    '基金': snapshotRecords.filter(r => r.assetType === '基金'),
  };

  return recordsByType;
};

/**
 * 加载快照测试数据到 localStorage
 * 此函数会覆盖现有的 investmentRecords 数据
 */
export const loadSnapshotTestData = () => {
  const testData = generateSnapshotTestData();

  // 保存到 localStorage
  localStorage.setItem('investmentRecords', JSON.stringify(testData));

  console.log('✅ 快照测试数据已加载');
  console.log('📊 测试数据概览:', {
    总记录数: Object.values(testData).flat().length,
    月份分布: ['2024-07', '2024-08', '2024-09'],
    账户: ['支付宝', '微信'],
    资产类型: ['股票', '基金'],
    预期图表数据: [
      { month: '2024-07', totalSnapshot: 70000 },
      { month: '2024-08', totalSnapshot: 80000 },
      { month: '2024-09', totalSnapshot: 72 }
    ]
  });

  return testData;
};

/**
 * 清除快照测试数据
 */
export const clearSnapshotTestData = () => {
  localStorage.removeItem('investmentRecords');
  console.log('🗑️ 快照测试数据已清除');
};

/**
 * 在开发模式下将函数添加到全局 window 对象
 * 使用方法：
 * - window.loadSnapshotTestData() - 加载测试数据
 * - window.clearSnapshotTestData() - 清除测试数据
 */
if (import.meta.env.DEV) {
  (window as any).loadSnapshotTestData = loadSnapshotTestData;
  (window as any).clearSnapshotTestData = clearSnapshotTestData;
}
