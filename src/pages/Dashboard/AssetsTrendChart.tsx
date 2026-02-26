import React, { useMemo } from 'react';
import { AreaChart } from '@components/charts/AreaChart';
import { InfoTooltip } from '@components/ui/InfoTooltip';
import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { calculateTimeDepositTotalProfit, calculateMaturityDate } from '@utils/timeDepositCalculations';
import { calculateTotalMetalValue } from '@utils/metalCalculations';
import { getCachedData } from '@utils/dashboardDataCache';
import { BaseDashboardData } from '@services/DashboardDataManager';

interface AssetsTrendChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  recordsByType: RecordsByType;
  recordsByMetalType: RecordsByMetalType;
  baseData?: BaseDashboardData; // 可选的共享基础数据
}

const AssetsTrendChart = React.memo(({ filterType = 'all', recordsByType, recordsByMetalType, baseData }: AssetsTrendChartProps) => {
  // 免费版始终显示全部数据，dateRange 始终为 null
  const dateRange = useMemo(() => ({
    startMonth: null as string | null,
    endMonth: null as string | null
  }), []);
  // Derive includeMetal from filterType: include metals in 'all' and 'metal' modes, exclude in 'investment' mode
  const includeMetal = filterType === 'all' || filterType === 'metal';

  // ========== 性能优化：优先使用共享数据 ==========
  const chartData = useMemo(() => {
    if (filterType === 'metal') return null;

    if (baseData) {
      const sortedMonths = (baseData.allMonths || [])
        .filter(month => {
          if (dateRange?.startMonth && month < dateRange.startMonth) return false;
          if (dateRange?.endMonth && month > dateRange.endMonth) return false;
          return true;
        })
        .sort();

      return sortedMonths.map(month => ({
        label: month,
        value: filterType === 'investment'
          ? ((baseData.monthlyInvestmentAssets && typeof baseData.monthlyInvestmentAssets.get === 'function' ? baseData.monthlyInvestmentAssets.get(month) : 0) || 0)
          : ((baseData.monthlyTotalAssets && typeof baseData.monthlyTotalAssets.get === 'function' ? baseData.monthlyTotalAssets.get(month) : 0) || 0)
      }));
    }

    // ========== 回退：原始计算逻辑（baseData 不可用时） ==========
    const allRecords: any[] = [];
    if (recordsByType) {
      Object.values(recordsByType).forEach(records => {
        if (Array.isArray(records)) {
          records.forEach(r => {
            if (r) allRecords.push(r);
          });
        }
      });
    }

    const snapshotRecords = allRecords.filter(r => r && r.snapshot !== undefined && !r.isTimeDeposit);
    const timeDepositRecords = allRecords.filter(r => r && r.isTimeDeposit === true);

    if (snapshotRecords.length === 0 && timeDepositRecords.length === 0) {
      return [];
    }

    return getCachedData(
      'assets-trend-chart-fallback',
      { recordsByType, recordsByMetalType, filterType, dateRange },
      () => {
        const months = new Set<string>();
        allRecords.forEach(r => {
          if (r && r.date) months.add(r.date);
        });

        if (includeMetal && recordsByMetalType) {
          Object.values(recordsByMetalType).forEach(records => {
            if (Array.isArray(records)) {
              records.forEach(r => {
                if (r && r.date) months.add(r.date);
              });
            }
          });
        }

        const sortedMonths = Array.from(months)
          .filter(month => {
            if (dateRange?.startMonth && month < dateRange.startMonth) return false;
            if (dateRange?.endMonth && month > dateRange.endMonth) return false;
            return true;
          })
          .sort();

        return sortedMonths.map(month => {
          // 基础汇总逻辑（回退模式下的简化版）
          let total = 0;
          // 汇总普通投资快照（排除定期存款，定期存款在下面单独处理）
          const recordsByAccount = new Map<string, any[]>();
          allRecords
            .filter(r => r.date <= month && !r.isTimeDeposit)
            .forEach(r => {
              if (!recordsByAccount.has(r.account)) recordsByAccount.set(r.account, []);
              recordsByAccount.get(r.account)!.push(r);
            });

          recordsByAccount.forEach(accRecords => {
            if (!Array.isArray(accRecords) || accRecords.length === 0) return;
            const sortedAccRecords = [...accRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            const latest = sortedAccRecords[0];
            if (latest && latest.snapshot !== undefined) {
              total += latest.snapshot;
            } else {
              total += accRecords.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
            }
          });

          // 汇总定期存款（本金 + 利息）
          timeDepositRecords.filter(r => r.date <= month).forEach(record => {
            const totalProfit = calculateTimeDepositTotalProfit(record, month);
            const currentValue = (Number(record.amount) || 0) + (Number(totalProfit) || 0);
            total += currentValue;
          });

          // 汇总贵金属
          if (includeMetal) {
            total += calculateTotalMetalValue(recordsByMetalType, month);
          }

          return { label: month, value: total };
        });
      }
    );
  }, [baseData, filterType, recordsByType, recordsByMetalType, includeMetal]);

  // 贵金属模式下不显示组件
  if (filterType === 'metal') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      {chartData && chartData.length > 0 ? (
        <AreaChart
          data={chartData}
          height={280}
          title={
            <span className="flex items-center justify-center">
              Total Assets
              <InfoTooltip content={['Monthly total assets across all accounts']} />
            </span>
          }
          yLabel="Snapshot Amount ($)"
          xLabel="Month"
          color="#10b981"
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          No snapshot data, please add investment records with snapshot amounts or time deposits
        </div>
      )}
    </div>
  );
});

AssetsTrendChart.displayName = 'AssetsTrendChart';
export default AssetsTrendChart;
