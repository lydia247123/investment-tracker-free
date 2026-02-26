import { shouldInitMockData, initMockData } from './mockData';

// 清除所有投资数据
export const clearAllData = () => {
  localStorage.removeItem('investmentRecords');
  localStorage.removeItem('initialAssets');
  localStorage.removeItem('accounts');
  console.log('All data cleared');
};

// 重新初始化假数据
export const resetToMockData = () => {
  clearAllData();
  initMockData();
  console.log('Reset to mock data');
  // Refresh page to apply changes
  window.location.reload();
};

// 在开发模式下添加到全局window对象，方便在控制台调用
if (import.meta.env.DEV) {
  (window as any).clearInvestmentData = clearAllData;
  (window as any).resetToMockData = resetToMockData;
}
