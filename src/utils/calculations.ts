import { InvestmentRecord } from '../types/investment';

export const calculateTotalInvestment = (records: InvestmentRecord[]): number => {
  return records.reduce((sum, record) => sum + record.amount, 0);
};

export const calculateReturnRate = (
  investment: number,
  currentAssets: number
): number => {
  if (investment === 0) return 0;
  const profit = currentAssets - investment;
  return (profit / investment) * 100;
};
