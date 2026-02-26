import { useMemo, useState, useEffect } from 'react';
import { LineChart, ChartSeries } from '@components/charts/LineChart';
import { useInvestmentStore } from '@store/investmentStore';
import {
  calculateMonthlyReturnByAccount,
  getAllUniqueMonthsFromReturnData,
  alignReturnDataToMonths
} from '@utils/investmentCalculations';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { getAccountColors } from '@utils/chartColors';

interface AccountMonthlyReturnChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  dateRange?: {
    startMonth: string | null;
    endMonth: string | null;
  };
}

export const AccountMonthlyReturnChart = ({ filterType = 'all', dateRange }: AccountMonthlyReturnChartProps) => {
  const { recordsByType } = useInvestmentStore();

  // 账户选择状态
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // 数据计算
  const chartData = useMemo(() => {
    // 贵金属模式下不显示
    if (filterType === 'metal') {
      return null;
    }

    // 普通投资模式：计算月度收益率
    if (filterType === 'all' || filterType === 'investment') {
      // 关键修复：收益率计算使用完整历史数据
      const returnDataByAccount = calculateMonthlyReturnByAccount(recordsByType);

      // 如果没有账户数据
      if (returnDataByAccount.length === 0) {
        return { series: [], data: [], accountNames: [], allData: null, colorMap: null };
      }

      // 获取所有唯一月份
      let allMonths = getAllUniqueMonthsFromReturnData(returnDataByAccount);

      // 应用日期范围过滤到月份
      allMonths = allMonths.filter(month => {
        if (dateRange?.startMonth && month < dateRange.startMonth) return false;
        if (dateRange?.endMonth && month > dateRange.endMonth) return false;
        return true;
      });

      // 获取账户颜色
      const accountNames = returnDataByAccount.map(d => d.account);
      const colorMap = getAccountColors(accountNames);

      // 对齐每个账户的数据到统一的月份轴
      const alignedData = returnDataByAccount.map(({ account, data }) => ({
        account,
        alignedReturn: alignReturnDataToMonths(data, allMonths)
      }));

      // 构建完整的图表数据结构（多线格式）
      const allChartDataPoints = allMonths.map((month, monthIndex) => {
        const dataPoint: { [key: string]: any } = {
          name: month,
          month
        };

        alignedData.forEach(({ account, alignedReturn }) => {
          dataPoint[account] = alignedReturn[monthIndex]?.returnRate ?? null;
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
        accountNames: alignedData.map(d => d.account),
        colorMap
      };
    }

    return { series: [], data: [], accountNames: [], allData: null, colorMap: null };
  }, [recordsByType, filterType, dateRange]);

  // 初始化选中账户（默认选中所有账户）
  useEffect(() => {
    if (chartData?.accountNames && chartData.accountNames.length > 0) {
      const defaultSelected = new Set(chartData.accountNames);
      setSelectedAccounts(defaultSelected);
    }
  }, [chartData?.accountNames]);

  // 根据选中的账户过滤数据
  const filteredChartData = useMemo(() => {
    if (!chartData || !chartData.allData || !chartData.allSeries) {
      return { series: [], data: [] };
    }

    // 如果没有选中任何账户，显示所有账户
    const accountsToShow = selectedAccounts.size > 0
      ? selectedAccounts
      : new Set(chartData.accountNames);

    // 过滤系列配置
    const filteredSeries = chartData.allSeries.filter(s =>
      accountsToShow.has(s.name)
    );

    // 过滤数据点
    const filteredData = chartData.allData.map(dataPoint => {
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
      totalCount: chartData.accountNames.length
    };
  }, [chartData, selectedAccounts]);

  // 贵金属模式下不显示组件
  if (filterType === 'metal') {
    return null;
  }

  // No data case
  if (!chartData || !chartData.allData || chartData.allData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="text-center py-12 text-gray-500">
          No snapshot data, please add investment records with snapshot amounts
        </div>
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
    if (selectedAccounts.size === chartData.accountNames.length) {
      // 如果全选了，则清空选择
      setSelectedAccounts(new Set());
    } else {
      // 否则全选
      setSelectedAccounts(new Set(chartData.accountNames));
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      {/* Account selector */}
      {chartData.accountNames.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Accounts:</span>
            <button
              onClick={handleToggleAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {selectedAccounts.size === chartData.accountNames.length ? 'None' : 'All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {chartData.allSeries?.map((series) => {
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

      {/* Chart */}
      <LineChart
        data={filteredChartData.data}
        series={filteredChartData.series}
        height={280}
        title="Account Return Rate"
        yLabel="Return Rate (%)"
        xLabel="Month"
        yAxisFormatter={(value) => `${value.toFixed(1)}%`}
        tooltipFormatter={(value, name) => [
          `Return Rate: ${value.toFixed(2)}%`,
          name || ''
        ]}
      />
    </div>
  );
};
