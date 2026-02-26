import { PreciousMetalRecord, PreciousMetalType, RecordsByMetalType } from '../types/preciousMetal';

/**
 * 导出贵金属数据为JSON格式
 */
export const exportMetalDataToJSON = (
  recordsByMetalType: RecordsByMetalType,
  selectedTypes?: PreciousMetalType[]
) => {
  // 筛选要导出的数据
  const dataToExport = selectedTypes && selectedTypes.length > 0
    ? selectedTypes.reduce((acc, type) => {
        if (recordsByMetalType[type] && recordsByMetalType[type].length > 0) {
          acc[type] = recordsByMetalType[type];
        }
        return acc;
      }, {} as RecordsByMetalType)
    : recordsByMetalType;

  // 检查是否有数据
  const totalRecords = Object.values(dataToExport).reduce((sum, records) => sum + records.length, 0);
  if (totalRecords === 0) {
    alert('暂无贵金属数据可导出');
    return;
  }

  // 创建JSON内容
  const jsonContent = JSON.stringify(dataToExport, null, 2);

  // 创建Blob并下载
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `贵金属数据_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  console.log(`已导出 ${totalRecords} 条贵金属记录为JSON格式`);
};

/**
 * 导出贵金属数据为CSV格式
 */
export const exportMetalDataToCSV = (
  recordsByMetalType: RecordsByMetalType,
  selectedTypes?: PreciousMetalType[]
) => {
  // 收集所有要导出的记录
  let allRecords: PreciousMetalRecord[] = [];

  if (selectedTypes && selectedTypes.length > 0) {
    // 只导出选中的类型
    selectedTypes.forEach(type => {
      if (recordsByMetalType[type]) {
        allRecords = [...allRecords, ...recordsByMetalType[type]];
      }
    });
  } else {
    // 导出所有类型
    Object.values(recordsByMetalType).forEach(records => {
      allRecords = [...allRecords, ...records];
    });
  }

  // 检查是否有数据
  if (allRecords.length === 0) {
    alert('暂无贵金属数据可导出');
    return;
  }

  // 按日期排序
  allRecords.sort((a, b) => a.date.localeCompare(b.date));

  // 创建CSV内容（添加BOM以支持中文）
  const csvHeaders = ['贵金属类型', '月份', '购买克数', '每克金额', '购买总额', '当月均价', '当前市值', '备注'];
  const csvRows = allRecords.map(record => {
    const totalAmount = (record.grams * record.pricePerGram).toFixed(2);
    const currentValue = (record.grams * record.averagePrice).toFixed(2);
    return [
      record.metalType,
      record.date,
      record.grams.toFixed(2),
      record.pricePerGram.toFixed(2),
      totalAmount,
      record.averagePrice.toFixed(2),
      currentValue,
      record.note || ''
    ];
  });

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // 创建Blob并下载（添加BOM以支持Excel正确显示中文）
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `贵金属数据_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  console.log(`已导出 ${allRecords.length} 条贵金属记录为CSV格式`);
};

/**
 * 导出贵金属统计摘要为CSV格式
 */
export const exportMetalStatsToCSV = (
  recordsByMetalType: RecordsByMetalType,
  statsByType: Record<PreciousMetalType, {
    totalGrams: number;
    totalAmount: number;
    currentValue: number;
    monthlyProfit: number;
    totalProfit: number;
  }>
) => {
  const types: PreciousMetalType[] = ['黄金', '白银', '铂金', '钯金'];

  // 筛选有数据的类型
  const typesWithData = types.filter(type =>
    recordsByMetalType[type] && recordsByMetalType[type].length > 0
  );

  if (typesWithData.length === 0) {
    alert('暂无贵金属统计数据可导出');
    return;
  }

  // 创建CSV内容
  const csvHeaders = ['贵金属类型', '记录数量', '累计克数', '累计金额', '当前市值', '整体收益', '月度收益'];
  const csvRows = typesWithData.map(type => {
    const records = recordsByMetalType[type];
    const stats = statsByType[type];
    return [
      type,
      records.length.toString(),
      stats.totalGrams.toFixed(2),
      stats.totalAmount.toFixed(2),
      stats.currentValue.toFixed(2),
      stats.totalProfit.toFixed(2),
      stats.monthlyProfit.toFixed(2)
    ];
  });

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // 创建Blob并下载
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `贵金属统计摘要_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  console.log(`已导出贵金属统计摘要`);
};
