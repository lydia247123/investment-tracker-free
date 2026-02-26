import { useMemo, useState, useEffect } from 'react';
import { LineChart, ChartSeries } from '@components/charts/LineChart';
import { InfoTooltip } from '@components/ui/InfoTooltip';
import { useInvestmentStore } from '@store/investmentStore';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import {
  calculateMonthlyInvestmentDataByAccount,
  getAllUniqueMonths,
  alignAccountDataToMonths,
  calculateOverallMonthlyROI,
  calculateOverallMonthlyReturn
} from '@utils/investmentCalculations';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { getAccountColors } from '@utils/chartColors';
import { getPreviousMonthMetalValue } from '@utils/metalCalculations';

interface ROITrendChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  dateRange?: {
    startMonth: string | null;
    endMonth: string | null;
  };
}

type ViewType = 'roi' | 'overallROI' | 'overallReturnRate';

export const ROITrendChart = ({ filterType = 'all', dateRange }: ROITrendChartProps) => {
  // Derive includeMetal from filterType: include metals in 'all' and 'metal' modes, exclude in 'investment' mode
  const includeMetal = filterType === 'all' || filterType === 'metal';

  const { recordsByType } = useInvestmentStore();
  const { recordsByMetalType } = usePreciousMetalStore();

  // 视图类型状态（默认显示按账户ROI）
  const [viewType, setViewType] = useState<ViewType>('roi');

  // 账户选择状态
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // 按账户ROI数据计算
  const roiByAccountData = useMemo(() => {
    // 贵金属模式下不显示
    if (filterType === 'metal') {
      return null;
    }

    // 普通投资模式：计算投入产出比
    if (filterType === 'all' || filterType === 'investment') {
      // 关键修复：ROI计算使用完整历史数据
      const roiDataByAccount = calculateMonthlyInvestmentDataByAccount(recordsByType);

      // 如果没有账户数据
      if (roiDataByAccount.length === 0) {
        return { series: [], data: [], isMultiAccount: false, accountNames: [], allData: null };
      }

      // 获取所有唯一月份
      let allMonths = getAllUniqueMonths(roiDataByAccount);

      // 应用日期范围过滤到月份
      allMonths = allMonths.filter(month => {
        if (dateRange?.startMonth && month < dateRange.startMonth) return false;
        if (dateRange?.endMonth && month > dateRange.endMonth) return false;
        return true;
      });

      // 获取账户颜色
      const accountNames = roiDataByAccount.map(d => d.account);
      const colorMap = getAccountColors(accountNames);

      // 对齐每个账户的数据到统一的月份轴
      const alignedData = roiDataByAccount.map(({ account, data }) => ({
        account,
        alignedRoi: alignAccountDataToMonths(data, allMonths)
      }));

      // 构建完整的图表数据结构（多线格式）
      const allChartDataPoints = allMonths.map((month, monthIndex) => {
        const dataPoint: { [key: string]: any } = {
          name: month,
          month
        };

        alignedData.forEach(({ account, alignedRoi }) => {
          dataPoint[account] = alignedRoi[monthIndex]?.roi ?? null;
        });

        return dataPoint;
      });

      // 构建系列配置
      const allSeries: ChartSeries[] = alignedData.map(({ account }) => ({
        dataKey: account,
        name: account,
        color: colorMap.get(account) || '#8b5cf6'
      }));

      return {
        allSeries,
        allData: allChartDataPoints,
        isMultiAccount: alignedData.length > 1,
        accountNames: alignedData.map(d => d.account),
        alignedData,
        colorMap
      };
    }

    return { series: [], data: [], isMultiAccount: false, accountNames: [], allData: null };
  }, [recordsByType, filterType, dateRange]);

  // 整体ROI数据计算
  const overallROIData = useMemo(() => {
    // @ts-ignore - filterType check is logically correct even if TypeScript thinks it's redundant
    if (filterType === 'metal') {
      return null;
    }

    // 关键修复：整体ROI计算使用完整历史数据
    const overallROI = calculateOverallMonthlyROI(
      recordsByType,
      filterType === 'all' ? recordsByMetalType : undefined,
      filterType === 'all' ? includeMetal : false
    );

    if (overallROI.length === 0) {
      return { data: [], color: '#8b5cf6' };
    }

    const filteredData = overallROI.filter(d => {
      if (dateRange?.startMonth && d.month < dateRange.startMonth) return false;
      if (dateRange?.endMonth && d.month > dateRange.endMonth) return false;
      return true;
    });

    const chartData = filteredData.map(d => ({
      name: d.month,
      month: d.month,
      value: d.roi
    }));

    return {
      data: chartData,
      color: '#8b5cf6'
    };
  }, [recordsByType, recordsByMetalType, filterType, dateRange, includeMetal]);

  // 整体收益率数据计算
  const overallReturnRateData = useMemo(() => {
    // @ts-ignore - filterType check is logically correct even if TypeScript thinks it's redundant
    if (filterType === 'metal') {
      return null;
    }

    // 关键修复：收益率计算必须使用完整历史数据，不受日期筛选影响
    // 整体收益率 = 基于完整历史数据计算
    const overallReturnData = calculateOverallMonthlyReturn(recordsByType);

    if (overallReturnData.length === 0) {
      return { data: [], color: '#10b981' };
    }

    // 计算贵金属月度收益（只在 filterType='all' 且 includeMetal=true 时）
    let metalMonthlyProfits = new Map<string, number>(); // key: month, value: profit
    if (filterType === 'all' && includeMetal) {
      const allMetalRecords = filterRecordsByDateRange(
        Object.values(recordsByMetalType).flat(),
        dateRange || { startMonth: null, endMonth: null }
      );

      if (allMetalRecords.length > 0) {
        // 计算每个月的贵金属收益（与 MonthlyProfitChart 逻辑一致）
        const uniqueMonths = new Set(allMetalRecords.map(r => r.date));
        const sortedMonths = Array.from(uniqueMonths).sort();

        sortedMonths.forEach((month) => {
          const recordsUpToMonth = allMetalRecords.filter(r => r.date <= month);
          const totalAmount = recordsUpToMonth.reduce(
            (sum, r) => sum + (r.grams * r.pricePerGram),
            0
          );
          const monthRecords = allMetalRecords.filter(r => r.date === month);
          const monthAveragePrice = monthRecords.length > 0 ? monthRecords[0].averagePrice : 0;
          const currentValue = monthAveragePrice * recordsUpToMonth.reduce((sum, r) => sum + r.grams, 0);
          const cumulativeProfit = currentValue - totalAmount;
          const uniqueMonthCount = new Set(recordsUpToMonth.map(r => r.date)).size;
          const profit = uniqueMonthCount > 0 ? cumulativeProfit / uniqueMonthCount : 0;

          metalMonthlyProfits.set(month, profit);
        });
      }
    }

    // 合并贵金属收益到整体收益中
    const chartData = overallReturnData.map(d => {
      let totalProfit = d.profit;
      let totalSnapshot = d.previousSnapshot;

      // 只在 'all' 模式且 includeMetal=true 时，加上贵金属收益和上月市值
      if (filterType === 'all' && includeMetal) {
        const metalProfit = metalMonthlyProfits.get(d.month) || 0;
        totalProfit += metalProfit;

        // 获取贵金属上月市值（如果上月为空则往前查找）
        const previousMonthMetalValue = getPreviousMonthMetalValue(recordsByMetalType, d.month);
        totalSnapshot += previousMonthMetalValue;
      }

      // 重新计算收益率
      const returnRate = totalSnapshot > 0 ? (totalProfit / totalSnapshot) * 100 : 0;

      return {
        name: d.month,
        month: d.month,
        value: returnRate
      };
    });

    const filteredData = chartData.filter(d => {
      if (dateRange?.startMonth && d.month < dateRange.startMonth) return false;
      if (dateRange?.endMonth && d.month > dateRange.endMonth) return false;
      return true;
    });

    return {
      data: filteredData,
      color: '#10b981'
    };
  }, [recordsByType, recordsByMetalType, filterType, dateRange, includeMetal]);

  // 初始化选中账户（默认选中前3个，如果不足3个则全选）
  useEffect(() => {
    if (roiByAccountData?.accountNames && roiByAccountData.accountNames.length > 0) {
      const defaultSelected = new Set(
        roiByAccountData.accountNames.slice(0, Math.min(3, roiByAccountData.accountNames.length))
      );
      setSelectedAccounts(defaultSelected);
    }
  }, [roiByAccountData?.accountNames]);

  // 根据选中的账户过滤数据
  const filteredChartData = useMemo(() => {
    if (!roiByAccountData || !roiByAccountData.allData || !roiByAccountData.allSeries) {
      return { series: [], data: [] };
    }

    // 如果没有选中任何账户，显示所有账户
    const accountsToShow = selectedAccounts.size > 0
      ? selectedAccounts
      : new Set(roiByAccountData.accountNames);

    // 过滤系列配置
    const filteredSeries = roiByAccountData.allSeries.filter(s =>
      accountsToShow.has(s.name)
    );

    // 过滤数据点
    const filteredData = roiByAccountData.allData.map(dataPoint => {
      const filteredPoint: { [key: string]: any } = {
        name: dataPoint.name,
        month: dataPoint.month
      };

      filteredSeries.forEach(series => {
        filteredPoint[series.dataKey] = dataPoint[series.dataKey];
      });

      return filteredPoint;
    });

    return {
      series: filteredSeries,
      data: filteredData,
      selectedCount: accountsToShow.size,
      totalCount: roiByAccountData.accountNames.length
    };
  }, [roiByAccountData, selectedAccounts]);

  // 贵金属模式下不显示组件
  if (filterType === 'metal') {
    return null;
  }

  // 无数据情况（根据视图类型判断）
  const hasNoData =
    (viewType === 'roi' && (!roiByAccountData || !roiByAccountData.allData || roiByAccountData.allData.length === 0)) ||
    (viewType === 'overallROI' && (!overallROIData || overallROIData.data.length === 0)) ||
    (viewType === 'overallReturnRate' && (!overallReturnRateData || overallReturnRateData.data.length === 0));

  if (hasNoData) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="text-center py-12 text-gray-500">
          No snapshot data, please add investment records with snapshot amounts
        </div>
      </div>
    );
  }

  // 单账户：使用原有格式（向后兼容）
  if (viewType === 'roi' && roiByAccountData && !roiByAccountData.isMultiAccount && roiByAccountData.accountNames && roiByAccountData.accountNames.length > 0) {
    const singleAccountData = roiByAccountData.allData?.map(d => ({
      label: d.name,
      value: d[roiByAccountData.accountNames[0]]
    })) || [];

    return (
      <div className="bg-white rounded-xl p-4 shadow-lg">
        {/* View type selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View:
          </label>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="roi">Account ROI</option>
            <option value="overallROI">Total ROI</option>
            <option value="overallReturnRate">Total Return Rate</option>
          </select>
        </div>

        <LineChart
          data={singleAccountData}
          height={280}
          title={
            <span className="flex items-center justify-center">
              ROI
              <InfoTooltip content={['Monthly profit ÷ Current investment']} />
            </span>
          }
          yLabel="ROI"
          xLabel="Month"
          color="#8b5cf6"
          yAxisFormatter={(value) => value.toFixed(2)}
          tooltipFormatter={(value) => [
            `ROI: ${(value ?? 0).toFixed(2)}`,
            'Ratio'
          ]}
        />
      </div>
    );
  }

  // 处理账户选择
  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountName)) {
        // 如果选中账户超过1个，允许取消选中；否则保持至少1个选中
        if (newSet.size > 1) {
          newSet.delete(accountName);
        }
      } else {
        newSet.add(accountName);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const handleToggleAll = () => {
    if (!roiByAccountData || !roiByAccountData.accountNames) return;

    if (selectedAccounts.size === roiByAccountData.accountNames.length) {
      // 如果全选了，则只保留前3个
      setSelectedAccounts(new Set(roiByAccountData.accountNames.slice(0, 3)));
    } else {
      // 否则全选
      setSelectedAccounts(new Set(roiByAccountData.accountNames));
    }
  };

  // 多账户：使用新的系列格式 + 账户选择器 + 视图选择器
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      {/* View type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display:
        </label>
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value as ViewType)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="roi">Account ROI</option>
          <option value="overallROI">Total ROI</option>
          <option value="overallReturnRate">Total Return Rate</option>
        </select>
      </div>

      {/* Account selector - only shown in ROI view */}
      {viewType === 'roi' && roiByAccountData && roiByAccountData.accountNames && roiByAccountData.accountNames.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Accounts:</span>
            <button
              onClick={handleToggleAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {selectedAccounts.size === roiByAccountData.accountNames.length ? 'None' : 'All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {roiByAccountData.allSeries?.map((series) => {
              const isSelected = selectedAccounts.has(series.name);
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
          <div className="mt-2 text-xs text-gray-500">
            {filteredChartData.selectedCount} / {filteredChartData.totalCount}
          </div>
        </div>
      )}

      {/* Charts - render based on view type */}
      {viewType === 'roi' ? (
        // By Account ROI view
        !roiByAccountData?.isMultiAccount ? (
          <LineChart
            data={roiByAccountData?.allData?.map(d => ({
              label: d.name,
              value: d[roiByAccountData?.accountNames?.[0] || '']
            })) || []}
            height={280}
            title="ROI"
            yLabel="ROI"
            xLabel="Month"
            color="#8b5cf6"
            yAxisFormatter={(value) => value.toFixed(2)}
            tooltipFormatter={(value) => [
              `ROI: ${(value ?? 0).toFixed(2)}`,
              'Ratio'
            ]}
          />
        ) : (
          <LineChart
            data={filteredChartData.data}
            series={filteredChartData.series}
            height={280}
            title={
              <span className="flex items-center justify-center">
                ROI
                <InfoTooltip content={['Monthly profit ÷ Current investment']} />
              </span>
            }
            yLabel="ROI"
            xLabel="Month"
            yAxisFormatter={(value) => value.toFixed(2)}
            tooltipFormatter={(value, name) => [
              `ROI: ${(value ?? 0).toFixed(2)}`,
              name || ''
            ]}
          />
        )
      ) : viewType === 'overallROI' ? (
        // Overall ROI view
        <LineChart
          data={overallROIData?.data || []}
          height={280}
          title={
            <span className="flex items-center justify-center">
              Total ROI
              <InfoTooltip content={['Total profit ÷ Total investment']} />
            </span>
          }
          yLabel="ROI"
          xLabel="Month"
          color={overallROIData?.color || '#8b5cf6'}
          yAxisFormatter={(value) => value.toFixed(2)}
          tooltipFormatter={(value) => [
            `ROI: ${(value ?? 0).toFixed(2)}`,
            'Overall'
          ]}
        />
      ) : (
        // Overall Return Rate view
        <LineChart
          data={overallReturnRateData?.data || []}
          height={280}
          title={
            <span className="flex items-center justify-center">
              Total Return Rate
              <InfoTooltip content={['Total profit ÷ Previous assets × 100%']} />
            </span>
          }
          yLabel="Return Rate (%)"
          xLabel="Month"
          color={overallReturnRateData?.color || '#10b981'}
          yAxisFormatter={(value) => `${value.toFixed(1)}%`}
          tooltipFormatter={(value) => [
            `Return Rate: ${(value ?? 0).toFixed(2)}%`,
            'Overall'
          ]}
        />
      )}
    </div>
  );
};
