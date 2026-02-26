import { RiskAnalysisData, RiskLevel } from '../types/risk';
import { RecordsByType } from '../types/investment';
import { RecordsByMetalType } from '../types/preciousMetal';
import { calculateTimeDepositTotalProfit } from './timeDepositCalculations';
import { calculateTotalGrams } from './metalCalculations';
import { useRiskConfigStore } from '@store/riskConfigStore';

/**
 * 计算所有资产的风险分布
 *
 * @param recordsByType - 投资记录（按资产类型分组）
 * @param recordsByMetalType - 贵金属记录（按金属类型分组）
 * @returns 按风险等级分组的风险分析数据
 */
export function calculateRiskDistribution(
  recordsByType: RecordsByType,
  recordsByMetalType: RecordsByMetalType
): RiskAnalysisData[] {
  // 获取当前月份（用于定期存款利息计算）
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 初始化风险等级映射
  const riskDistributionMap = new Map<RiskLevel, {
    totalAssets: number;
    assetTypes: Set<string>;
    assetCount: number;
  }>();

  // 初始化所有风险等级
  Object.values(RiskLevel).forEach(level => {
    riskDistributionMap.set(level as RiskLevel, {
      totalAssets: 0,
      assetTypes: new Set<string>(),
      assetCount: 0
    });
  });

  // 1. 处理普通投资记录
  Object.entries(recordsByType).forEach(([assetType, records]) => {
    if (records.length === 0) return;

    // 获取该资产类型的风险等级
    const riskLevel = useRiskConfigStore.getState().getAssetRiskLevel(assetType);
    const distribution = riskDistributionMap.get(riskLevel);
    if (!distribution) return;

    // 分离定期存款和普通投资记录
    const timeDepositRecords = records.filter(r => r.isTimeDeposit);
    const normalRecords = records.filter(r => !r.isTimeDeposit);

    let totalAssets = 0;

    // 1.1 计算普通投资的最新快照
    const latestSnapshotByAccount = new Map<string, number>();
    const recordsByAccount = new Map<string, typeof normalRecords>();

    normalRecords.forEach(record => {
      const key = record.account;
      if (!recordsByAccount.has(key)) {
        recordsByAccount.set(key, []);
      }
      recordsByAccount.get(key)!.push(record);
    });

    recordsByAccount.forEach((accountRecords) => {
      const sortedRecords = accountRecords.sort((a, b) => a.date.localeCompare(b.date));
      const latestRecord = sortedRecords[sortedRecords.length - 1];

      if (latestRecord && latestRecord.snapshot !== undefined) {
        latestSnapshotByAccount.set(latestRecord.account, latestRecord.snapshot);
      }
    });

    const normalInvestmentAssets = Array.from(latestSnapshotByAccount.values())
      .reduce((sum, val) => sum + val, 0);

    // 1.2 计算定期存款的虚拟快照（本金 + 累计利息）
    let timeDepositAssets = 0;
    if (timeDepositRecords.length > 0) {
      timeDepositRecords.forEach(record => {
        const totalProfit = calculateTimeDepositTotalProfit(record, currentMonth);
        const currentValue = record.amount + totalProfit;
        timeDepositAssets += currentValue;
      });
    }

    totalAssets = normalInvestmentAssets + timeDepositAssets;

    // 累加到对应风险等级
    if (totalAssets > 0) {
      distribution.totalAssets += totalAssets;
      distribution.assetTypes.add(assetType);
      distribution.assetCount += records.length;
    }
  });

  // 2. 处理贵金属记录
  Object.entries(recordsByMetalType).forEach(([metalType, records]) => {
    if (records.length === 0) return;

    // 获取该贵金属类型的风险等级
    const riskLevel = useRiskConfigStore.getState().getAssetRiskLevel(metalType);
    const distribution = riskDistributionMap.get(riskLevel);
    if (!distribution) return;

    // 计算贵金属总克数
    const metalGrams = calculateTotalGrams(records);

    // 找到最新记录的均价
    const latestRecord = records.reduce((latest, record) =>
      record.date > latest.date ? record : latest
    , records[0]);

    // 计算当前资产 = 均价 × 克数
    const metalAssets = latestRecord.averagePrice * metalGrams;

    // 累加到对应风险等级
    if (metalAssets > 0) {
      distribution.totalAssets += metalAssets;
      distribution.assetTypes.add(metalType);
      distribution.assetCount += records.length;
    }
  });

  // 3. 计算总资产
  const totalAssets = Array.from(riskDistributionMap.values())
    .reduce((sum, data) => sum + data.totalAssets, 0);

  // 4. 转换为结果数组并计算占比
  const result: RiskAnalysisData[] = Array.from(riskDistributionMap.entries())
    .map(([riskLevel, data]) => ({
      riskLevel,
      totalAssets: data.totalAssets,
      percentage: totalAssets > 0 ? (data.totalAssets / totalAssets) * 100 : 0,
      assetTypes: Array.from(data.assetTypes),
      assetCount: data.assetCount
    }))
    .filter(item => item.totalAssets > 0) // 过滤掉没有资产的等级
    .sort((a, b) => {
      // 按风险等级排序（低风险 → 高风险）
      const riskOrder = {
        [RiskLevel.LOW]: 1,
        [RiskLevel.MEDIUM_LOW]: 2,
        [RiskLevel.MEDIUM]: 3,
        [RiskLevel.MEDIUM_HIGH]: 4,
        [RiskLevel.HIGH]: 5
      };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

  return result;
}
