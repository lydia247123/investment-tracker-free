import React from 'react';
import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import { useMemo } from 'react';
import { calculateTotalAmount, calculateTotalProfit, calculateTotalGrams, calculateMonthlyAccumulatedProfit } from '@utils/metalCalculations';
import { calculateTimeDepositTotalProfit } from '@utils/timeDepositCalculations';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { calculateMonthlyProfit, calculateCurrentMonthInvestment, calculatePreviousMonthSnapshot } from '@utils/investmentCalculations';
import { InfoTooltip } from '@components/ui/InfoTooltip';
import { getCachedData } from '@utils/dashboardDataCache';
import { BaseDashboardData } from '@services/DashboardDataManager';
import { getNumberFontSizeClass } from '@utils/numberFormatting';

interface DashboardStatsProps {
  filterType?: 'all' | 'investment' | 'metal';
  recordsByType: RecordsByType;
  recordsByMetalType: RecordsByMetalType;
  baseData?: BaseDashboardData; // 可选的共享基础数据
}

const DashboardStats = React.memo(({ filterType = 'all', recordsByType, recordsByMetalType, baseData }: DashboardStatsProps) => {
  // 免费版始终显示全部数据，dateRange 始终为 null
  const dateRange = useMemo(() => ({
    startMonth: null as string | null,
    endMonth: null as string | null
  }), []);

  // Derive includeMetal from filterType: include metals in 'all' and 'metal' modes, exclude in 'investment' mode
  const includeMetal = filterType === 'all' || filterType === 'metal';

  // 辅助函数：计算前一个月份
  // 输入：'2025-01' -> 输出：'2024-12'
  // 输入：'2024-01' -> 输出：'2023-12'
  const getPreviousMonth = (monthStr: string): string | null => {
    const match = monthStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);

    if (month === 1) {
      // 1月的前一个月是去年的12月
      return `${year - 1}-12`;
    } else {
      // 其他月份，直接减1
      return `${year}-${(month - 1).toString().padStart(2, '0')}`;
    }
  };

  // 确定资产计算的基准月份：
  // 1. 如果有筛选的结束月份，使用结束月份
  // 2. 否则使用数据中最新的月份（而不是系统时间）
  // 3. 如果没有数据，回退到系统时间（保持向后兼容）
  const getLatestMonthFromData = (): string => {
    try {
      if (baseData && baseData.allMonths && Array.isArray(baseData.allMonths) && baseData.allMonths.length > 0) {
        return baseData.allMonths[baseData.allMonths.length - 1];
      }
    } catch (e) {
      console.error('Error in getLatestMonthFromData:', e);
    }
    // 回退到系统时间（如果没有数据）
    return new Date().toISOString().slice(0, 7);
  };

  const assetCalculationMonth = dateRange?.endMonth || getLatestMonthFromData();

  // ========== 第1部分：快照数据分组（独立缓存 + 跨组件缓存） ==========
  // 按账户分组和排序快照数据，只依赖 recordsByType
  const snapshotsByAccount = useMemo(() => {
    try {
      if (!recordsByType || typeof recordsByType !== 'object') return new Map();

      return getCachedData(
        'dashboard-stats-snapshots-by-account',
        recordsByType,
        () => {
          const grouped = new Map<string, Array<{ date: string; snapshot: number }>>();
          
          Object.values(recordsByType).forEach(records => {
            if (Array.isArray(records)) {
              records.forEach(record => {
                if (record && record.snapshot !== undefined && record.account && record.date) {
                  if (!grouped.has(record.account)) {
                    grouped.set(record.account, []);
                  }
                  grouped.get(record.account)!.push({
                    date: record.date,
                    snapshot: record.snapshot!
                  });
                }
              });
            }
          });

          // 对每个账户的快照按日期排序
          grouped.forEach((snapshots) => {
            if (Array.isArray(snapshots)) {
              snapshots.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            }
          });

          return grouped;
        },
        60000 // 60秒缓存
      );
    } catch (e) {
      console.error('Error in snapshotsByAccount useMemo:', e);
      return new Map();
    }
  }, [recordsByType]);

  // ========== 第2部分：普通投资总额（独立缓存 + 跨组件缓存） ==========
  // 依赖：recordsByType, filterType, dateRange
  const investmentTotal = useMemo(() => {
    try {
      return getCachedData(
        `dashboard-stats-investment-total-${filterType}`,
        { recordsByType, dateRange },
        () => {
          let total = 0;

          if (filterType === 'all' || filterType === 'investment') {
            if (recordsByType && typeof recordsByType === 'object') {
              Object.entries(recordsByType).forEach(([type, records]) => {
                if (Array.isArray(records)) {
                  const filteredRecords = filterRecordsByDateRange(
                    records,
                    dateRange || { startMonth: null, endMonth: null }
                  );
                  total += (filteredRecords || []).reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
                }
              });
            }
          }

          return total;
        },
        60000 // 60秒缓存
      );
    } catch (e) {
      console.error('Error in investmentTotal useMemo:', e);
      return 0;
    }
  }, [recordsByType, filterType, dateRange]);

  // ========== 第3部分：快照资产（独立缓存） ==========
  // 使用 snapshotsByAccount 计算当前资产
  // 依赖：snapshotsByAccount, assetCalculationMonth
  const snapshotAssets = useMemo(() => {
    try {
      let assets = 0;

      if (filterType === 'all' || filterType === 'investment') {
        if (snapshotsByAccount && snapshotsByAccount.size > 0) {
          // 计算当前资产（所有账户在基准月份或之前的最新快照之和）
          snapshotsByAccount.forEach((snapshots, account) => {
            if (Array.isArray(snapshots) && snapshots.length > 0) {
              const validSnapshots = snapshots.filter(s => s && s.date <= assetCalculationMonth);
              if (validSnapshots.length > 0) {
                const latestSnapshot = validSnapshots[validSnapshots.length - 1];

                // 🔧 修复：检查该快照对应的记录是否是定期存款
                // 如果是定期存款的快照，不在这里计入，因为会在 timeDepositAssets 中正确计算
                const allRecords = Object.values(recordsByType).flat();
                const correspondingRecord = allRecords.find(r =>
                  r.account === account &&
                  r.date === latestSnapshot.date &&
                  Math.abs((r.snapshot || 0) - (latestSnapshot.snapshot || 0)) < 0.01
                );

                // 只有非定期存款的快照才计入 snapshotAssets
                if (correspondingRecord && !correspondingRecord.isTimeDeposit) {
                  assets += (Number(latestSnapshot?.snapshot) || 0);
                } else if (!correspondingRecord) {
                  // 如果找不到对应记录，保守起见也计入（向后兼容）
                  assets += (Number(latestSnapshot?.snapshot) || 0);
                }
                // 如果是定期存款的快照，不在这里计入，而是在 timeDepositAssets 中计入
              }
            }
          });
        } else {
          // 没有快照数据，回退到总投资（排除定期存款，避免与timeDepositAssets重复计算）
          const allRecords = Object.values(recordsByType).flat();
          const nonTimeDepositRecords = allRecords.filter(r => !r.isTimeDeposit);
          assets = nonTimeDepositRecords.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
        }
      }

      return assets;
    } catch (e) {
      console.error('Error in snapshotAssets useMemo:', e);
      return 0;
    }
  }, [snapshotsByAccount, assetCalculationMonth, filterType, investmentTotal]);

  // ========== 第4部分：定期存款资产（独立缓存 + 跨组件缓存） ==========
  // 计算定期存款的资产（本金 + 累计利息）
  // 依赖：recordsByType, assetCalculationMonth
  const timeDepositAssets = useMemo(() => {
    try {
      return getCachedData(
        `dashboard-stats-time-deposit-assets-${assetCalculationMonth}`,
        { recordsByType, filterType },
        () => {
          let assets = 0;

          if (filterType === 'all' || filterType === 'investment') {
            if (recordsByType && typeof recordsByType === 'object') {
              // 🔍 详细调试：检查所有记录的 isTimeDeposit 标记
              const allRecords: any[] = [];
              Object.values(recordsByType).forEach(records => {
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    if (r) allRecords.push(r);
                  });
                }
              });

              console.log('🔍 [Data Structure Debug] All investment records:', {
                totalRecords: allRecords.length,
                recordsWithIsTimeDeposit: allRecords.filter(r => r.isTimeDeposit === true).length,
                recordsWithIsTimeDepositFalse: allRecords.filter(r => r.isTimeDeposit === false).length,
                recordsWithIsTimeDepositUndefined: allRecords.filter(r => r.isTimeDeposit === undefined).length,
                sampleRecords: allRecords.slice(0, 5).map(r => ({
                  date: r.date,
                  amount: r.amount,
                  account: r.account,
                  isTimeDeposit: r.isTimeDeposit,
                  isTimeDepositType: typeof r.isTimeDeposit,
                  depositTermMonths: r.depositTermMonths,
                  annualInterestRate: r.annualInterestRate
                }))
              });

              const allTimeDepositRecords: any[] = [];
              Object.values(recordsByType).forEach(records => {
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    if (r && r.isTimeDeposit) allTimeDepositRecords.push(r);
                  });
                }
              });

              console.log('🔍 [Time Deposit Debug] Filter results:', {
                assetCalculationMonth,
                totalRecordsFound: allTimeDepositRecords.length,
                records: allTimeDepositRecords.map(r => ({
                  date: r.date,
                  amount: r.amount,
                  isTimeDeposit: r.isTimeDeposit,
                  depositTermMonths: r.depositTermMonths,
                  annualInterestRate: r.annualInterestRate
                }))
              });

              const filteredTimeDeposits = assetCalculationMonth
                ? allTimeDepositRecords.filter(r => r && r.date <= assetCalculationMonth)
                : allTimeDepositRecords;

              console.log('🔍 [Time Deposit Debug] After filtering:', {
                filteredCount: filteredTimeDeposits.length,
                filteredRecords: filteredTimeDeposits.map(r => ({
                  date: r.date,
                  amount: r.amount
                }))
              });

              if (Array.isArray(filteredTimeDeposits) && filteredTimeDeposits.length > 0) {
                filteredTimeDeposits.forEach(record => {
                  if (record) {
                    const totalProfit = calculateTimeDepositTotalProfit(record, assetCalculationMonth);
                    const currentValue = (Number(record.amount) || 0) + (Number(totalProfit) || 0);
                    console.log('💰 [Time Deposit Debug] Single record calculation:', {
                      date: record.date,
                      amount: record.amount,
                      profit: totalProfit,
                      currentValue,
                      annualInterestRate: record.annualInterestRate,
                      depositTermMonths: record.depositTermMonths
                    });
                    assets += currentValue;
                  }
                });
                console.log('✅ [Time Deposit Debug] Total time deposit assets:', assets);
              } else {
                console.log('⚠️ [Time Deposit Debug] No qualifying time deposit records');
              }
            }
          }

          return assets;
        },
        60000 // 60秒缓存
      );
    } catch (e) {
      console.error('Error in timeDepositAssets useMemo:', e);
      return 0;
    }
  }, [recordsByType, assetCalculationMonth, filterType]);

  // ========== 第5部分：贵金属数据（独立缓存 + 跨组件缓存） ==========
  // 计算贵金属投资和资产
  // 依赖：recordsByMetalType, filterType, dateRange
  const metalData = useMemo(() => {
    try {
      if (!includeMetal) {
        return { investment: 0, assets: 0, profit: 0 };
      }

      return getCachedData(
        `dashboard-stats-metal-data-${filterType}`,
        { recordsByMetalType, dateRange, assetCalculationMonth, filterType },
        () => {
          if (!recordsByMetalType || typeof recordsByMetalType !== 'object') {
            return { investment: 0, assets: 0, profit: 0 };
          }

          const allMetalRecords: any[] = [];
          Object.values(recordsByMetalType).forEach(records => {
            if (Array.isArray(records)) {
              records.forEach(r => {
                if (r) allMetalRecords.push(r);
              });
            }
          });

          if (allMetalRecords.length === 0) {
            return { investment: 0, assets: 0, profit: 0 };
          }

          // 计算贵金属的总投资（应用日期过滤）
          const filteredMetalRecords = dateRange
            ? filterRecordsByDateRange(allMetalRecords, dateRange)
            : allMetalRecords;
          const metalInvestment = calculateTotalAmount(filteredMetalRecords || []);

          // 计算贵金属的当前资产
          const metalRecordsForGrams = dateRange?.startMonth
            ? allMetalRecords.filter(r => {
                if (!r) return false;
                const startMonth = dateRange.startMonth;
                return r.date >= startMonth && r.date <= assetCalculationMonth;
              })
            : allMetalRecords;

          const metalGrams = calculateTotalGrams(metalRecordsForGrams || []);

          // 找到基准月份或之前的最新记录
          const validMetalRecords = assetCalculationMonth
            ? allMetalRecords.filter(r => r && r.date <= assetCalculationMonth)
            : allMetalRecords;

          let metalAssets = 0;
          if (Array.isArray(validMetalRecords) && validMetalRecords.length > 0 && metalGrams > 0) {
            const latestRecord = validMetalRecords.reduce((latest, record) =>
              (record?.date || '') > (latest?.date || '') ? record : latest
            );
            if (latestRecord) {
              metalAssets = (Number(latestRecord.averagePrice) || 0) * metalGrams;
            }
          }

          // 计算贵金属的总收益
          const metalProfit = calculateTotalProfit(allMetalRecords || []);

          return { investment: metalInvestment, assets: metalAssets, profit: metalProfit };
        },
        60000 // 60秒缓存
      );
    } catch (e) {
      console.error('Error in metalData useMemo:', e);
      return { investment: 0, assets: 0, profit: 0 };
    }
  }, [recordsByMetalType, filterType, dateRange, includeMetal, assetCalculationMonth]);

  // ========== 第6部分：起始资产（独立缓存） ==========
  // 计算筛选月份的起始资产
  // 依赖：snapshotsByAccount, recordsByType, recordsByMetalType, dateRange
  const startMonthAssets = useMemo(() => {
    try {
      if (!dateRange?.startMonth) {
        return 0;
      }

      const startMonth = dateRange.startMonth;
      const previousMonth = getPreviousMonth(startMonth);
      let assets = 0;

      if (!previousMonth) return 0;

      // 计算普通投资的起始资产（快照）
      if ((filterType === 'all' || filterType === 'investment')) {
        // 取前一个月份的快照
        if (snapshotsByAccount) {
          snapshotsByAccount.forEach((snapshots) => {
            if (Array.isArray(snapshots) && snapshots.length > 0) {
              const validSnapshots = snapshots.filter(s => s && s.date <= previousMonth);
              if (validSnapshots.length > 0) {
                const latestSnapshot = validSnapshots[validSnapshots.length - 1];
                assets += (Number(latestSnapshot?.snapshot) || 0);
              }
            }
          });
        }
      }

      // 计算定期存款的起始资产（本金 + 累计利息到前一个月份）
      if ((filterType === 'all' || filterType === 'investment')) {
        if (recordsByType && typeof recordsByType === 'object') {
          const allTimeDepositRecords: any[] = [];
          Object.values(recordsByType).forEach(records => {
            if (Array.isArray(records)) {
              records.forEach(r => {
                if (r && r.isTimeDeposit) allTimeDepositRecords.push(r);
              });
            }
          });
          const filteredTimeDeposits = allTimeDepositRecords.filter(r => r && r.date <= previousMonth);

          filteredTimeDeposits.forEach(record => {
            if (record) {
              const totalProfit = calculateTimeDepositTotalProfit(record, previousMonth);
              const currentValue = (Number(record.amount) || 0) + (Number(totalProfit) || 0);
              assets += currentValue;
            }
          });
        }
      }

      // 计算贵金属的起始资产（只在纯贵金属模式下）
      if (includeMetal && filterType === 'metal') {
        if (recordsByMetalType && typeof recordsByMetalType === 'object') {
          const allMetalRecords: any[] = [];
          Object.values(recordsByMetalType).forEach(records => {
            if (Array.isArray(records)) {
              records.forEach(r => {
                if (r) allMetalRecords.push(r);
              });
            }
          });
          const startMonthRecords = allMetalRecords.filter(r => r && r.date === startMonth);

          if (Array.isArray(startMonthRecords) && startMonthRecords.length > 0) {
            const metalInvestment = calculateTotalAmount(startMonthRecords);
            assets += metalInvestment;
          }
        }
      }

      return assets;
    } catch (e) {
      console.error('Error in startMonthAssets useMemo:', e);
      return 0;
    }
  }, [snapshotsByAccount, recordsByType, recordsByMetalType, dateRange, filterType, includeMetal]);

  // ========== 第7部分：最终汇总 ==========
  // 组合以上所有计算结果
  const stats = useMemo(() => {
    // 计算总投资
    let totalInvestment = investmentTotal;
    let currentAssets = 0;
    let totalProfit = 0;

    // 合并普通投资和定期存款资产
    if (filterType === 'all' || filterType === 'investment') {
      currentAssets = snapshotAssets + timeDepositAssets;
      console.log('📊 [Asset Summary Debug]', {
        filterType,
        snapshotAssets,
        timeDepositAssets,
        currentAssets,
        assetCalculationMonth
      });
    }

    // 合并贵金属数据
    if (includeMetal) {
      if (filterType === 'all') {
        // 合并模式：累加所有数据
        totalInvestment += metalData.investment;
        currentAssets += metalData.assets;
      } else if (filterType === 'metal') {
        // 纯贵金属模式：只使用贵金属数据
        totalInvestment = metalData.investment;
        currentAssets = metalData.assets;
      }
    }

    // 计算总收益
    if (dateRange?.startMonth) {
      // 有起始资产：总收益 = 当前资产 - 起始资产 - 总投资
      if (filterType === 'metal') {
        totalProfit = currentAssets - totalInvestment;
      } else {
        totalProfit = currentAssets - startMonthAssets - totalInvestment;
      }
    } else {
      // 无起始资产：总收益 = 当前资产 - 总投资
      totalProfit = currentAssets - totalInvestment;
    }

    // 计算收益率
    let returnRate = 0;
    if (totalInvestment > 0) {
      returnRate = (totalProfit / totalInvestment) * 100;
    }

    return {
      totalInvestment,
      currentAssets,
      totalProfit,
      returnRate,
      startMonthAssets
    };
  }, [investmentTotal, snapshotAssets, timeDepositAssets, metalData, startMonthAssets, filterType, includeMetal, dateRange]);

  const statCards = [
    {
      label: 'Total Investment',
      value: `$${stats.totalInvestment.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Current Assets',
      value: `$${stats.currentAssets.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      tooltip: true,
      tooltipContent: filterType === 'metal'
        ? ['Total grams × Average price']
        : filterType === 'all'
        ? ['Investments + Metals combined']
        : ['Sum of all account snapshots']
    },
    {
      label: 'Total Profit',
      value: `$${stats.totalProfit.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      tooltip: true,
      tooltipContent: ['Current Assets - Total Investment']
    },
    {
      label: 'Return Rate',
      value: `${stats.returnRate.toFixed(2)}%`,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      tooltip: true,
      tooltipContent: ['(Total Profit / Total Investment) × 100%']
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            {(stat as any).tooltip && (
              <InfoTooltip content={(stat as any).tooltipContent} />
            )}
          </div>
          <div className={`${getNumberFontSizeClass(stat.value)} font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
