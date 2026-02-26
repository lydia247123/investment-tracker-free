import { InvestmentRecord, RecordsByType } from '@types/investment';
import { RecordsByMetalType, PreciousMetalRecord } from '@types/preciousMetal';
import { calculateMonthlyAccumulatedProfit } from './metalCalculations';
import { calculateTimeDepositTotalProfit, calculateMaturityDate } from './timeDepositCalculations';

/**
 * 快照数据接口
 */
export interface SnapshotData {
  date: string;
  snapshot: number;
}

/**
 * 月度投资数据接口
 */
export interface MonthlyInvestmentData {
  month: string;      // 月份（YYYY-MM）
  profit: number;     // 当月总收益
  investment: number; // 当月总投资
  roi: number;        // 投入产出比
}

/**
 * 按账户分组的月度投资数据接口
 */
export interface MonthlyInvestmentDataByAccount {
  account: string;
  data: MonthlyInvestmentData[];
}

/**
 * 按账户分组快照数据并按日期排序
 * @param records - 所有投资记录
 * @returns 按账户分组的快照数据
 */
export function groupSnapshotsByAccount(
  records: InvestmentRecord[]
): Map<string, SnapshotData[]> {
  const snapshotsByAccount = new Map<string, SnapshotData[]>();

  // 过滤有快照金额的记录
  const snapshotRecords = records.filter(r => r.snapshot !== undefined);

  // 按账户分组
  snapshotRecords.forEach(record => {
    if (!snapshotsByAccount.has(record.account)) {
      snapshotsByAccount.set(record.account, []);
    }
    snapshotsByAccount.get(record.account)!.push({
      date: record.date,
      snapshot: record.snapshot!
    });
  });

  // 每个账户的快照按日期排序
  snapshotsByAccount.forEach((snapshots) => {
    snapshots.sort((a, b) => a.date.localeCompare(b.date));
  });

  return snapshotsByAccount;
}

/**
 * 计算两个月份之间的差值
 * @param date1 - 日期1（YYYY-MM格式）
 * @param date2 - 日期2（YYYY-MM格式）
 * @returns 月份差值（1表示连续月份）
 */
export function getMonthDiff(date1: string, date2: string): number {
  const d1 = new Date(date1 + '-01');
  const d2 = new Date(date2 + '-01');
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

/**
 * 计算每月的投资数据（收益、投资金额、投入产出比）
 * @param recordsByType - 按类型分组的投资记录
 * @returns 月度数据数组
 */
export function calculateMonthlyInvestmentData(
  recordsByType: RecordsByType
): MonthlyInvestmentData[] {
  // 收集所有普通投资记录
  const allRecords = Object.values(recordsByType).flat();

  // 按账户分组快照数据
  const snapshotsByAccount = groupSnapshotsByAccount(allRecords);

  // 存储每月的收益和投资数据
  const monthlyData = new Map<string, { profit: number; investment: number }>();

  // 遍历每个账户
  snapshotsByAccount.forEach((snapshots, account) => {
    // 遍历连续月份
    for (let i = 0; i < snapshots.length - 1; i++) {
      const currentSnapshot = snapshots[i];
      const nextSnapshot = snapshots[i + 1];

      // 只计算连续月份
      if (getMonthDiff(currentSnapshot.date, nextSnapshot.date) === 1) {
        // 计算当月投资金额
        const currentMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === currentSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算当月收益 = (下月快照 - 当月快照) - 当月投资金额
        // 初始投资当月（第一个快照）的收益为0
        const isFirstSnapshot = (i === 0);
        const profit = isFirstSnapshot
          ? 0  // 初始投资当月收益为0
          : (nextSnapshot.snapshot - currentSnapshot.snapshot) - currentMonthInvestment;

        // 累加到月度数据
        if (!monthlyData.has(currentSnapshot.date)) {
          monthlyData.set(currentSnapshot.date, { profit: 0, investment: 0 });
        }
        const data = monthlyData.get(currentSnapshot.date)!;
        data.profit += profit;
        data.investment += currentMonthInvestment;
      }
    }
  });

  // 转换为数组并计算ROI
  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      profit: data.profit,
      investment: data.investment,
      roi: data.investment > 0 ? data.profit / data.investment : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 计算每个账户的月度投资数据（不汇总）
 * @param recordsByType - 按类型分组的投资记录
 * @returns 按账户分组的月度数据数组
 */
export function calculateMonthlyInvestmentDataByAccount(
  recordsByType: RecordsByType
): MonthlyInvestmentDataByAccount[] {
  // 收集所有普通投资记录
  const allRecords = Object.values(recordsByType).flat();

  // 按账户分组快照数据
  const snapshotsByAccount = groupSnapshotsByAccount(allRecords);

  const result: MonthlyInvestmentDataByAccount[] = [];

  // 遍历每个账户
  snapshotsByAccount.forEach((snapshots, account) => {
    const monthlyData = new Map<string, { profit: number; investment: number }>();

    // 遍历连续月份
    for (let i = 0; i < snapshots.length - 1; i++) {
      const currentSnapshot = snapshots[i];
      const nextSnapshot = snapshots[i + 1];

      // 只计算连续月份
      if (getMonthDiff(currentSnapshot.date, nextSnapshot.date) === 1) {
        // 计算当月投资金额（该账户在该月份的所有投资）
        const currentMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === currentSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算当月收益 = (下月快照 - 当月快照) - 当月投资金额
        // 初始投资当月（第一个快照）的收益为0
        const isFirstSnapshot = (i === 0);
        const profit = isFirstSnapshot
          ? 0
          : (nextSnapshot.snapshot - currentSnapshot.snapshot) - currentMonthInvestment;

        // 累加到月度数据
        if (!monthlyData.has(currentSnapshot.date)) {
          monthlyData.set(currentSnapshot.date, { profit: 0, investment: 0 });
        }
        const data = monthlyData.get(currentSnapshot.date)!;
        data.profit += profit;
        data.investment += currentMonthInvestment;
      }
    }

    // 转换为数组并计算ROI
    const accountData = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        profit: data.profit,
        investment: data.investment,
        roi: data.investment > 0 ? data.profit / data.investment : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    result.push({ account, data: accountData });
  });

  return result;
}

/**
 * 提取所有账户涉及的所有唯一月份
 * @param dataByAccount - 按账户分组的月度数据
 * @returns 排序后的唯一月份数组
 */
export function getAllUniqueMonths(dataByAccount: MonthlyInvestmentDataByAccount[]): string[] {
  const monthsSet = new Set<string>();
  dataByAccount.forEach(({ data }) => {
    data.forEach(({ month }) => monthsSet.add(month));
  });
  return Array.from(monthsSet).sort();
}

/**
 * 将账户数据对齐到统一的月份轴（缺失月份填充null）
 * @param accountData - 单个账户的月度数据
 * @param allMonths - 所有可能的月份（已排序）
 * @returns 对齐后的数据数组
 */
export function alignAccountDataToMonths(
  accountData: MonthlyInvestmentData[],
  allMonths: string[]
): Array<{ month: string; roi: number | null }> {
  const dataMap = new Map(accountData.map(d => [d.month, d.roi]));

  return allMonths.map(month => ({
    month,
    roi: dataMap.get(month) ?? null
  }));
}

/**
 * 月度收益率数据接口
 */
export interface MonthlyReturnData {
  month: string;           // 月份（YYYY-MM）
  returnRate: number;      // 月度收益率（百分比，如 5.2 表示 5.2%）
  previousSnapshot: number; // 上月快照金额
  profit: number;          // 当月收益
}

/**
 * 按账户分组的月度收益率数据接口
 */
export interface MonthlyReturnDataByAccount {
  account: string;
  data: MonthlyReturnData[];
}

/**
 * 计算每个账户的月度收益率
 * @param recordsByType - 按类型分组的投资记录
 * @returns 按账户分组的月度收益率数据
 */
export function calculateMonthlyReturnByAccount(
  recordsByType: RecordsByType
): MonthlyReturnDataByAccount[] {
  // 收集所有普通投资记录
  const allRecords = Object.values(recordsByType).flat();

  // 按账户分组快照数据
  const snapshotsByAccount = groupSnapshotsByAccount(allRecords);

  const result: MonthlyReturnDataByAccount[] = [];

  // 遍历每个账户
  snapshotsByAccount.forEach((snapshots, account) => {
    const monthlyData: MonthlyReturnData[] = [];

    // 处理首月（第一个快照）
    if (snapshots.length > 0) {
      const firstSnapshot = snapshots[0];
      const firstMonthInvestment = allRecords
        .filter(r => r.account === account && r.date === firstSnapshot.date)
        .reduce((sum, r) => sum + r.amount, 0);

      // 首月收益 = 当月快照 - 0 - 当月投资 = 当月快照 - 当月投资
      // 对于首月存入的情况，收益为0（当月快照 = 当月投资）
      const firstMonthProfit = firstSnapshot.snapshot - 0 - firstMonthInvestment;

      // 首月收益率 = 首月收益 / 当月投资
      const firstMonthReturnRate = firstMonthInvestment > 0
        ? (firstMonthProfit / firstMonthInvestment) * 100
        : 0;

      monthlyData.push({
        month: firstSnapshot.date,
        returnRate: firstMonthReturnRate,
        previousSnapshot: 0, // 首月无上月快照
        profit: firstMonthProfit
      });
    }

    // 遍历连续月份（从第二个快照开始）
    for (let i = 0; i < snapshots.length - 1; i++) {
      const previousSnapshot = snapshots[i];
      const currentSnapshot = snapshots[i + 1];

      // 只计算连续月份
      if (getMonthDiff(previousSnapshot.date, currentSnapshot.date) === 1) {
        // 计算上月投资金额（用于收益计算）
        const previousMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === previousSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算当月投资金额（用于收益率计算）
        const currentMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === currentSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算当月收益 = (当月快照 - 上月快照) - 当月投资
        const profit = (currentSnapshot.snapshot - previousSnapshot.snapshot) - currentMonthInvestment;

        // 计算月度收益率：如果当月有投资，使用当月投资；否则使用上月快照
        const denominator = currentMonthInvestment > 0
          ? currentMonthInvestment
          : previousSnapshot.snapshot;
        const returnRate = denominator > 0
          ? (profit / denominator) * 100
          : 0;

        monthlyData.push({
          month: currentSnapshot.date,
          returnRate,
          previousSnapshot: previousSnapshot.snapshot,
          profit
        });
      }
    }

    // 只添加有数据的账户
    if (monthlyData.length > 0) {
      result.push({
        account,
        data: monthlyData
      });
    }
  });

  return result;
}

/**
 * 从收益率数据中获取所有唯一月份
 * @param returnDataByAccount - 按账户分组的收益率数据
 * @returns 排序后的唯一月份数组
 */
export function getAllUniqueMonthsFromReturnData(
  returnDataByAccount: MonthlyReturnDataByAccount[]
): string[] {
  const monthsSet = new Set<string>();

  returnDataByAccount.forEach(({ data }) => {
    data.forEach(d => {
      monthsSet.add(d.month);
    });
  });

  return Array.from(monthsSet).sort();
}

/**
 * 将账户收益率数据对齐到统一的月份轴
 * @param accountData - 单个账户的月度收益率数据
 * @param allMonths - 所有可能的月份（已排序）
 * @returns 对齐后的数据数组（缺失月份填充null）
 */
export function alignReturnDataToMonths(
  accountData: MonthlyReturnData[],
  allMonths: string[]
): Array<{ month: string; returnRate: number | null }> {
  const dataMap = new Map(accountData.map(d => [d.month, d.returnRate]));

  return allMonths.map(month => ({
    month,
    returnRate: dataMap.get(month) ?? null
  }));
}

/**
 * 计算整体月度收益率（汇总所有账户后计算）
 * @param recordsByType - 按类型分组的投资记录
 * @returns 整体月度收益率数据数组
 */
export function calculateOverallMonthlyReturn(
  recordsByType: RecordsByType
): MonthlyReturnData[] {
  // 收集所有普通投资记录
  const allRecords = Object.values(recordsByType).flat();

  // 按账户分组快照数据
  const snapshotsByAccount = groupSnapshotsByAccount(allRecords);

  // 存储每月的汇总数据（所有账户的总收益和总快照）
  // 键使用上月日期（确保不丢失最新月份），分母根据统一公式选择
  const monthlySummary = new Map<string, {
    totalProfit: number;
    totalCurrentSnapshot: number;
    totalCurrentMonthInvestment: number;  // 当月总投资
    totalPreviousSnapshot: number;        // 上月快照总额
  }>();

  // 遍历每个账户，收集数据
  snapshotsByAccount.forEach((snapshots, account) => {
    // 遍历连续月份
    for (let i = 0; i < snapshots.length - 1; i++) {
      const previousSnapshot = snapshots[i];
      const currentSnapshot = snapshots[i + 1];

      // 只计算连续月份
      if (getMonthDiff(previousSnapshot.date, currentSnapshot.date) === 1) {
        // 计算该账户在previousSnapshot月份的投资金额
        const currentMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === previousSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算该账户当月收益（普通投资，不包含定期存款）
        // 初始投资当月（第一个快照）的收益为0
        const isFirstSnapshot = (i === 0);
        const profit = isFirstSnapshot
          ? 0  // 初始投资当月收益为0
          : (currentSnapshot.snapshot - previousSnapshot.snapshot) - currentMonthInvestment;

        // 累加到月度汇总
        if (!monthlySummary.has(previousSnapshot.date)) {
          monthlySummary.set(previousSnapshot.date, {
            totalProfit: 0,
            totalCurrentSnapshot: 0,
            totalCurrentMonthInvestment: 0,
            totalPreviousSnapshot: 0
          });
        }

        const summary = monthlySummary.get(previousSnapshot.date)!;
        summary.totalProfit += profit;
        summary.totalCurrentSnapshot += previousSnapshot.snapshot;
        summary.totalCurrentMonthInvestment += currentMonthInvestment;  // 累加当月投资

        // 计算上月快照（使用currentSnapshot作为上月快照）
        summary.totalPreviousSnapshot += currentSnapshot.snapshot;
      }
    }
  });

  // 计算每月的整体收益率（使用统一公式）
  return Array.from(monthlySummary.entries())
    .map(([month, summary]) => {
      // 统一公式：当月有投资用当月投资，无投资用上月快照
      const denominator = summary.totalCurrentMonthInvestment > 0
        ? summary.totalCurrentMonthInvestment
        : summary.totalPreviousSnapshot;

      const returnRate = denominator > 0
        ? (summary.totalProfit / denominator) * 100
        : 0;

      return {
        month,
        returnRate,
        previousSnapshot: summary.totalCurrentSnapshot,
        profit: summary.totalProfit
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 计算整体月度ROI（投入产出比）
 * @param recordsByType - 按类型分组的投资记录
 * @param recordsByMetalType - 按类型分组的贵金属记录（可选）
 * @param includeMetal - 是否包含贵金属数据（可选）
 * @returns 整体月度ROI数据数组
 */
export function calculateOverallMonthlyROI(
  recordsByType: RecordsByType,
  recordsByMetalType?: RecordsByMetalType,
  includeMetal?: boolean
): MonthlyInvestmentData[] {
  // ========== 计算普通投资数据 ==========
  // 收集所有投资记录（包含定期存款）
  const allRecords = Object.values(recordsByType)
    .flat();

  // 按账户分组快照数据
  const snapshotsByAccount = groupSnapshotsByAccount(allRecords);

  // 存储每月的汇总数据（所有账户的总收益和总投资）
  const monthlySummary = new Map<string, { totalProfit: number; totalInvestment: number }>();

  // 遍历每个账户，收集数据
  snapshotsByAccount.forEach((snapshots, account) => {
    // 遍历连续月份
    for (let i = 0; i < snapshots.length - 1; i++) {
      const currentSnapshot = snapshots[i];
      const nextSnapshot = snapshots[i + 1];

      // 只计算连续月份
      if (getMonthDiff(currentSnapshot.date, nextSnapshot.date) === 1) {
        // 计算当月投资金额
        const currentMonthInvestment = allRecords
          .filter(r => r.account === account && r.date === currentSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算当月收益 = (下月快照 - 当月快照) - 当月投资金额
        // 初始投资当月（第一个快照）的收益为0
        const isFirstSnapshot = (i === 0);
        const profit = isFirstSnapshot
          ? 0  // 初始投资当月收益为0
          : (nextSnapshot.snapshot - currentSnapshot.snapshot) - currentMonthInvestment;

        // 累加到月度汇总
        if (!monthlySummary.has(currentSnapshot.date)) {
          monthlySummary.set(currentSnapshot.date, {
            totalProfit: 0,
            totalInvestment: 0
          });
        }

        const summary = monthlySummary.get(currentSnapshot.date)!;
        summary.totalProfit += profit;
        summary.totalInvestment += currentMonthInvestment;
      }
    }
  });

  // ========== 计算贵金属数据 ==========
  // 参考 MonthlyProfitChart 的贵金属收益计算逻辑
  if (includeMetal && recordsByMetalType) {
    // 收集所有贵金属记录
    const allMetalRecords: PreciousMetalRecord[] = Object.values(recordsByMetalType).flat();

    if (allMetalRecords.length > 0) {
      // 计算每个月的贵金属收益和投资金额
      const uniqueMonths = new Set(allMetalRecords.map((r: PreciousMetalRecord) => r.date));
      const sortedMonths = Array.from(uniqueMonths).sort();

      sortedMonths.forEach((month) => {
        // 筛选到该月为止的所有记录
        const recordsUpToMonth = allMetalRecords.filter((r: PreciousMetalRecord) => r.date <= month);

        // 计算累计投资金额
        const totalAmount = recordsUpToMonth.reduce(
          (sum: number, r: PreciousMetalRecord) => sum + (r.grams * r.pricePerGram),
          0
        );

        // 获取当月均价
        const monthRecords = allMetalRecords.filter((r: PreciousMetalRecord) => r.date === month);
        const monthAveragePrice = monthRecords.length > 0 ? monthRecords[0].averagePrice : 0;

        // 计算当前价值
        const totalGrams = recordsUpToMonth.reduce((sum: number, r: PreciousMetalRecord) => sum + r.grams, 0);
        const currentValue = monthAveragePrice * totalGrams;

        // 计算累计收益
        const cumulativeProfit = currentValue - totalAmount;

        // 计算非重复月份数量
        const uniqueMonthCount = new Set(recordsUpToMonth.map((r: PreciousMetalRecord) => r.date)).size;

        // 计算月度收益
        const monthlyProfit = uniqueMonthCount > 0 ? cumulativeProfit / uniqueMonthCount : 0;

        // 计算当月投资金额
        const monthInvestment = monthRecords.reduce(
          (sum: number, r: PreciousMetalRecord) => sum + (r.grams * r.pricePerGram),
          0
        );

        // 添加到月度汇总
        if (!monthlySummary.has(month)) {
          monthlySummary.set(month, {
            totalProfit: 0,
            totalInvestment: 0
          });
        }

        const summary = monthlySummary.get(month)!;
        summary.totalProfit += monthlyProfit;
        summary.totalInvestment += monthInvestment;
      });
    }
  }

  // ========== 计算每月的整体ROI ==========
  return Array.from(monthlySummary.entries())
    .map(([month, summary]) => ({
      month,
      profit: summary.totalProfit,
      investment: summary.totalInvestment,
      roi: summary.totalInvestment > 0 ? summary.totalProfit / summary.totalInvestment : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 按资产类型分组的月度收益率数据接口
 */
export interface MonthlyReturnDataByAssetType {
  assetType: string;
  data: MonthlyReturnData[];
}

/**
 * 计算定期存款的月度收益率
 * 定期存款收益率 = 年利率 / 12
 * @param records - 定期存款记录
 * @returns 月度收益率数据
 */
function calculateTimeDepositReturns(
  records: InvestmentRecord[]
): MonthlyReturnData[] {
  console.log('\n========== Time Deposit Return Rate Calculation ==========');
  console.log(`Processing ${records.length} time deposit records`);

  const monthlyData = new Map<string, {
    totalReturnRate: number;
    recordCount: number;
  }>();

  records.forEach(record => {
    // 只处理标记为定期存款的记录
    if (!record.isTimeDeposit) return;

    // 检查必要的字段
    if (!record.depositTermMonths || !record.annualInterestRate) {
      return;
    }

    const startMonth = record.date;
    const maturityMonth = calculateMaturityDate(
      record.date,
      record.depositTermMonths
    );

    // 计算月利率
    const monthlyRate = record.annualInterestRate / 12;

    console.log(`\n📊 Time Deposit Record:`);
    console.log(`  Account: ${record.account}`);
    console.log(`  Start Month: ${startMonth}`);
    console.log(`  Maturity Month: ${maturityMonth}`);
    console.log(`  Annual Interest Rate: ${record.annualInterestRate}%`);
    console.log(`  Monthly Interest Rate: ${monthlyRate.toFixed(4)}%`);

    // 从起息月到到期月，逐月生成收益率
    let currentMonth = startMonth;
    while (currentMonth < maturityMonth) {
      if (!monthlyData.has(currentMonth)) {
        monthlyData.set(currentMonth, {
          totalReturnRate: 0,
          recordCount: 0
        });
      }

      const data = monthlyData.get(currentMonth)!;
      data.totalReturnRate += monthlyRate;
      data.recordCount += 1;

      // 移动到下一个月
      const currentDate = new Date(currentMonth + '-01');
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentMonth = currentDate.toISOString().slice(0, 7);
    }
  });

  // 加总收益率（如果同一月有多个定期存款）
  const returnData = Array.from(monthlyData.entries())
    .map(([month, data]) => {
      const returnRate = data.totalReturnRate;
      console.log(`\n✨ ${month} Time Deposit Return Rate Summary:`);
      console.log(`  Accumulated Monthly Return Rate: ${returnRate.toFixed(4)}%`);
      console.log(`  Number of Time Deposits: ${data.recordCount}`);
      return {
        month,
        returnRate,
        previousSnapshot: 0,
        profit: 0
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  console.log('=====================================\n');
  return returnData;
}

/**
 * 计算每个资产类型的月度收益率
 * @param recordsByType - 按类型分组的投资记录
 * @returns 按资产类型分组的月度收益率数据
 */
export function calculateMonthlyReturnByAssetType(
  recordsByType: RecordsByType
): MonthlyReturnDataByAssetType[] {
  const result: MonthlyReturnDataByAssetType[] = [];

  // 遍历每个资产类型
  Object.entries(recordsByType).forEach(([assetType, records]) => {
    if (records.length === 0) return;

    // 特殊处理：定期存款
    if (assetType === '定期存款') {
      const returnData = calculateTimeDepositReturns(records);
      if (returnData.length > 0) {
        result.push({ assetType, data: returnData });
      }
      return; // 跳过常规计算
    }

    // 按账户分组快照数据
    const snapshotsByAccount = groupSnapshotsByAccount(records);

    if (snapshotsByAccount.size === 0) return;

    const monthlyData = new Map<string, {
      totalProfit: number;
      totalInvestment: number;
      previousMonthSnapshot: number;
    }>();

    // 计算该类型每个账户的月度收益
    snapshotsByAccount.forEach((snapshots, account) => {
      // 处理首月（第一个快照）
      if (snapshots.length > 0) {
        const firstSnapshot = snapshots[0];
        const firstMonthInvestment = records
          .filter(r => r.account === account && r.date === firstSnapshot.date)
          .reduce((sum, r) => sum + r.amount, 0);

        // 首月收益 = 当月快照 - 0 - 当月投资
        const firstMonthProfit = firstSnapshot.snapshot - 0 - firstMonthInvestment;

        // 累加到月度数据
        if (!monthlyData.has(firstSnapshot.date)) {
          monthlyData.set(firstSnapshot.date, {
            totalProfit: 0,
            totalInvestment: 0,
            previousMonthSnapshot: 0
          });
        }

        const data = monthlyData.get(firstSnapshot.date)!;
        data.totalProfit += firstMonthProfit;
        data.totalInvestment += firstMonthInvestment;
        // 首月的previousMonthSnapshot保持为0
      }

      // 处理后续月份
      for (let i = 1; i < snapshots.length; i++) {
        const currentSnapshot = snapshots[i];
        const previousSnapshot = snapshots[i - 1];

        if (getMonthDiff(previousSnapshot.date, currentSnapshot.date) === 1) {
          // 计算当月投资金额
          const currentMonthInvestment = records
            .filter(r => r.account === account && r.date === currentSnapshot.date)
            .reduce((sum, r) => sum + r.amount, 0);

          // 计算当月收益
          const profit = (currentSnapshot.snapshot - previousSnapshot.snapshot) - currentMonthInvestment;

          // 累加到月度数据
          if (!monthlyData.has(currentSnapshot.date)) {
            monthlyData.set(currentSnapshot.date, {
              totalProfit: 0,
              totalInvestment: 0,
              previousMonthSnapshot: 0
            });
          }

          const data = monthlyData.get(currentSnapshot.date)!;
          data.totalProfit += profit;
          data.totalInvestment += currentMonthInvestment;
          data.previousMonthSnapshot += previousSnapshot.snapshot;
        }
      }
    });

    // 转换为收益率数据
    const returnData = Array.from(monthlyData.entries())
      .map(([month, data]) => {
        // 如果当月有投资，使用当月投资；否则使用上月快照
        const denominator = data.totalInvestment > 0
          ? data.totalInvestment
          : data.previousMonthSnapshot;
        const returnRate = denominator > 0
          ? (data.totalProfit / denominator) * 100
          : 0;

        console.log(`📊 [${assetType}] ${month} Return Rate Calculation:`);
        console.log(`  Current Month Profit: ${data.totalProfit.toFixed(2)}`);
        console.log(`  Current Month Investment: ${data.totalInvestment.toFixed(2)}`);
        console.log(`  Previous Month Snapshot: ${data.previousMonthSnapshot.toFixed(2)}`);
        console.log(`  Denominator Used: ${denominator.toFixed(2)} ${data.totalInvestment > 0 ? '(Current Month Investment)' : '(Previous Month Snapshot)'}`);
        console.log(`  Return Rate: ${returnRate.toFixed(2)}% = (${data.totalProfit.toFixed(2)} ÷ ${denominator.toFixed(2)}) × 100`);

        return {
          month,
          returnRate,
          previousSnapshot: data.previousMonthSnapshot,
          profit: data.totalProfit
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    if (returnData.length > 0) {
      result.push({ assetType, data: returnData });
    }
  });

  return result;
}

/**
 * 计算贵金属的月度收益率
 * @param recordsByMetalType - 按类型分组的贵金属记录
 * @returns 贵金属的月度收益率数据
 */
export function calculatePreciousMetalMonthlyReturns(
  recordsByMetalType: RecordsByMetalType
): MonthlyReturnData[] {
  // 收集所有贵金属记录
  const allMetalRecords: PreciousMetalRecord[] = Object.values(recordsByMetalType).flat();

  if (allMetalRecords.length === 0) return [];

  // 获取所有唯一月份
  const uniqueMonths = new Set(allMetalRecords.map(r => r.date));
  const sortedMonths = Array.from(uniqueMonths).sort();

  // 计算每个月的收益率
  return sortedMonths.map((month) => {
    // 1. 计算当月投资金额
    const monthRecords = allMetalRecords.filter(r => r.date === month);
    const monthInvestment = monthRecords.reduce(
      (sum, r) => sum + (r.grams * r.pricePerGram),
      0
    );

    // 2. 使用统一的计算函数获取单月收益
    const monthlyProfits = calculateMonthlyAccumulatedProfit(recordsByMetalType, month);
    const monthlyProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

    // 3. 计算收益率：单月收益 / 当月投资金额
    const returnRate = monthInvestment > 0
      ? (monthlyProfit / monthInvestment) * 100
      : 0;

    return {
      month,
      returnRate,
      previousSnapshot: 0, // 不再需要
      profit: monthlyProfit
    };
  });
}

/**
 * 计算指定月份的总资产
 * @param targetMonth - 要计算的目标月份（YYYY-MM格式）
 * @param recordsForCalc - 所有投资记录（未筛选）
 * @returns 总资产（普通投资快照 + 定期存款本金+利息）
 */
export function calculateTotalAssetsForMonth(
  targetMonth: string,
  recordsForCalc: InvestmentRecord[]
): number {
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
  timeDepositRecords.forEach(record => {
    const profit = calculateTimeDepositTotalProfit(record, targetMonth);
    timeDepositAssets += record.amount + profit;
  });

  // 5. 返回总资产
  return normalInvestmentAssets + timeDepositAssets;
}

/**
 * 计算指定月份的月度收益
 * 使用统一的简单公式：月度收益 = 当前资产 - 上月资产 - 当月投资
 * @param month - 目标月份 (YYYY-MM)
 * @param allRecords - 所有投资记录
 * @returns 月度收益
 */
export function calculateMonthlyProfit(
  month: string,
  allRecords: InvestmentRecord[]
): number {
  // 1. 计算当前月份资产
  const currentAssets = calculateTotalAssetsForMonth(month, allRecords);

  // 2. 计算上个月资产
  const prevDate = new Date(month + '-01');
  prevDate.setMonth(prevDate.getMonth() - 1);
  const previousMonth = prevDate.toISOString().slice(0, 7);
  const previousAssets = calculateTotalAssetsForMonth(previousMonth, allRecords);

  // 3. 计算当月投资（包含所有类型：普通投资 + 定期存款）
  const currentMonthInvestment = allRecords
    .filter(r => r.date === month)
    .reduce((sum, r) => sum + r.amount, 0);

  // 4. 月度收益 = 当前资产 - 上月资产 - 当月投资
  return currentAssets - previousAssets - currentMonthInvestment;
}

/**
 * 获取上一个月份
 * @param month 当前月份（YYYY-MM格式）
 * @returns 上个月份（YYYY-MM格式）
 */
export function getPreviousMonth(month: string): string {
  const date = new Date(month + '-01');
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

/**
 * 计算指定月份的当月投资金额
 * @param month 目标月份
 * @param allRecords 所有投资记录
 * @returns 当月投资金额
 */
export function calculateCurrentMonthInvestment(
  month: string,
  allRecords: InvestmentRecord[]
): number {
  return allRecords
    .filter(r => r.date === month)
    .reduce((sum, r) => sum + r.amount, 0);
}

/**
 * 计算普通投资的上月快照总额
 * @param snapshotsByAccount 按账户分组的快照数据
 * @param targetMonth 目标月份
 * @returns 上月快照总额
 */
export function calculatePreviousMonthSnapshot(
  snapshotsByAccount: Map<string, Array<{ date: string; snapshot: number }>>,
  targetMonth: string
): number {
  const previousMonth = getPreviousMonth(targetMonth);
  let totalPreviousSnapshot = 0;

  snapshotsByAccount.forEach((snapshots) => {
    // 找到上月或之前的最新快照
    const validSnapshots = snapshots.filter(s => s.date <= previousMonth);
    if (validSnapshots.length > 0) {
      const latestSnapshot = validSnapshots[validSnapshots.length - 1];
      totalPreviousSnapshot += latestSnapshot.snapshot;
    }
  });

  return totalPreviousSnapshot;
}

/**
 * 计算整体月度收益率
 * @param month 目标月份
 * @param allRecords 所有投资记录
 * @returns 月度收益率（百分比）
 */
export function calculateOverallReturnRate(
  month: string,
  allRecords: InvestmentRecord[]
): number {
  // 1. 计算月度收益
  const monthlyProfit = calculateMonthlyProfit(month, allRecords);

  // 2. 计算当月投资
  const currentMonthInvestment = calculateCurrentMonthInvestment(month, allRecords);

  // 3. 计算分母：如果当月有投资，使用当月投资；否则使用上月快照
  let denominator = 0;

  if (currentMonthInvestment > 0) {
    // 当月有投资时：使用当月投资金额作为分母
    denominator = currentMonthInvestment;
  } else {
    // 当月无投资时：使用上月快照作为分母
    const previousMonth = getPreviousMonth(month);
    const snapshotsByAccount = groupSnapshotsByAccount(
      allRecords.filter(r => r.snapshot !== undefined)
    );

    let previousMonthSnapshot = 0;
    snapshotsByAccount.forEach((snapshots) => {
      const validSnapshots = snapshots.filter(s => s.date <= previousMonth);
      if (validSnapshots.length > 0) {
        const latestSnapshot = validSnapshots[validSnapshots.length - 1];
        previousMonthSnapshot += latestSnapshot.snapshot;
      }
    });

    denominator = previousMonthSnapshot;
  }

  // 4. 计算收益率
  if (denominator === 0) return 0;
  return (monthlyProfit / denominator) * 100;
}
