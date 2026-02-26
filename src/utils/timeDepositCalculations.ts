import { InvestmentRecord } from '@types/investment';

/**
 * 计算定期存款的月收益
 * 月收益 = 本金 × (年化利率 / 12)
 */
export const calculateTimeDepositMonthlyProfit = (
  principal: number,
  annualInterestRate: number
): number => {
  return principal * (annualInterestRate / 100 / 12);
};

/**
 * 计算到期日期
 */
export const calculateMaturityDate = (
  startDate: string,
  termMonths: number
): string => {
  const start = new Date(startDate + '-01');
  const maturityDate = new Date(start);
  maturityDate.setMonth(maturityDate.getMonth() + termMonths);
  return maturityDate.toISOString().slice(0, 7);
};

/**
 * 判断定期存款在指定月份是否已到期
 */
export const isTimeDepositMatured = (
  startDate: string,
  termMonths: number,
  targetMonth: string
): boolean => {
  const maturityDate = calculateMaturityDate(startDate, termMonths);
  return targetMonth >= maturityDate;
};

/**
 * 计算定期存款在指定月份的收益
 * 如果已到期，返回0
 */
export const calculateTimeDepositProfitForMonth = (
  record: InvestmentRecord,
  targetMonth: string
): number => {
  if (!record.isTimeDeposit || !record.depositTermMonths || !record.annualInterestRate) {
    return 0;
  }

  // 如果该月在起息日期之前，无收益
  if (targetMonth < record.date) {
    return 0;
  }

  // 如果已到期，无收益
  if (isTimeDepositMatured(record.date, record.depositTermMonths, targetMonth)) {
    return 0;
  }

  // 计算月收益
  return calculateTimeDepositMonthlyProfit(record.amount, record.annualInterestRate);
};

/**
 * 计算定期存款的整体收益（累计到指定月份）
 */
export const calculateTimeDepositTotalProfit = (
  record: InvestmentRecord,
  targetMonth: string
): number => {
  if (!record.isTimeDeposit || !record.depositTermMonths || !record.annualInterestRate) {
    return 0;
  }

  const start = new Date(record.date + '-01');
  const target = new Date(targetMonth + '-01');

  // 计算实际产生收益的月数
  let monthsPassed = (target.getFullYear() - start.getFullYear()) * 12 +
                     (target.getMonth() - start.getMonth());

  // 不超过存期
  const effectiveMonths = Math.min(monthsPassed, record.depositTermMonths);

  if (effectiveMonths <= 0) {
    return 0;
  }

  const monthlyProfit = calculateTimeDepositMonthlyProfit(record.amount, record.annualInterestRate);
  return monthlyProfit * effectiveMonths;
};

/**
 * 计算定期存款的平均月收益（总收益分摊到整个存期）
 * 平均月收益 = (本金 × 年化利率 × 存期年数) / 总月数
 */
export const calculateTimeDepositAverageMonthlyProfit = (
  record: InvestmentRecord
): number => {
  if (!record.isTimeDeposit || !record.depositTermMonths || !record.annualInterestRate) {
    return 0;
  }

  const principal = record.amount;
  const annualRate = record.annualInterestRate;
  const termMonths = record.depositTermMonths;
  const termYears = termMonths / 12;

  // 总收益 = 本金 × 年化利率 × 存期年数
  const totalProfit = principal * (annualRate / 100) * termYears;

  // 平均月收益 = 总收益 / 总月数
  return totalProfit / termMonths;
};
