import React, { useMemo } from 'react';
import { LineChart } from '@components/charts/LineChart';
import { InfoTooltip } from '@components/ui/InfoTooltip';
import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { calculateOverallReturnRate, getPreviousMonth, calculateMonthlyProfit, calculateCurrentMonthInvestment, groupSnapshotsByAccount } from '@utils/investmentCalculations';
import { calculateMonthlyAccumulatedProfit, calculateTotalMetalValue } from '@utils/metalCalculations';
import { BaseDashboardData } from '@services/DashboardDataManager';

interface OverallReturnRateChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  dateRange?: {
    startMonth: string | null;
    endMonth: string | null;
  };
  recordsByType: RecordsByType;
  recordsByMetalType: RecordsByMetalType;
  baseData?: BaseDashboardData; // 可选的共享基础数据
}

const OverallReturnRateChart = React.memo(({
  filterType = 'all',
  dateRange,
  recordsByType,
  recordsByMetalType,
  baseData
}: OverallReturnRateChartProps) => {

  // ========== 性能优化：使用共享数据 ==========
  console.log('📊 [OverallReturnRateChart] Render, baseData:', baseData ? '✓ Using shared data' : '✗ Using independent calculation');

  // 计算图表数据
  const chartData = useMemo(() => {
    // ========== 性能优化：优先使用共享数据 ==========
    if (baseData) {
      console.log('  ✓ Using baseData (monthly profits, metal profits, snapshot data)');

      // 贵金属模式：不显示收益率
      if (filterType === 'metal') {
        return null;
      }

      // 收集所有记录
      const allRecords = Object.values(recordsByType).flat();

      // 应用日期过滤（仅用于限制计算范围，不影响收益率计算逻辑）
      const filteredRecords = filterRecordsByDateRange(
        allRecords,
        dateRange || { startMonth: null, endMonth: null }
      );

      // 获取所有月份（使用共享数据）
      const allMonths = baseData.allMonths || [];

      // 计算每个月的收益率和收益金额
      const dataPoints = allMonths.map(month => {
        let returnRate = 0;
        let profitAmount = 0;  // 新增：收益金额

        if (filterType === 'all') {
          // 1. 使用共享的月度收益数据
          const normalMonthlyProfit = baseData.monthlyProfits.get(month) || 0;
          profitAmount = normalMonthlyProfit;  // 初始化为普通投资收益

          // 2. 计算普通投资的当月投资金额
          const normalCurrentMonthInvestment = calculateCurrentMonthInvestment(month, allRecords);

          console.log(`📊 [${month}] Overall Return Rate Calculation - Normal Investment:`, {
            Profit: normalMonthlyProfit.toFixed(2),
            Investment: normalCurrentMonthInvestment.toFixed(2)
          });
          console.log(`  → Normal investment profit: $${normalMonthlyProfit.toFixed(2)}`);
          console.log(`  → Normal investment this month: $${normalCurrentMonthInvestment.toFixed(2)}`);

          // 3. 使用共享的贵金属月度收益数据
          let metalMonthlyProfit = 0;
          let metalCurrentMonthInvestment = 0;
          const metalRecords = Object.values(recordsByMetalType).flat();

          if (metalRecords.length > 0) {
            const metalProfits = baseData.monthlyMetalProfits.get(month) || {};
            metalMonthlyProfit = Object.values(metalProfits).reduce((sum, p) => sum + p, 0);

            const monthMetalRecords = metalRecords.filter(r => r.date === month);
            metalCurrentMonthInvestment = monthMetalRecords.reduce(
              (sum, r) => sum + (r.grams * r.pricePerGram),
              0
            );

            console.log(`📊 [${month}] Overall Return Rate Calculation - Precious Metal:`, {
              Profit: metalMonthlyProfit.toFixed(2),
              Investment: metalCurrentMonthInvestment.toFixed(2)
            });
            console.log(`  → Precious metal profit: $${metalMonthlyProfit.toFixed(2)}`);
            console.log(`  → Precious metal this month: $${metalCurrentMonthInvestment.toFixed(2)}`);
          }

          // 4. 计算总收益和总投资
          const totalMonthlyProfit = normalMonthlyProfit + metalMonthlyProfit;
          const totalCurrentMonthInvestment = normalCurrentMonthInvestment + metalCurrentMonthInvestment;

          // 4.5. 计算上月快照金额（用于当月无投资时的分母）
          let previousMonthSnapshot = 0;

          // 4.5.1. 普通投资的上月快照（使用共享数据）
          const previousMonth = getPreviousMonth(month);
          const snapshotsByAccount = baseData.snapshotsByAccount;

          snapshotsByAccount.forEach((snapshots) => {
            const validSnapshots = snapshots.filter(s => s.date <= previousMonth);
            if (validSnapshots.length > 0) {
              const latestSnapshot = validSnapshots[validSnapshots.length - 1];
              previousMonthSnapshot += latestSnapshot.snapshot;
            }
          });

          // 4.5.2. 贵金属的上月市值（需要计算）
          if (metalRecords.length > 0) {
            const previousMonthMetalValue = calculateTotalMetalValue(recordsByMetalType, previousMonth);
            previousMonthSnapshot += previousMonthMetalValue;
          }

          // 5. 计算收益率：根据当月是否有投资选择分母
          let denominator = 0;
          if (totalCurrentMonthInvestment > 0) {
            // 当月有投资：使用当月投资作为分母
            denominator = totalCurrentMonthInvestment;
          } else {
            // 当月无投资：使用上月快照作为分母
            denominator = previousMonthSnapshot;
          }

          returnRate = denominator > 0
            ? (totalMonthlyProfit / denominator) * 100
            : 0;

          console.log(`📊 [${month}] Overall Return Rate Calculation - Summary:`, {
            TotalProfit: totalMonthlyProfit.toFixed(2),
            CurrentInvestment: totalCurrentMonthInvestment.toFixed(2),
            PreviousSnapshot: previousMonthSnapshot.toFixed(2),
            ActualDenominator: denominator.toFixed(2),
            ReturnRate: returnRate.toFixed(2) + '%'
          });
          console.log(`✨ Return Rate = (Total Profit ÷ Denominator) × 100%`);
          console.log(`✨ Numerator (Total Profit) = $${totalMonthlyProfit.toFixed(2)} = $${normalMonthlyProfit.toFixed(2)}(Normal) + $${metalMonthlyProfit.toFixed(2)}(Metal)`);
          if (totalCurrentMonthInvestment > 0) {
            console.log(`✨ Denominator (Current Investment) = $${denominator.toFixed(2)} (Has investment this month, using current investment)`);
          } else {
            console.log(`✨ Denominator (Previous Snapshot) = $${denominator.toFixed(2)} (No investment this month, using previous snapshot = $${previousMonthSnapshot.toFixed(2)})`);
          }
          console.log(`✨ Result: ${returnRate.toFixed(2)}% = (${totalMonthlyProfit.toFixed(2)} ÷ ${denominator.toFixed(2)}) × 100`);

          // 6. 更新收益金额
          profitAmount = totalMonthlyProfit;

        } else if (filterType === 'investment') {
          // 普通投资模式 - 使用共享的月度收益数据
          const allRecords = Object.values(recordsByType).flat();
          returnRate = calculateOverallReturnRate(month, allRecords);
          profitAmount = baseData.monthlyProfits.get(month) || 0;
        }

        return {
          name: month,        // X轴显示
          value: returnRate,  // 折线图的值（收益率）
          returnRate,         // 收益率（供tooltip使用）
          profitAmount        // 收益金额（供tooltip使用）
        };
      });

      // Print summary table
      console.log('\n========== Overall Return Rate Trend Chart - Data Summary ==========');
      console.table(dataPoints.map(({ name, value, profitAmount }) => ({
        Month: name,
        ReturnRate: value.toFixed(2) + '%',
        ProfitAmount: '$' + profitAmount.toFixed(2)
      })));
      console.log('=====================================\n');

      // 关键修复：应用日期筛选到显示数据
      // 收益率计算使用完整历史数据，但显示时可以根据日期范围筛选
      let displayDataPoints = dataPoints;
      if (dateRange?.startMonth || dateRange?.endMonth) {
        displayDataPoints = dataPoints.filter(dp => {
          if (dateRange?.startMonth && dp.name < dateRange.startMonth) return false;
          if (dateRange?.endMonth && dp.name > dateRange.endMonth) return false;
          return true;
        });

        console.log('\n========== 📅 Date Filter Applied ==========');
        console.log(`Filter Range: ${dateRange.startMonth || 'None'} ~ ${dateRange.endMonth || 'None'}`);
        console.log(`Original Data Points: ${dataPoints.length}`);
        console.log(`Filtered Data Points: ${displayDataPoints.length}`);
        console.log('=====================================\n');
      }

      return displayDataPoints;
    }

    // ========== Fallback: Original calculation logic (when baseData is unavailable) ==========
    console.log('  ⚠ Using original calculation (OverallReturnRateChart)');

    // 贵金属模式：不显示收益率
    if (filterType === 'metal') {
      return null;
    }

    // 收集所有记录
    const allRecords = Object.values(recordsByType).flat();

    // 应用日期过滤（仅用于限制计算范围，不影响收益率计算逻辑）
    const filteredRecords = filterRecordsByDateRange(
      allRecords,
      dateRange || { startMonth: null, endMonth: null }
    );

    // 获取所有月份（使用完整数据，不使用筛选后的数据）
    // 这是关键修复：收益率计算必须基于完整历史数据
    const allMonths = Array.from(
      new Set(allRecords.map(r => r.date))
    ).sort();

    // 计算每个月的收益率和收益金额
    const dataPoints = allMonths.map(month => {
      let returnRate = 0;
      let profitAmount = 0;  // 新增：收益金额

      if (filterType === 'all') {
        // 1. 计算普通投资的月度收益（使用 allRecords，不使用 filteredRecords）
        const allRecords = Object.values(recordsByType).flat();
        const normalMonthlyProfit = calculateMonthlyProfit(month, allRecords);
        profitAmount = normalMonthlyProfit;  // 初始化为普通投资收益

        // 2. 计算普通投资的当月投资金额
        const normalCurrentMonthInvestment = calculateCurrentMonthInvestment(month, allRecords);

        console.log(`📊 [${month}] Overall Return Rate Calculation - Normal Investment:`, {
          Profit: normalMonthlyProfit.toFixed(2),
          Investment: normalCurrentMonthInvestment.toFixed(2)
        });
        console.log(`  → Normal investment profit: $${normalMonthlyProfit.toFixed(2)}`);
        console.log(`  → Normal investment this month: $${normalCurrentMonthInvestment.toFixed(2)}`);

        // 3. 计算贵金属的月度收益和当月投资
        let metalMonthlyProfit = 0;
        let metalCurrentMonthInvestment = 0;
        const metalRecords = Object.values(recordsByMetalType).flat();

        if (metalRecords.length > 0) {
          const metalProfits = calculateMonthlyAccumulatedProfit(recordsByMetalType, month);
          metalMonthlyProfit = Object.values(metalProfits).reduce((sum, p) => sum + p, 0);

          const monthMetalRecords = metalRecords.filter(r => r.date === month);
          metalCurrentMonthInvestment = monthMetalRecords.reduce(
            (sum, r) => sum + (r.grams * r.pricePerGram),
            0
          );

          console.log(`📊 [${month}] Overall Return Rate Calculation - Precious Metal:`, {
            Profit: metalMonthlyProfit.toFixed(2),
            Investment: metalCurrentMonthInvestment.toFixed(2)
          });
          console.log(`  → Precious metal profit: $${metalMonthlyProfit.toFixed(2)}`);
          console.log(`  → Precious metal this month: $${metalCurrentMonthInvestment.toFixed(2)}`);
        }

        // 4. 计算总收益和总投资
        const totalMonthlyProfit = normalMonthlyProfit + metalMonthlyProfit;
        const totalCurrentMonthInvestment = normalCurrentMonthInvestment + metalCurrentMonthInvestment;

        // 4.5. 计算上月快照金额（用于当月无投资时的分母）
        let previousMonthSnapshot = 0;

        // 4.5.1. 普通投资的上月快照
        const previousMonth = getPreviousMonth(month);
        // allRecords 已在第53行声明，直接使用
        const snapshotsByAccount = groupSnapshotsByAccount(
          allRecords.filter(r => r.snapshot !== undefined)
        );

        snapshotsByAccount.forEach((snapshots) => {
          const validSnapshots = snapshots.filter(s => s.date <= previousMonth);
          if (validSnapshots.length > 0) {
            const latestSnapshot = validSnapshots[validSnapshots.length - 1];
            previousMonthSnapshot += latestSnapshot.snapshot;
          }
        });

        // 4.5.2. 贵金属的上月市值
        if (metalRecords.length > 0) {
          const previousMonthMetalValue = calculateTotalMetalValue(recordsByMetalType, previousMonth);
          previousMonthSnapshot += previousMonthMetalValue;
        }

        // 5. 计算收益率：根据当月是否有投资选择分母
        let denominator = 0;
        if (totalCurrentMonthInvestment > 0) {
          // 当月有投资：使用当月投资作为分母
          denominator = totalCurrentMonthInvestment;
        } else {
          // 当月无投资：使用上月快照作为分母
          denominator = previousMonthSnapshot;
        }

        returnRate = denominator > 0
          ? (totalMonthlyProfit / denominator) * 100
          : 0;

        console.log(`📊 [${month}] Overall Return Rate Calculation - Summary:`, {
          TotalProfit: totalMonthlyProfit.toFixed(2),
          CurrentInvestment: totalCurrentMonthInvestment.toFixed(2),
          PreviousSnapshot: previousMonthSnapshot.toFixed(2),
          ActualDenominator: denominator.toFixed(2),
          ReturnRate: returnRate.toFixed(2) + '%'
        });
        console.log(`✨ Return Rate = (Total Profit ÷ Denominator) × 100%`);
        console.log(`✨ Numerator (Total Profit) = $${totalMonthlyProfit.toFixed(2)} = $${normalMonthlyProfit.toFixed(2)}(Normal) + $${metalMonthlyProfit.toFixed(2)}(Metal)`);
        if (totalCurrentMonthInvestment > 0) {
          console.log(`✨ Denominator (Current Investment) = $${denominator.toFixed(2)} (Has investment this month, using current investment)`);
        } else {
          console.log(`✨ Denominator (Previous Snapshot) = $${denominator.toFixed(2)} (No investment this month, using previous snapshot = $${previousMonthSnapshot.toFixed(2)})`);
        }
        console.log(`✨ Result: ${returnRate.toFixed(2)}% = (${totalMonthlyProfit.toFixed(2)} ÷ ${denominator.toFixed(2)}) × 100`);

        // 6. 更新收益金额
        profitAmount = totalMonthlyProfit;

      } else if (filterType === 'investment') {
        // 普通投资模式 - 使用完整历史数据计算收益率
        // 关键修复：收益率计算必须基于完整历史数据，日期筛选只影响显示
        const allRecords = Object.values(recordsByType).flat();
        returnRate = calculateOverallReturnRate(month, allRecords);
        profitAmount = calculateMonthlyProfit(month, allRecords);
      }

      return {
        name: month,        // X轴显示
        value: returnRate,  // 折线图的值（收益率）
        returnRate,         // 收益率（供tooltip使用）
        profitAmount        // 收益金额（供tooltip使用）
      };
    });

    // Print summary table
    console.log('\n========== Overall Return Rate Trend Chart - Data Summary ==========');
    console.table(dataPoints.map(({ name, value, profitAmount }) => ({
      Month: name,
      ReturnRate: value.toFixed(2) + '%',
      ProfitAmount: '$' + profitAmount.toFixed(2)
    })));
    console.log('=====================================\n');

    // 关键修复：应用日期筛选到显示数据
    // 收益率计算使用完整历史数据，但显示时可以根据日期范围筛选
    let displayDataPoints = dataPoints;
    if (dateRange?.startMonth || dateRange?.endMonth) {
      displayDataPoints = dataPoints.filter(dp => {
        if (dateRange?.startMonth && dp.name < dateRange.startMonth) return false;
        if (dateRange?.endMonth && dp.name > dateRange.endMonth) return false;
        return true;
      });

      console.log('\n========== 📅 Date Filter Applied ==========');
      console.log(`Filter Range: ${dateRange.startMonth || 'None'} ~ ${dateRange.endMonth || 'None'}`);
      console.log(`Original Data Points: ${dataPoints.length}`);
      console.log(`Filtered Data Points: ${displayDataPoints.length}`);
      console.log('=====================================\n');
    }

    return displayDataPoints;
  }, [baseData, recordsByType, recordsByMetalType, filterType, dateRange]);

  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <LineChart
        data={chartData}
        color="#10b981"
        height={300}
        title={
          <span className="flex items-center justify-center">
            Return Rate
            <InfoTooltip content={['Monthly profit ÷ Max(current investment, previous snapshot) × 100%']} />
          </span>
        }
        yAxisFormatter={(value: number) => `${value.toFixed(2)}%`}
        tooltipFormatter={(value: number | undefined, _name?: string, payload?: any) => {
          const returnRate = value || 0;
          const profitAmount = payload?.payload?.profitAmount || 0;

          return [
            `Return Rate: ${returnRate.toFixed(2)}%`,
            `Profit Amount: $${profitAmount.toFixed(2)}`
          ];
        }}
      />
    </div>
  );
});

OverallReturnRateChart.displayName = 'OverallReturnRateChart';
export default OverallReturnRateChart;
