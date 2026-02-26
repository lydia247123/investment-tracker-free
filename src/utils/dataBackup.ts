/**
 * 数据备份工具函数
 * 用于导出所有数据到 JSON 或 CSV 格式
 */

import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import { Account } from '@types/account';

/**
 * 备份数据接口
 */
export interface BackupData {
  version: string;
  exportDate: string;
  data: {
    investmentRecords: RecordsByType;
    preciousMetalRecords: RecordsByMetalType;
    accounts: Account[];
    initialAssetsByType: Record<string, number>;
  };
}

/**
 * 格式化日期为文件名格式
 * YYYY-MM-DD-HH-mm-ss
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

/**
 * 下载 JSON 文件
 */
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8;'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 导出所有数据为 JSON 文件
 */
export function exportAllData() {
  try {
    // 直接从 localStorage 获取数据
    const investmentRecordsStr = localStorage.getItem('investmentRecords');
    const preciousMetalRecordsStr = localStorage.getItem('preciousMetalRecords');
    const accountsStr = localStorage.getItem('accounts');
    const initialAssetsStr = localStorage.getItem('initialAssetsByType');

    // 解析数据，如果不存在则为空对象/空数组
    const investmentRecords: RecordsByType = investmentRecordsStr
      ? JSON.parse(investmentRecordsStr)
      : {};
    const preciousMetalRecords: RecordsByMetalType = preciousMetalRecordsStr
      ? JSON.parse(preciousMetalRecordsStr)
      : {};
    const accounts: Account[] = accountsStr
      ? JSON.parse(accountsStr)
      : [];
    const initialAssetsByType: Record<string, number> = initialAssetsStr
      ? JSON.parse(initialAssetsStr)
      : {};

    // 构建备份数据对象
    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        investmentRecords,
        preciousMetalRecords,
        accounts,
        initialAssetsByType
      }
    };

    // 生成文件名
    const filename = `investment-tracker-backup-${formatDateForFilename(new Date())}.json`;

    // 下载文件
    downloadJSON(backupData, filename);

    return true;
  } catch (error) {
    console.error('Data export failed:', error);
    alert('Data export failed, please try again');
    return false;
  }
}

/**
 * 导出投资数据为 CSV
 */
export function exportInvestmentData() {
  try {
    const investmentRecordsStr = localStorage.getItem('investmentRecords');
    const investmentRecords: RecordsByType = investmentRecordsStr
      ? JSON.parse(investmentRecordsStr)
      : {};

    const allRecords = Object.values(investmentRecords).flat();

    if (allRecords.length === 0) {
      alert('没有投资数据可以导出');
      return false;
    }

    // 构建 CSV 内容
    const headers = ['ID', '日期', '资产类型', '账户', '投资金额', '快照金额', '是否定期存款', '存期(月)', '年化利率(%)', '到期日期', '备注'];
    const rows = allRecords.map(record => [
      record.id,
      record.date,
      record.assetType,
      record.account,
      record.amount.toFixed(2),
      record.snapshot ? record.snapshot.toFixed(2) : '',
      record.isTimeDeposit ? '是' : '否',
      record.depositTermMonths || '',
      record.annualInterestRate || '',
      record.maturityDate || '',
      record.note || ''
    ]);

    // 添加 BOM 头以支持 Excel 正确显示中文
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `investment-data-${formatDateForFilename(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('Investment data export failed:', error);
    alert('Investment data export failed, please try again');
    return false;
  }
}

/**
 * 导出贵金属数据为 CSV
 */
export function exportMetalData() {
  try {
    const preciousMetalRecordsStr = localStorage.getItem('preciousMetalRecords');
    const preciousMetalRecords: RecordsByMetalType = preciousMetalRecordsStr
      ? JSON.parse(preciousMetalRecordsStr)
      : {};

    const allRecords = Object.values(preciousMetalRecords).flat();

    if (allRecords.length === 0) {
      alert('没有贵金属数据可以导出');
      return false;
    }

    // 构建 CSV 内容
    const headers = ['ID', '日期', '贵金属类型', '数量(克)', '购买单价(元/克)', '市场均价(元/克)', '备注'];
    const rows = allRecords.map(record => {
      // 计算 amount（如果不存在）
      const amount = record.amount !== undefined
        ? record.amount
        : (record.grams * record.averagePrice);

      return [
        record.id,
        record.date,
        record.metalType,
        record.grams?.toFixed(2) || '0',
        record.pricePerGram?.toFixed(2) || '0',
        record.averagePrice?.toFixed(2) || '0',
        record.note || ''
      ];
    });

    // 添加 BOM 头以支持 Excel 正确显示中文
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `metal-data-${formatDateForFilename(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('Precious metal data export failed:', error);
    alert('Precious metal data export failed, please try again');
    return false;
  }
}
