import { useMemo } from 'react';
import { PieChart } from '@components/charts';
import { useInvestmentStore } from '@store/investmentStore';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { useAccountStore } from '@store/accountStore';
import { calculateTimeDepositTotalProfit } from '@utils/timeDepositCalculations';
import { calculateTotalGrams } from '@utils/metalCalculations';
import { calculateRiskDistribution } from '@utils/riskCalculations';
import { RiskDistributionChart } from './RiskDistributionChart';
import { RiskDetailsTable } from './RiskDetailsTable';
import { getAllRiskLevels } from '@utils/constants/riskLevels';

export const Analytics = () => {
  const { recordsByType } = useInvestmentStore();
  const { recordsByMetalType } = usePreciousMetalStore();
  const { accounts } = useAccountStore();

  // 获取当前月份（用于定期存款利息计算）
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 资产分布数据（饼图）
  const assetDistributionData = useMemo(() => {
    const result: { label: string; value: number }[] = [];

    Object.entries(recordsByType).forEach(([type, records]) => {
      // 分离定期存款和普通投资记录
      const timeDepositRecords = records.filter(r => r.isTimeDeposit);
      const normalRecords = records.filter(r => !r.isTimeDeposit);

      let totalAssets = 0;

      // 1. 计算普通投资的最新快照
      const latestSnapshotByAccount = new Map<string, number>();
      const recordsByAccount = new Map<string, typeof records>();

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

      // 2. 计算定期存款的虚拟快照（本金 + 累计利息）
      // 定期存款使用当前日期计算利息，而不是最新记录日期
      let timeDepositAssets = 0;
      if (timeDepositRecords.length > 0) {
        timeDepositRecords.forEach(record => {
          const totalProfit = calculateTimeDepositTotalProfit(record, currentMonth);
          const currentValue = record.amount + totalProfit;
          timeDepositAssets += currentValue;
        });
      }

      totalAssets = normalInvestmentAssets + timeDepositAssets;

      if (totalAssets > 0) {
        result.push({
          label: type,
          value: totalAssets,
        });
      }
    });

    // 2. 处理贵金属数据
    Object.entries(recordsByMetalType).forEach(([metalType, records]) => {
      if (records.length === 0) return;

      // 计算贵金属总克数
      const metalGrams = calculateTotalGrams(records);

      // 找到最新记录的均价
      const latestRecord = records.reduce((latest, record) =>
        record.date > latest.date ? record : latest
      , records[0]);

      // 计算当前资产 = 均价 × 克数
      const metalAssets = latestRecord.averagePrice * metalGrams;

      if (metalAssets > 0) {
        result.push({
          label: metalType,
          value: metalAssets,
        });
      }
    });

    return result;
  }, [recordsByType, recordsByMetalType]);

  // 风险分布数据
  const riskDistributionData = useMemo(() => {
    return calculateRiskDistribution(recordsByType, recordsByMetalType);
  }, [recordsByType, recordsByMetalType]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset distribution pie chart */}
        <div className="bg-white rounded-xl p-4 shadow-lg" data-tutorial="asset-distribution-chart">
          <PieChart
            data={assetDistributionData}
            height={400}
            title="Asset Distribution"
          />
        </div>

        {/* Risk distribution pie chart */}
        <div className="bg-white rounded-xl p-4 shadow-lg" data-tutorial="risk-distribution-chart">
          <RiskDistributionChart
            data={riskDistributionData}
            height={400}
            title="Risk Distribution"
          />
        </div>
      </div>

      {/* Risk level guide */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Risk Level Guide</h3>
          <p className="text-xs text-gray-500 mb-4">
            Risk levels are classified based on historical volatility ranges
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {getAllRiskLevels().map((config) => (
              <div
                key={config.level}
                className="p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                style={{ borderLeftColor: config.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">{config.name}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{config.shortDescription}</span>
                  <span className="text-xs font-medium" style={{ color: config.color }}>{config.volatility}</span>
                </div>
              </div>
            ))}
          </div>
      </div>

      {/* Risk level details table */}
      <RiskDetailsTable data={riskDistributionData} />

      {/* Detailed data table */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Asset Type</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Total Investment</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Current Assets</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Return Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(recordsByType).map(([type, records]) => {
                // 使用与饼图相同的逻辑计算当前资产
                const timeDepositRecords = records.filter(r => r.isTimeDeposit);
                const normalRecords = records.filter(r => !r.isTimeDeposit);

                // 计算普通投资的最新快照
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

                // 计算定期存款的虚拟快照
                // 定期存款使用当前日期计算利息，而不是最新记录日期
                let timeDepositAssets = 0;
                if (timeDepositRecords.length > 0) {
                  timeDepositRecords.forEach(record => {
                    const totalProfit = calculateTimeDepositTotalProfit(record, currentMonth);
                    const currentValue = record.amount + totalProfit;
                    timeDepositAssets += currentValue;
                  });
                }

                const investment = records.reduce((sum, r) => sum + r.amount, 0);
                const currentAssets = normalInvestmentAssets + timeDepositAssets;
                const returnRate = investment > 0 ? ((currentAssets - investment) / investment) * 100 : 0;

                return (
                  <tr key={type} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">${investment.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">${currentAssets.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${
                      returnRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {returnRate.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}

              {/* Add metal rows */}
              {Object.entries(recordsByMetalType).map(([metalType, records]) => {
                if (records.length === 0) return null;

                const metalGrams = calculateTotalGrams(records);
                const latestRecord = records.reduce((latest, record) =>
                  record.date > latest.date ? record : latest
                , records[0]);
                const currentAssets = latestRecord.averagePrice * metalGrams;
                const investment = records.reduce((sum, r) => sum + r.amount, 0);

                if (currentAssets === 0) return null;

                const returnRate = investment > 0 ? ((currentAssets - investment) / investment) * 100 : 0;

                return (
                  <tr key={metalType} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{metalType}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">${investment.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">${currentAssets.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${
                      returnRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {returnRate.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {assetDistributionData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No investment data, please add investment records first
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
