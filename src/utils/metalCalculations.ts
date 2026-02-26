import { PreciousMetalRecord, MetalTypeStats, RecordsByMetalType } from '../types/preciousMetal';

/**
 * 计算累计购买克数
 */
export const calculateTotalGrams = (records: PreciousMetalRecord[]): number => {
  return records.reduce((sum, record) => sum + record.grams, 0);
};

/**
 * 计算累计购买金额（克数 × 每克金额之和）
 */
export const calculateTotalAmount = (records: PreciousMetalRecord[]): number => {
  return records.reduce(
    (sum, record) => sum + (record.grams * record.pricePerGram),
    0
  );
};

/**
 * 计算记录中的非重复月份数量
 */
const getUniqueMonthCount = (records: PreciousMetalRecord[]): number => {
  const uniqueMonths = new Set(records.map(r => r.date));
  return uniqueMonths.size;
};

/**
 * 计算月度收益
 * 月度收益 = 整体收益 / 非重复月份数量
 */
export const calculateMonthlyProfit = (records: PreciousMetalRecord[]): number => {
  if (records.length === 0) return 0;

  // 计算整体收益
  const totalProfit = calculateTotalProfit(records);

  // 计算非重复月份数量
  const uniqueMonthCount = getUniqueMonthCount(records);

  // 如果没有月份，返回0
  if (uniqueMonthCount === 0) return 0;

  // 月度收益 = 整体收益 / 非重复月份数量
  const monthlyProfit = totalProfit / uniqueMonthCount;

  return monthlyProfit;
};

/**
 * 计算整体收益
 * 整体收益 = 当月均价 × 累计克数 - 累计金额
 */
export const calculateTotalProfit = (records: PreciousMetalRecord[]): number => {
  if (records.length === 0) return 0;

  const totalGrams = calculateTotalGrams(records);
  const totalAmount = calculateTotalAmount(records);

  // 获取最新的当月均价
  const latestRecord = records.reduce((latest, record) =>
    record.date > latest.date ? record : latest
  );

  // 整体收益 = 当月均价 × 累计克数 - 累计金额
  const currentValue = latestRecord.averagePrice * totalGrams;
  const totalProfit = currentValue - totalAmount;

  return totalProfit;
};

/**
 * 计算综合统计（支持月份筛选）
 */
export const calculateMetalStats = (
  records: PreciousMetalRecord[],
  filterMonth?: string,
  recordsByType?: RecordsByMetalType
): MetalTypeStats => {
  // 根据月份筛选
  const filteredRecords = filterMonth
    ? records.filter(r => r.date <= filterMonth)
    : records;

  if (filteredRecords.length === 0) {
    return {
      totalGrams: 0,
      totalAmount: 0,
      currentValue: 0,
      monthlyProfit: 0,
      totalProfit: 0,
    };
  }

  const totalGrams = calculateTotalGrams(filteredRecords);
  const totalAmount = calculateTotalAmount(filteredRecords);

  // 获取最新的当月均价
  const latestRecord = filteredRecords.reduce((latest, record) =>
    record.date > latest.date ? record : latest
  );

  const currentValue = latestRecord.averagePrice * totalGrams;
  const totalProfit = currentValue - totalAmount;

  // 计算月度收益
  let monthlyProfit = 0;

  if (filterMonth && recordsByType) {
    // 如果指定了月份和按类型分组的记录，计算该月的单月收益（新逻辑）
    const monthlyProfits = calculateMonthlyAccumulatedProfit(recordsByType, filterMonth);
    monthlyProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);
  } else {
    // 否则使用旧逻辑（平均月度收益）
    monthlyProfit = calculateMonthlyProfit(filteredRecords);
  }

  return {
    totalGrams,
    totalAmount,
    currentValue,
    monthlyProfit,
    totalProfit,
  };
};

/**
 * 计算指定月份各贵金属类型的累计市值
 * @param recordsByMetalType 按类型分组的贵金属记录
 * @param month 目标月份（YYYY-MM格式）
 * @returns 各贵金属类型的市值映射
 */
export const calculateMonthlyMetalValues = (
  recordsByMetalType: RecordsByMetalType,
  month: string
): { [type: string]: number } => {
  const result: { [type: string]: number } = {};

  // 遍历每种贵金属类型
  Object.entries(recordsByMetalType).forEach(([type, records]) => {
    // 筛选到该月为止的所有记录
    const recordsUpToMonth = records.filter(r => r.date <= month);

    if (recordsUpToMonth.length === 0) {
      result[type] = 0;
      return;
    }

    // 计算累计克数
    const cumulativeGrams = calculateTotalGrams(recordsUpToMonth);

    // 如果没有累计克数，返回0
    if (cumulativeGrams === 0) {
      result[type] = 0;
      return;
    }

    // 获取该月的均价（从该月该类型的任意一条记录获取）
    let monthRecord = records.find(r => r.date === month);
    let averagePrice = monthRecord?.averagePrice;

    // 【修复】如果该月没有记录，使用最近有记录的月份的均价（前向填充）
    // 这样图表会保持前一个月的金额，而不是显示0
    if (!averagePrice) {
      // 获取截止到当前月的最新记录（按日期降序）
      const latestRecord = recordsUpToMonth.reduce((latest, r) =>
        r.date > latest.date ? r : latest
      );
      averagePrice = latestRecord?.averagePrice;
    }

    // 计算市值 = 累计克数 × 均价
    result[type] = cumulativeGrams * (averagePrice || 0);
  });

  return result;
};

/**
 * 计算指定月份的贵金属总市值（所有类型）
 * @param recordsByMetalType 按类型分组的贵金属记录
 * @param month 目标月份（YYYY-MM格式）
 * @returns 该月所有贵金属的总市值
 */
export const calculateTotalMetalValue = (
  recordsByMetalType: RecordsByMetalType,
  month: string
): number => {
  const monthlyValues = calculateMonthlyMetalValues(recordsByMetalType, month);
  return Object.values(monthlyValues).reduce((sum, value) => sum + value, 0);
};

/**
 * 获取指定月份的上月贵金属市值（如果上月为空则往前查找）
 * @param recordsByMetalType 按类型分组的贵金属记录
 * @param currentMonth 当前月份（YYYY-MM格式）
 * @returns 上月贵金属市值，如果找不到则返回0
 */
export const getPreviousMonthMetalValue = (
  recordsByMetalType: RecordsByMetalType,
  currentMonth: string
): number => {
  // 获取所有涉及到的月份
  const allMonths = new Set<string>();
  Object.values(recordsByMetalType).forEach(records => {
    records.forEach(r => allMonths.add(r.date));
  });

  const sortedMonths = Array.from(allMonths).sort();

  // 如果没有任何贵金属数据，返回0
  if (sortedMonths.length === 0) {
    return 0;
  }

  // 从上月开始往前查找，直到找到有数据的月份
  for (let i = 1; i <= 12; i++) {
    const searchDate = new Date(currentMonth + '-01');
    searchDate.setMonth(searchDate.getMonth() - i);
    const searchMonth = searchDate.toISOString().slice(0, 7);

    // 检查这个月份是否有贵金属数据
    const monthValue = calculateTotalMetalValue(recordsByMetalType, searchMonth);
    if (monthValue > 0) {
      return monthValue;
    }

    // 如果查到的月份早于所有有数据的月份，停止查找
    if (searchMonth < sortedMonths[0]) {
      break;
    }
  }

  // 找不到有数据的月份，返回0
  return 0;
};

/**
 * 获取上一个月份
 * @param month 当前月份（YYYY-MM格式）
 * @returns 上个月份（YYYY-MM格式）
 */
const getPreviousMonth = (month: string): string => {
  const date = new Date(month + '-01');
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
};

/**
 * 计算指定月份各贵金属类型的单月收益
 * @param recordsByMetalType 按类型分组的贵金属记录
 * @param month 目标月份（YYYY-MM格式）
 * @returns 各贵金属类型的单月收益映射
 *
 * 计算公式：
 * 单月收益 = 当月均价 × 当月累计克数 - 上月均价 × 上月累计克数 - 当月购买金额
 */
export const calculateMonthlyAccumulatedProfit = (
  recordsByMetalType: RecordsByMetalType,
  month: string
): { [type: string]: number } => {
  const result: { [type: string]: number } = {};

  // 遍历每种贵金属类型
  Object.entries(recordsByMetalType).forEach(([type, records]) => {
    // 1. 计算当月数据
    const currentMonthRecords = records.filter(r => r.date <= month);
    const currentMonthGrams = calculateTotalGrams(currentMonthRecords);

    // 2. 计算上月数据
    const previousMonth = getPreviousMonth(month);
    const previousMonthRecords = records.filter(r => r.date <= previousMonth);
    const previousMonthGrams = calculateTotalGrams(previousMonthRecords);

    // 3. 获取当月均价
    let currentMonthPrice = records.find(r => r.date === month)?.averagePrice;

    // 【修复】如果当月没有记录，直接返回0（不使用历史均价）
    if (!currentMonthPrice) {
      result[type] = 0;
      return;
    }

    // 4. 获取上月均价
    let previousMonthPrice = records.find(r => r.date === previousMonth)?.averagePrice;
    if (!previousMonthPrice && previousMonthRecords.length > 0) {
      const latestRecord = previousMonthRecords.reduce((latest, r) =>
        r.date > latest.date ? r : latest
      );
      previousMonthPrice = latestRecord.averagePrice;
    }

    // 5. 计算当月购买金额（仅当月）
    const thisMonthAmount = calculateTotalAmount(records.filter(r => r.date === month));

    // 6. 计算单月收益
    // 当月收益 = 当月市值 - 上月市值 - 当月投入
    const currentValue = currentMonthPrice * currentMonthGrams;
    const previousValue = (previousMonthPrice || 0) * previousMonthGrams;
    result[type] = currentValue - previousValue - thisMonthAmount;
  });

  return result;
};

/**
 * 计算指定月份各贵金属类型的累计收益
 * @param recordsByMetalType 按类型分组的贵金属记录
 * @param month 目标月份（YYYY-MM格式）
 * @returns 各贵金属类型的累计收益映射
 *
 * 计算公式：
 * 累计收益 = 当月均价 × 当月累计克数 - 累计购买金额
 */
export const calculateMonthlyTotalProfit = (
  recordsByMetalType: RecordsByMetalType,
  month: string
): { [type: string]: number } => {
  const result: { [type: string]: number } = {};

  Object.entries(recordsByMetalType).forEach(([type, records]) => {
    // 1. 筛选到该月为止的所有记录
    const recordsUpToMonth = records.filter(r => r.date <= month);

    if (recordsUpToMonth.length === 0) {
      result[type] = 0;
      return;
    }

    // 2. 计算累计克数
    const cumulativeGrams = calculateTotalGrams(recordsUpToMonth);

    // 3. 计算累计购买金额
    const cumulativeAmount = calculateTotalAmount(recordsUpToMonth);

    // 4. 获取该月的均价（从该月该类型的任意一条记录获取）
    let monthRecord = records.find(r => r.date === month);
    let averagePrice = monthRecord?.averagePrice;

    // 【修复】如果该月没有记录，直接返回0（不使用历史均价）
    // 这样图表只会显示有交易记录的月份
    if (!averagePrice) {
      result[type] = 0;
      return;
    }

    // 5. 计算累计收益 = 当前市值 - 累计购买金额
    result[type] = averagePrice * cumulativeGrams - cumulativeAmount;
  });

  return result;
};
