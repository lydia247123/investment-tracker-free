import { useState } from 'react';
import { useInvestmentStore } from '@store/investmentStore';
import { useAccountStore } from '@store/accountStore';
import { InvestmentRecord } from '@types/investment';
import { calculateTimeDepositProfitForMonth, calculateTimeDepositTotalProfit, calculateTimeDepositMonthlyProfit } from '@utils/timeDepositCalculations';
import { exportInvestmentDataToCSV } from '@utils/investmentDataExport';
import { InvestmentImportDialog } from './InvestmentImportDialog';
import { InfoTooltip } from '@components/ui/InfoTooltip';

interface StatsCardsProps {
  selectedTypes: string[];
  selectedAccounts: string[];
  filterMonth?: string | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ selectedTypes, selectedAccounts, filterMonth }) => {
  const { recordsByType } = useInvestmentStore();
  const { accounts } = useAccountStore();
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 获取所有相关类型的记录（未按账户筛选）
  const allRecordsUnfiltered = selectedTypes.length === 0
    ? Object.values(recordsByType).flat() // 未选中任何类型，获取全部
    : selectedTypes.flatMap(type => recordsByType[type] || []); // 获取选中类型的记录

  // 按账户筛选记录
  const allRecords = selectedAccounts.length === 0
    ? allRecordsUnfiltered // 空数组 = 全部账户
    : allRecordsUnfiltered.filter(r => selectedAccounts.includes(r.account));

  // 根据筛选月份过滤记录
  const records = filterMonth
    ? allRecords.filter(r => r.date <= filterMonth) // 只显示筛选月份及之前的记录
    : allRecords; // 显示所有记录

  // 计算投资金额
  // 有月份筛选时：只计算该月的投资（当月投资）
  // 无月份筛选时：计算全部累计投资（总投资额）
  const totalInvestment = filterMonth
    ? records.filter(r => r.date === filterMonth).reduce((sum, r) => sum + r.amount, 0)
    : records.reduce((sum, r) => sum + r.amount, 0);

  // 计算当月投资金额（用于投入产出比计算）
  let currentMonthInvestmentAmount = 0;
  if (filterMonth) {
    // 有筛选月份：计算该月份的投资金额
    currentMonthInvestmentAmount = allRecords
      .filter(r => r.date === filterMonth)
      .reduce((sum, r) => sum + r.amount, 0);
  } else {
    // 无筛选月份：使用累计投资
    currentMonthInvestmentAmount = totalInvestment;
  }

  const recordCount = records.length;

  // 获取当前月份（用于定期存款利息计算）
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 确定定期存款计算的目标月份
  // 如果有筛选月份，使用筛选月份；否则使用当前实际月份
  const timeDepositTargetMonth = filterMonth || currentMonth;

  // 获取所有记录中的最新月份（用于其他计算）
  const allRecordsSorted = [...allRecords].sort((a, b) => a.date.localeCompare(b.date));
  const absoluteLatestMonth = allRecordsSorted[allRecordsSorted.length - 1]?.date || currentMonth;

  // 分离定期存款记录（需要在计算当前资产之前）
  const timeDepositRecords = records.filter(r => r.isTimeDeposit);

  // 计算当前资产（各个账户下的当月快照金额之和）
  const latestSnapshotByAccount = new Map<string, number>(); // 账户 -> 最新快照金额
  const recordsByAccountAndDate = new Map<string, InvestmentRecord[]>();

  // 按账户和日期组织数据
  records.forEach(record => {
    const key = record.account;
    if (!recordsByAccountAndDate.has(key)) {
      recordsByAccountAndDate.set(key, []);
    }
    recordsByAccountAndDate.get(key)!.push(record);
  });

  // 找到每个账户的最新快照金额
  recordsByAccountAndDate.forEach((accountRecords, account) => {
    // 按日期排序，找到最新的一条记录
    const sortedRecords = accountRecords.sort((a, b) => a.date.localeCompare(b.date));
    const latestRecord = sortedRecords[sortedRecords.length - 1];

    // 如果有快照金额，则记录
    if (latestRecord && latestRecord.snapshot !== undefined) {
      latestSnapshotByAccount.set(account, latestRecord.snapshot);
    }
  });

  /**
   * 计算指定月份的总资产
   * @param targetMonth - 要计算的目标月份（YYYY-MM格式）
   * @param recordsForCalc - 所有投资记录（未筛选）
   * @returns 包含普通投资、定期存款和总资产的对象
   */
  const calculateAssetsForMonth = (
    targetMonth: string,
    recordsForCalc: InvestmentRecord[]
  ): {
    normalInvestmentAssets: number;
    timeDepositAssets: number;
    totalAssets: number;
    details: {
      timeDeposits: Array<{
        account: string;
        date: string;
        amount: number;
        profit: number;
        total: number;
      }>;
    };
  } => {
    // 1. 基于目标月份过滤记录
    const monthRecords = recordsForCalc.filter(r => r.date <= targetMonth);

    // 2. 分离定期存款和普通投资
    const timeDepositRecords = monthRecords.filter(r => r.isTimeDeposit);
    const normalRecords = monthRecords.filter(r => !r.isTimeDeposit);

    // 3. 计算普通投资资产（快照或累计投资）
    const recordsByAccount = new Map<string, InvestmentRecord[]>();
    normalRecords.forEach(record => {
      const key = record.account;
      if (!recordsByAccount.has(key)) {
        recordsByAccount.set(key, []);
      }
      recordsByAccount.get(key)!.push(record);
    });

    let normalInvestmentAssets = 0;
    recordsByAccount.forEach((accountRecords) => {
      const sortedRecords = accountRecords.sort((a, b) => a.date.localeCompare(b.date));
      const latestRecord = sortedRecords[sortedRecords.length - 1];

      if (latestRecord && latestRecord.snapshot !== undefined) {
        normalInvestmentAssets += latestRecord.snapshot;
      } else {
        normalInvestmentAssets += accountRecords.reduce((sum, r) => sum + r.amount, 0);
      }
    });

    // 4. 计算定期存款资产（本金 + 累计利息）
    let timeDepositAssets = 0;
    const timeDepositDetails: Array<{
      account: string;
      date: string;
      amount: number;
      profit: number;
      total: number;
    }> = [];

    timeDepositRecords.forEach(record => {
      const profit = calculateTimeDepositTotalProfit(record, targetMonth);
      const total = record.amount + profit;
      timeDepositAssets += total;

      timeDepositDetails.push({
        account: record.account,
        date: record.date,
        amount: record.amount,
        profit,
        total
      });
    });

    return {
      normalInvestmentAssets,
      timeDepositAssets,
      totalAssets: normalInvestmentAssets + timeDepositAssets,
      details: {
        timeDeposits: timeDepositDetails
      }
    };
  };

  // 计算当前资产（使用统一的辅助函数）
  const currentMonthForCalc = filterMonth || currentMonth;
  const currentAssetsCalculation = calculateAssetsForMonth(currentMonthForCalc, allRecords);
  const currentAssets = currentAssetsCalculation.totalAssets;

  // Debug log
  console.log('🔍[Current Assets Calculation] Month:', currentMonthForCalc, {
    normalInvestment: currentAssetsCalculation.normalInvestmentAssets.toFixed(2),
    timeDeposits: currentAssetsCalculation.timeDepositAssets.toFixed(2),
    totalAssets: currentAssets.toFixed(2),
    timeDepositDetails: currentAssetsCalculation.details.timeDeposits.map(td => ({
      account: td.account,
      startDate: td.date,
      principal: td.amount,
      interest: td.profit.toFixed(2),
      totalValue: td.total.toFixed(2)
    }))
  });

  // 计算上月资产（使用统一的辅助函数）
  let previousMonthAssets = 0;

  // 确定要计算上月的基准月份
  const baseMonth = filterMonth || absoluteLatestMonth;

  // 计算基准月份的上个月
  const targetDate = new Date(baseMonth + '-01');
  targetDate.setMonth(targetDate.getMonth() - 1);
  const previousMonth = targetDate.toISOString().slice(0, 7);

  // 找到全局最早月份（基于所有记录）
  // allRecordsSorted 已在第65行声明
  const firstMonth = allRecordsSorted.length > 0 ? allRecordsSorted[0].date : null;

  // Check if previous month is earlier than the earliest investment month
  if (firstMonth && previousMonth < firstMonth) {
    // Previous month is earlier than any investment existed, set to 0
    previousMonthAssets = 0;
    console.log('🔍[Previous Month Assets] Previous month earlier than earliest investment month, set to 0:', {
      previousMonth,
      firstMonth
    });
  } else {
    // Use unified calculation function
    const previousAssetsCalculation = calculateAssetsForMonth(previousMonth, allRecords);
    previousMonthAssets = previousAssetsCalculation.totalAssets;

    console.log('🔍[Previous Month Assets Calculation] Month:', previousMonth, {
      normalInvestment: previousAssetsCalculation.normalInvestmentAssets.toFixed(2),
      timeDeposits: previousAssetsCalculation.timeDepositAssets.toFixed(2),
      totalAssets: previousMonthAssets.toFixed(2),
      timeDepositDetails: previousAssetsCalculation.details.timeDeposits.map(td => ({
        account: td.account,
        startDate: td.date,
        principal: td.amount,
        interest: td.profit.toFixed(2),
        totalValue: td.total.toFixed(2)
      }))
    });
  }

  // Debug log
  console.log('🔍[Asset Calculation Details]');
  console.log('- Normal Investment Assets:', currentAssetsCalculation.normalInvestmentAssets.toFixed(2));
  console.log('- Time Deposit Assets:', currentAssetsCalculation.timeDepositAssets.toFixed(2));
  console.log('- Current Assets:', currentAssets.toFixed(2));
  console.log('- Total Investment:', totalInvestment.toFixed(2));
  console.log('- Monthly Profit:', (currentAssets - totalInvestment).toFixed(2));

  // Calculate total profit (for display when no month filter is applied)
  const totalProfit = currentAssets - totalInvestment;

  // Calculate monthly profit (next month snapshot - current month snapshot - current month investment)
  const latestMonthlyProfit = new Map<string, number>(); // Account -> Monthly profit

  // 为了计算当月收益，需要使用 allRecords（包括下月的快照）
  // 按账户组织所有记录（不按月份过滤）
  const allRecordsByAccount = new Map<string, InvestmentRecord[]>();
  allRecordsUnfiltered.forEach(record => {
    const key = record.account;
    if (!allRecordsByAccount.has(key)) {
      allRecordsByAccount.set(key, []);
    }
    allRecordsByAccount.get(key)!.push(record);
  });

  // Calculate monthly profit for each account
  console.log('🔍[Monthly Profit Calculation] Filter Status:', {
    selectedTypes,
    selectedAccounts,
    filterMonth,
    allRecordsCount: allRecordsUnfiltered.length,
    accountsCount: allRecordsByAccount.size
  });

  allRecordsByAccount.forEach((accountRecords, account) => {
    // Filter records with snapshot amounts and sort by date
    // Exclude time deposits, only calculate monthly profit for normal investments
    const recordsWithSnapshot = accountRecords
      .filter(r => r.snapshot !== undefined)
      .filter(r => !r.isTimeDeposit)
      .sort((a, b) => a.date.localeCompare(b.date));

    // 需要至少2条记录才能计算收益
    if (recordsWithSnapshot.length >= 2) {
      let targetMonthRecord: typeof recordsWithSnapshot[0] | undefined;
      let nextMonthRecord: typeof recordsWithSnapshot[0] | undefined;

      if (filterMonth) {
        // 如果有筛选月份，找到该月份和下一个月的快照
        targetMonthRecord = recordsWithSnapshot.find(r => r.date === filterMonth);
        if (targetMonthRecord) {
          const targetIndex = recordsWithSnapshot.indexOf(targetMonthRecord);
          if (targetIndex < recordsWithSnapshot.length - 1) {
            const nextRecord = recordsWithSnapshot[targetIndex + 1];
            // 检查是否是连续月份
            const currentDate = new Date(targetMonthRecord.date + '-01');
            const nextDate = new Date(nextRecord.date + '-01');
            const monthDiff = (nextDate.getFullYear() - currentDate.getFullYear()) * 12 +
                             (nextDate.getMonth() - currentDate.getMonth());
            if (monthDiff === 1) {
              nextMonthRecord = nextRecord;
            }
          }
        }
      } else {
        // 按账户快照比例分摊整体收益
        let totalSnapshot = 0;
        latestSnapshotByAccount.forEach((snapshot) => {
          totalSnapshot += snapshot;
        });

        // 为每个账户分配收益
        if (totalSnapshot > 0) {
          latestSnapshotByAccount.forEach((snapshot, account) => {
            const ratio = snapshot / totalSnapshot;
            const accountProfit = totalProfit * ratio;
            latestMonthlyProfit.set(account, accountProfit);
          });
        } else {
          // 如果没有筛选，直接设置总收益，使用虚拟账户key
          latestMonthlyProfit.set('__total__', totalProfit);
        }
      }

      // 如果找到了当月和下月的快照，计算收益
      if (targetMonthRecord && nextMonthRecord) {
        // 【新增】检查是否是第一个快照（初始投资当月）
        const targetIndex = recordsWithSnapshot.indexOf(targetMonthRecord);
        const isFirstMonth = (targetIndex === 0);

        if (isFirstMonth) {
          // Initial investment month, profit = 0
          latestMonthlyProfit.set(account, 0);

          console.log(`📊 Account ${account} Monthly Profit:`, {
            month: targetMonthRecord.date,
            profit: 0,
            reason: 'Initial investment month'
          });
        } else {
          // Calculate investment amount for this account in current month (targetMonthRecord)
          // Do not exclude time deposits to stay consistent with Dashboard
          const currentMonthInvestment = accountRecords
            .filter(r => r.date === targetMonthRecord.date)
            .reduce((sum, r) => sum + r.amount, 0);

          // New formula: Monthly Profit = (Next Month Snapshot - Current Month Snapshot) - Current Month Investment
          const profit = (nextMonthRecord.snapshot! - targetMonthRecord.snapshot!) - currentMonthInvestment;
          latestMonthlyProfit.set(account, profit);

          console.log(`📊 Account ${account} Monthly Profit Calculation:`, {
            currentMonth: targetMonthRecord.date,
            currentSnapshot: targetMonthRecord.snapshot,
            nextMonth: nextMonthRecord.date,
            nextSnapshot: nextMonthRecord.snapshot,
            currentInvestment: currentMonthInvestment,
            profit: profit
          });
        }
      }
    }
  });

  // Calculate time deposit profit
  let timeDepositProfit = 0;

  if (timeDepositRecords.length > 0) {
    timeDepositRecords.forEach(record => {
      if (filterMonth) {
        // Calculate profit for specified month
        timeDepositProfit += calculateTimeDepositProfitForMonth(record, filterMonth);
      } else {
        // Calculate total profit (accumulated to current month)
        // Use currentMonth to ensure consistency with current assets calculation
        timeDepositProfit += calculateTimeDepositTotalProfit(record, currentMonth);
      }
    });
  }

  // Calculate monthly profit: current assets - previous month assets - current month investment
  const totalLatestMonthlyProfit = filterMonth
    ? currentAssets - previousMonthAssets - currentMonthInvestmentAmount
    : totalProfit; // When no filter, use already calculated totalProfit

  // Detailed debug log: track monthly profit calculation
  console.log('🔍[Monthly Profit Final Calculation]', {
    filterMonth,
    latestMonthlyProfitEntries: Array.from(latestMonthlyProfit.entries()),
    latestMonthlyProfitSum: Array.from(latestMonthlyProfit.values()).reduce((sum, val) => sum + val, 0),
    timeDepositProfit,
    totalProfit,
    totalLatestMonthlyProfit,
    'frontend will display': totalLatestMonthlyProfit
  });

  // Calculate ROI
  let roi = 0;
  if (currentMonthInvestmentAmount !== 0) {
    roi = totalLatestMonthlyProfit / currentMonthInvestmentAmount;
  }

  // Debug log
  console.log(`📊 ${selectedTypes.length === 0 ? 'All Investments' : selectedTypes.join(', ')} - ${selectedAccounts.length === 0 ? 'All Accounts' : selectedAccounts.join(', ')} Stats:`, {
    recordsCount: records.length,
    selectedTypes,
    selectedAccounts,
    totalInvestment,
    currentMonthInvestmentAmount,
    currentAssets,
    latestSnapshotByAccount: Array.from(latestSnapshotByAccount.entries()),
    totalLatestMonthlyProfit,
    roi,
    monthlyProfitByAccount: Array.from(latestMonthlyProfit.entries())
  });

  // 找到最晚的记录（使用 allRecordsSorted，在第65行声明）
  const lastMonth = allRecordsSorted.length > 0 ? allRecordsSorted[allRecordsSorted.length - 1].date : '-';

  const stats = [
    {
      label: filterMonth ? 'Current Month Investment' : 'Total Investment',
      value: `$${totalInvestment.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
      icon: '',
      tooltip: true,
      tooltipContent: filterMonth
        ? ['Investment amount for the currently filtered month']
        : ['Cumulative investment amount for all investment types']
    },
    {
      label: 'Current Assets',
      value: `$${currentAssets.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
      icon: '',
      tooltip: true,
      tooltipContent: [
        'Sum of snapshots across all accounts, including time deposits and their interest'
      ]
    },
    {
      label: 'Previous Month Assets',
      value: previousMonthAssets > 0 ? `$${previousMonthAssets.toFixed(2)}` : '-',
      color: 'from-green-500 to-emerald-500',
      icon: '',
      tooltip: true,
      tooltipContent: [
        'Total assets from the previous month (regular investment snapshots + time deposit value)'
      ]
    },
    {
      label: 'Monthly Profit',
      value: totalLatestMonthlyProfit >= 0
        ? `+$${totalLatestMonthlyProfit.toFixed(2)}`
        : `-$${Math.abs(totalLatestMonthlyProfit).toFixed(2)}`,
      color: totalLatestMonthlyProfit >= 0
        ? 'from-green-500 to-emerald-500'
        : 'from-red-500 to-rose-600',
      icon: '',
      tooltip: true,
      tooltipContent: [
        'Monthly Profit = Current Assets - Previous Month Assets - Current Month Investment'
      ]
    },
    {
      label: 'ROI',
      value: roi.toFixed(2),
      color: roi >= 0
        ? 'from-green-500 to-emerald-500'
        : 'from-red-500 to-rose-600',
      icon: '',
      tooltip: true,
      tooltipContent: [
        'ROI = Monthly Profit / Cumulative Investment'
      ]
    },
  ];

  // 获取筛选后的记录用于导出
  const getFilteredRecords = (): InvestmentRecord[] => {
    let recordsToFilter = records;

    // 如果没有筛选任何类型或账户，返回所有记录
    if (selectedTypes.length === 0 && selectedAccounts.length === 0 && !filterMonth) {
      return recordsToFilter;
    }

    // 应用筛选条件
    let filtered = recordsToFilter;
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((r: InvestmentRecord) => selectedTypes.includes(r.assetType));
    }
    if (selectedAccounts.length > 0) {
      filtered = filtered.filter((r: InvestmentRecord) => selectedAccounts.includes(r.account));
    }
    if (filterMonth) {
      filtered = filtered.filter((r: InvestmentRecord) => r.date === filterMonth);
    }

    return filtered;
  };

  // 处理导出
  const handleExport = () => {
    const filteredRecords = getFilteredRecords();
    if (filteredRecords.length === 0) {
      alert('暂无数据可导出');
      return;
    }
    exportInvestmentDataToCSV(filteredRecords);
  };

  return (
    <>
      {/* Import/Export button group */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowImportDialog(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          title="Import investment data from CSV file"
        >
          Import Data
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          title="Export filtered data to CSV format"
        >
          Export CSV
        </button>
      </div>

      {/* 导入对话框 */}
      <InvestmentImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={() => {
          setShowImportDialog(false);
          // 刷新数据
          useInvestmentStore.getState().loadRecords();
        }}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              {stat.label}
              {(stat as any).tooltip && <InfoTooltip content={(stat as any).tooltipContent} />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
