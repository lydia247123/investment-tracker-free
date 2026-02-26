import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, ChartSeries } from '@components/charts/BarChart';
import { InfoTooltip } from '@components/ui/InfoTooltip';
import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import {
  calculateMonthlyProfit
} from '@utils/investmentCalculations';
import { calculateMonthlyAccumulatedProfit } from '@utils/metalCalculations';
import { BaseDashboardData } from '@services/DashboardDataManager';

interface MonthlyProfitChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  recordsByType: RecordsByType;
  recordsByMetalType: RecordsByMetalType;
  baseData?: BaseDashboardData; // 可选的共享基础数据
}

const MonthlyProfitChart = React.memo(({ filterType = 'all', recordsByType, recordsByMetalType, baseData }: MonthlyProfitChartProps) => {
  // 免费版始终显示全部数据，dateRange 始终为 null
  const dateRange = useMemo(() => ({
    startMonth: null as string | null,
    endMonth: null as string | null
  }), []);
  // Derive includeMetal from filterType: include metals in 'all' and 'metal' modes, exclude in 'investment' mode
  const includeMetal = filterType === 'all' || filterType === 'metal';

  // 辅助函数：计算定期存款产生收益的月份范围
  const timeDepositProfitMonths = useMemo(() => {
    // 如果 baseData 存在，优先从 baseData 获取
    if (baseData?.allMonths) {
      return baseData.allMonths;
    }

    const allRecords = Object.values(recordsByType).flat();
    const timeDepositRecords = allRecords.filter(r => r.isTimeDeposit);
    const profitMonths = new Set<string>();

    timeDepositRecords.forEach(record => {
      if (!record.depositTermMonths || !record.annualInterestRate) {
        return;
      }

      const startDate = new Date(record.date + '-01');
      const termEndDate = new Date(startDate);
      termEndDate.setMonth(termEndDate.getMonth() + record.depositTermMonths);

      let monthIterator = new Date(startDate);
      monthIterator.setMonth(monthIterator.getMonth() + 1);

      while (monthIterator < termEndDate) {
        const monthStr = monthIterator.toISOString().slice(0, 7);
        profitMonths.add(monthStr);
        monthIterator.setMonth(monthIterator.getMonth() + 1);
      }
    });

    return Array.from(profitMonths).sort();
  }, [recordsByType, baseData?.allMonths]);

  // 账户选择状态（null表示"全部"模式）
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string> | null>(null);

  // 数据计算
  const chartData = useMemo(() => {
    // ========== 性能优化：优先使用共享数据 ==========
    if (baseData) {
      // ========== 处理普通投资数据 ==========
      if (filterType === 'metal') {
        // 贵金属模式：不涉及账户，返回 null
        return null;
      }

      if (filterType === 'all' || filterType === 'investment') {
        // 1. 使用共享的所有月份和月度收益
        const sortedMonthsSet = new Set(baseData.allMonths || []);
        timeDepositProfitMonths.forEach(m => sortedMonthsSet.add(m));
        const sortedMonths = Array.from(sortedMonthsSet).sort();
        const monthlyProfits = baseData.monthlyProfits;

        if (sortedMonths.length === 0) {
          return { allData: [], allSeries: [], accountNames: [], isInvestment: true };
        }

        // 2. Build chart data (single series: Total Profit)
        const allData = sortedMonths.map(month => ({
          name: month,
          month,
          'Total Profit': (monthlyProfits && typeof monthlyProfits.get === 'function' ? monthlyProfits.get(month) : 0) || 0
        }));

        // 3. Single series configuration
        const allSeries: ChartSeries[] = [{
          dataKey: 'Total Profit',
          name: 'Total Profit',
          color: '#8b5cf6'
        }];

        // 4. 定义日期范围过滤函数
        const filterDataByDateRange = (data: typeof allData) => {
          if (!dateRange.startMonth && !dateRange.endMonth) return data;

          return data.filter(item => {
            const month = item.month;
            return (!dateRange.startMonth || month >= dateRange.startMonth) &&
                   (!dateRange.endMonth || month <= dateRange.endMonth);
          });
        };

        // 5. 应用日期筛选
        const filteredAllData = filterDataByDateRange(allData);

        return {
          allData: filteredAllData,
          allSeries,
          accountNames: ['Total Profit'],
          isInvestment: true
        };
      }

      return { allData: [], allSeries: [], accountNames: [], isInvestment: false };
    }

    // ========== 回退：原始计算逻辑（baseData 不可用时） ==========
    console.log('  ⚠ Using original calculation (baseData unavailable)');

    // ========== 处理普通投资数据 ==========
    if (filterType === 'metal') {
      // 贵金属模式：不涉及账户，返回 null
      return null;
    }

    if (filterType === 'all' || filterType === 'investment') {
      // 1. 收集所有记录
      const allRecords = Object.values(recordsByType).flat();

      if (allRecords.length === 0) {
        return { allData: [], allSeries: [], accountNames: [], isInvestment: true };
      }

      // 2. 获取所有唯一月份并排序
      let uniqueMonths = new Set(allRecords.map(r => r.date));

      // 如果是"全部"模式且有贵金属数据，也包含贵金属的月份
      if (filterType === 'all' && includeMetal) {
        const allMetalRecords = Object.values(recordsByMetalType).flat();
        allMetalRecords.forEach(record => {
          uniqueMonths.add(record.date);
        });
      }

      // 补充定期存款产生收益的月份
      timeDepositProfitMonths.forEach(m => uniqueMonths.add(m));

      const sortedMonths = Array.from(uniqueMonths).sort();

      // 3. 使用统一的月度收益计算函数
      const monthlyProfits = new Map<string, number>();

      sortedMonths.forEach(month => {
        const profit = calculateMonthlyProfit(month, allRecords);
        monthlyProfits.set(month, profit);
      });

      // 4. Build chart data (single series: Total Profit)
      const allData = sortedMonths.map(month => ({
        name: month,
        month,
        'Total Profit': monthlyProfits.get(month) || 0
      }));

      // 5. Single series configuration
      const allSeries: ChartSeries[] = [{
        dataKey: 'Total Profit',
        name: 'Total Profit',
        color: '#8b5cf6'
      }];

      // 6. Define date range filter function
      const filterDataByDateRange = (data: typeof allData) => {
        if (!dateRange.startMonth && !dateRange.endMonth) return data;

        return data.filter(item => {
          const month = item.month;
          return (!dateRange.startMonth || month >= dateRange.startMonth) &&
                 (!dateRange.endMonth || month <= dateRange.endMonth);
        });
      };

      // 7. Apply date filter
      const filteredAllData = filterDataByDateRange(allData);

      return {
        allData: filteredAllData,
        allSeries,
        accountNames: ['Total Profit'],
        isInvestment: true
      };
    }

    return { allData: [], allSeries: [], accountNames: [], isInvestment: false };
  }, [baseData, recordsByType, recordsByMetalType, filterType, includeMetal]);

  // ========== 处理贵金属投资数据（单系列模式）==========
  const metalChartData = useMemo(() => {
    // ========== 性能优化：优先使用共享数据 ==========
    if (baseData) {
      if (filterType === 'all' || filterType === 'metal') {
        if (!baseData.allMetalRecords || baseData.allMetalRecords.length === 0) {
          return [];
        }

        const sortedMonths = baseData.allMonths || [];

        // ✅ 无论 'all' 还是 'metal'，都计算并返回贵金属收益数据
        // 使用共享的月度贵金属收益数据
        const allMetalData = sortedMonths.map((month) => {
          const monthlyProfits = (typeof baseData.monthlyMetalProfits?.get === 'function' ? baseData.monthlyMetalProfits.get(month) : undefined) || {};

          // 计算所有贵金属的单月收益总和
          const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + (Number(profit) || 0), 0);

          return {
            label: month,
            value: totalProfit
          };
        });

        // 辅助函数：按日期范围筛选贵金属数据
        const filterMetalDataByDateRange = (
          data: Array<{ label: string; value: number }>
        ) => {
          if (!data || data.length === 0) {
            return [];
          }

          if (!dateRange.startMonth && !dateRange.endMonth) {
            return data; // 无筛选，返回全部数据
          }

          return data.filter(item => {
            const month = item.label;
            const startCheck = !dateRange.startMonth || month >= dateRange.startMonth;
            const endCheck = !dateRange.endMonth || month <= dateRange.endMonth;
            return startCheck && endCheck;
          });
        };

        // 在返回前应用日期筛选
        return filterMetalDataByDateRange(allMetalData);
      }

      return [];
    }

    // ========== 回退：原始计算逻辑（baseData 不可用时） ==========
    if (filterType === 'all' || filterType === 'metal') {
      // 收集所有记录（不应用日期过滤，在计算完成后再筛选）
      const allMetalRecords = Object.values(recordsByMetalType).flat();

      if (allMetalRecords.length === 0) {
        return [];
      }

      const uniqueMonths = new Set(allMetalRecords.map(r => r.date));
      const sortedMonths = Array.from(uniqueMonths).sort((a, b) => a.localeCompare(b));

      // ✅ 无论 'all' 还是 'metal'，都计算并返回贵金属收益数据
      // 先计算所有月度收益
      const allMetalData = sortedMonths.map((month) => {
        // 按贵金属类型分组记录
        const recordsByType: { [metalType: string]: typeof allMetalRecords } = {};
        allMetalRecords.forEach(record => {
          if (!recordsByType[record.metalType]) {
            recordsByType[record.metalType] = [];
          }
          recordsByType[record.metalType].push(record);
        });

        // 贵金属月均收益 = 当月均价×当月累计购买克数-上月均价×上月累计购买克数-当月投资金额
        // 使用统一的计算函数
        const monthlyProfits = calculateMonthlyAccumulatedProfit(recordsByType, month);

        // 计算所有贵金属的单月收益总和
        const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

        return {
          label: month,
          value: totalProfit
        };
      });

      // 辅助函数：按日期范围筛选贵金属数据
      const filterMetalDataByDateRange = (
        data: Array<{ label: string; value: number }>
      ) => {
        if (!data || data.length === 0) {
          return [];
        }

        if (!dateRange.startMonth && !dateRange.endMonth) {
          return data; // 无筛选，返回全部数据
        }

        return data.filter(item => {
          const month = item.label;
          const startCheck = !dateRange.startMonth || month >= dateRange.startMonth;
          const endCheck = !dateRange.endMonth || month <= dateRange.endMonth;
          return startCheck && endCheck;
        });
      };

      // 在返回前应用日期筛选
      return filterMetalDataByDateRange(allMetalData);
    }

    return [];
  }, [baseData, recordsByMetalType, filterType]);

  // 初始化选中账户
  useEffect(() => {
    if (chartData?.accountNames && chartData.accountNames.length > 0) {
      setSelectedAccounts(null);
    }
  }, [chartData?.accountNames]);

  // 根据账户选择过滤数据
  const filteredChartData = useMemo(() => {
    if (!chartData || !chartData.allData || chartData.allData.length === 0) {
      return { series: null, data: [] };
    }

    // 如果 selectedAccounts 为 null，表示"全部"模式，显示所有账户的总收益（单系列模式）
    if (selectedAccounts === null) {
      const aggregatedData = chartData.allData.map(monthData => {
        // 1. 汇总所有账户的收益（已包括该账户的定期存款）
        const totalProfit = chartData.accountNames.reduce((sum, account) => {
          return sum + (monthData[account] || 0);
        }, 0);

        // 2. 加上贵金属收益（filterType='all' 且 includeMetal=true 时）
        let metalProfit = 0;
        if (filterType === 'all' && includeMetal && metalChartData.length > 0) {
          // 从metalChartData中找到对应月份的贵金属收益
          const metalData = metalChartData.find(d => d.label === monthData.month);
          if (metalData) {
            metalProfit = metalData.value;
          }
        }

        const finalTotal = totalProfit + metalProfit;

        return {
          label: monthData.month,
          value: finalTotal
        };
      });

      return { series: null, data: aggregatedData, mode: 'all' as const };
    }

    // 有选中账户：显示分组柱状图（多系列模式）
    const filteredSeries = chartData.allSeries.filter(s =>
      selectedAccounts.has(s.name)
    );

    const filteredData = chartData.allData.map(monthData => {
      const dataPoint: { [key: string]: any } = {
        name: monthData.month
      };

      filteredSeries.forEach(series => {
        // 【修改】直接使用账户的收益（已包括该账户的定期存款）
        dataPoint[series.dataKey] = monthData[series.dataKey] || 0;
      });

      return dataPoint;
    });

    return {
      series: filteredSeries,
      data: filteredData,
      selectedCount: selectedAccounts.size,
      totalCount: chartData.accountNames.length,
      mode: 'filtered' as const
    };
  }, [chartData, selectedAccounts, metalChartData, filterType, includeMetal]);

  // ========== 渲染逻辑 ==========
  // 贵金属模式或混合模式（有贵金属数据）
  if ((filterType === 'metal' || (filterType === 'all' && metalChartData.length > 0)) &&
      (!chartData || !chartData.isInvestment)) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg">
        {metalChartData.length > 0 ? (
          <BarChart
            data={metalChartData}
            height={280}
            title={
              <>
                Monthly Returns
                <InfoTooltip content="Price change + Accumulated grams - Monthly investment" />
              </>
            }
            yLabel="Profit Amount ($)"
            xLabel="Month"
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No precious metal data, please add precious metal investment records
          </div>
        )}
      </div>
    );
  }

  // Regular investment mode
  if (!chartData || !chartData.allData || chartData.allData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="text-center py-12 text-gray-500">
          No snapshot data, please add investment records with snapshot amounts
        </div>
      </div>
    );
  }

  // Handle account selection
  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts(prev => {
      // If currently in "All" mode, switch to selecting this account
      if (prev === null) {
        return new Set([accountName]);
      }

      // Otherwise, toggle normally
      const newSet = new Set(prev);
      if (newSet.has(accountName)) {
        // If only 1 selected, switching back to "All" mode when deselected
        if (newSet.size > 1) {
          newSet.delete(accountName);
        } else {
          return null;  // Return to "All" mode
        }
      } else {
        newSet.add(accountName);
      }
      return newSet;
    });
  };

  // Click "All" button to switch to "All" mode
  const handleShowAll = () => {
    setSelectedAccounts(null);
  };

  // Render regular investment chart
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      {/* Account selector */}
      {(chartData?.accountNames && chartData.accountNames.length > 1) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Accounts:</span>
            <button
              onClick={handleShowAll}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${selectedAccounts === null
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              All
              {selectedAccounts === null && <span className="ml-1">✓</span>}
            </button>
          </div>
          {/* Account button list */}
          <div className="flex flex-wrap gap-2">
            {chartData.allSeries?.map((series) => {
              const isSelected = selectedAccounts !== null && selectedAccounts.has(series.name);
              return (
                <button
                  key={series.name}
                  onClick={() => handleAccountToggle(series.name)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? series.color : undefined,
                    opacity: isSelected ? 1 : 0.6
                  }}
                  title={series.name}
                >
                  {series.name}
                  {isSelected && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Status hint */}
          <div className="mt-2 text-xs text-gray-500">
            {selectedAccounts === null
              ? 'All accounts'
              : `${filteredChartData.selectedCount} / ${filteredChartData.totalCount}`
            }
          </div>
        </div>
      )}

      {/* Chart - Render bar chart */}
      <BarChart
        data={filteredChartData.data}
        series={filteredChartData.series || undefined}
        height={280}
        title={
          <span className="flex items-center justify-center">
            Monthly Returns
            <InfoTooltip
              content={['Current Assets - Previous Assets - Current Investment']}
            />
          </span>
        }
        yLabel="Profit Amount ($)"
        xLabel="Month"
      />
    </div>
  );
});

MonthlyProfitChart.displayName = 'MonthlyProfitChart';
export default MonthlyProfitChart;
