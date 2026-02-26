import { InvestmentRecord } from '../types/investment';

/**
 * 导出投资数据为CSV格式
 * @param records 投资记录数组
 * @param filename 可选的文件名，默认为"投资数据_YYYY-MM-DD.csv"
 */
export const exportInvestmentDataToCSV = (
  records: InvestmentRecord[],
  filename?: string
): void => {
  // 检查是否有数据
  if (records.length === 0) {
    alert('暂无投资数据可导出');
    return;
  }

  // 按日期和账户排序
  const sortedRecords = [...records].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.account.localeCompare(b.account);
  });

  // CSV列头
  const csvHeaders = [
    'ID',
    '月份',
    '资产类型',
    '账户',
    '投资金额',
    '快照金额',
    '是否定期存款',
    '存期(月)',
    '年化利率(%)',
    '到期日期',
    '备注'
  ];

  // 转义CSV字段中的特殊字符
  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // 创建CSV行
  const csvRows = sortedRecords.map(record => {
    return [
      escapeCSVField(record.id),
      escapeCSVField(record.date),
      escapeCSVField(record.assetType),
      escapeCSVField(record.account),
      escapeCSVField(record.amount),
      escapeCSVField(record.snapshot),
      escapeCSVField(record.isTimeDeposit ? 'true' : 'false'),
      escapeCSVField(record.depositTermMonths),
      escapeCSVField(record.annualInterestRate),
      escapeCSVField(record.maturityDate),
      escapeCSVField(record.note)
    ];
  });

  // 组合CSV内容
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // 创建Blob并下载（添加BOM以支持Excel正确显示中文）
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || `投资数据_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  console.log(`已导出 ${sortedRecords.length} 条投资记录为CSV格式`);
};
