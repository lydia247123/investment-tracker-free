import { InvestmentRecord } from '../types/investment';

// 生成假数据用于演示
export const generateMockData = () => {
  const mockRecords: InvestmentRecord[] = [
    // 股票投资记录
    { id: '1', date: '2024-01', amount: 1000, snapshot: 11200, account: '支付宝', note: '月定投', assetType: '股票' },
    { id: '2', date: '2024-02', amount: 1200, snapshot: 12800, account: '支付宝', note: '增加投资', assetType: '股票' },
    { id: '3', date: '2024-03', amount: 1000, snapshot: 14050, account: '支付宝', note: '月定投', assetType: '股票' },
    { id: '4', date: '2024-04', amount: 1500, snapshot: 15900, account: '支付宝', note: '加仓', assetType: '股票' },
    { id: '5', date: '2024-05', amount: 1000, snapshot: 17120, account: '支付宝', note: '月定投', assetType: '股票' },
    { id: '6', date: '2024-06', amount: 1200, snapshot: 18850, account: '支付宝', note: '月定投', assetType: '股票' },

    // 基金投资记录
    { id: '7', date: '2024-01', amount: 2000, snapshot: 22300, account: '银行卡', note: '基金定投', assetType: '基金' },
    { id: '8', date: '2024-02', amount: 2000, snapshot: 24500, account: '银行卡', note: '基金定投', assetType: '基金' },
    { id: '9', date: '2024-03', amount: 2500, snapshot: 27300, account: '银行卡', note: '增加投入', assetType: '基金' },
    { id: '10', date: '2024-04', amount: 2000, snapshot: 29600, account: '银行卡', note: '基金定投', assetType: '基金' },
    { id: '11', date: '2024-05', amount: 2000, snapshot: 31900, account: '银行卡', note: '基金定投', assetType: '基金' },
    { id: '12', date: '2024-06', amount: 2000, snapshot: 34200, account: '银行卡', note: '基金定投', assetType: '基金' },

    // 债券投资记录
    { id: '13', date: '2024-02', amount: 5000, snapshot: 10150, account: '支付宝', note: '国债购买', assetType: '债券' },
    { id: '14', date: '2024-04', amount: 3000, snapshot: 13200, account: '支付宝', note: '企业债', assetType: '债券' },
    { id: '15', date: '2024-06', amount: 2000, snapshot: 15300, account: '支付宝', note: '债券定投', assetType: '债券' },

    // 黄金投资记录
    { id: '16', date: '2024-01', amount: 1000, snapshot: 4150, account: '微信', note: '黄金ETF', assetType: '黄金' },
    { id: '17', date: '2024-03', amount: 1500, snapshot: 5720, account: '微信', note: '黄金定投', assetType: '黄金' },
    { id: '18', date: '2024-05', amount: 1000, snapshot: 6810, account: '微信', note: '黄金ETF', assetType: '黄金' },
  ];

  const mockAccounts = [
    { name: '支付宝', icon: '💳' },
    { name: '银行卡', icon: '🏦' },
    { name: '微信', icon: '💰' },
    { name: '现金', icon: '💵' },
  ];

  // 按资产类型组织记录
  const recordsByType: { [assetType: string]: InvestmentRecord[] } = {
    '股票': mockRecords.filter(r => r.id <= '6'),
    '基金': mockRecords.filter(r => r.id > '6' && r.id <= '12'),
    '债券': mockRecords.filter(r => r.id > '12' && r.id <= '15'),
    '黄金': mockRecords.filter(r => r.id > '15'),
  };

  return {
    recordsByType,
    accounts: mockAccounts,
  };
};

// 检查是否需要初始化假数据
export const shouldInitMockData = (): boolean => {
  const records = localStorage.getItem('investmentRecords');
  return !records || Object.keys(JSON.parse(records)).length === 0;
};

// 初始化假数据
export const initMockData = () => {
  const mockData = generateMockData();

  localStorage.setItem('investmentRecords', JSON.stringify(mockData.recordsByType));
  localStorage.setItem('accounts', JSON.stringify(mockData.accounts));

  return mockData;
};
