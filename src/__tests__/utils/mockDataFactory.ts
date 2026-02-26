import { InvestmentRecord } from '@types/investment';
import { PreciousMetalRecord } from '@types/preciousMetal';

/**
 * Mock数据工厂 - 用于创建测试数据
 */
export class MockDataFactory {
  /**
   * 创建投资记录
   */
  static createInvestmentRecords(config: {
    accounts: string[];
    assetTypes: string[];
    months: string[];
    baseAmount?: number;
    growthRate?: number; // 每月增长百分比
    includeSnapshots?: boolean;
    includeTimeDeposits?: boolean;
  }): InvestmentRecord[] {
    const {
      accounts,
      assetTypes,
      months,
      baseAmount = 10000,
      growthRate = 0.05,
      includeSnapshots = true,
      includeTimeDeposits = false
    } = config;

    const records: InvestmentRecord[] = [];
    let idCounter = 1;

    // 为每个账户、每种资产类型、每个月创建记录
    accounts.forEach((account) => {
      assetTypes.forEach((assetType) => {
        let cumulativeAmount = 0;
        let snapshotAmount = baseAmount;

        months.forEach((month, index) => {
          const monthlyAmount = baseAmount * (1 + growthRate * index);
          cumulativeAmount += monthlyAmount;

          // 投资记录
          records.push({
            id: `inv-${idCounter++}`,
            type: assetType,
            account,
            date: month,
            amount: monthlyAmount.toFixed(2),
            snapshot: includeSnapshots ? snapshotAmount.toFixed(2) : undefined,
            timeDepositRate: assetType === '定期存款' && includeTimeDeposits ? '3.0' : undefined,
            timeDepositMaturity: assetType === '定期存款' && includeTimeDeposits ? '2025-12-31' : undefined,
            shares: assetType === '股票' ? (100 * (index + 1)).toFixed(4) : undefined,
            sharePrice: assetType === '股票' ? (monthlyAmount / (100 * (index + 1))).toFixed(2) : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // 更新快照金额（模拟增长）
          snapshotAmount = snapshotAmount * (1 + growthRate);
        });
      });
    });

    return records;
  }

  /**
   * 创建贵金属记录
   */
  static createMetalRecords(config: {
    metalTypes: string[];
    months: string[];
    baseGrams?: number;
    priceTrend?: 'up' | 'down' | 'volatile';
    basePrice?: number;
  }): PreciousMetalRecord[] {
    const {
      metalTypes,
      months,
      baseGrams = 10,
      priceTrend = 'up',
      basePrice = 500
    } = config;

    const records: PreciousMetalRecord[] = [];
    let idCounter = 1;

    metalTypes.forEach((metalType) => {
      let currentPrice = basePrice;
      let cumulativeGrams = 0;

      months.forEach((month, index) => {
        // 计算价格趋势
        if (priceTrend === 'up') {
          currentPrice = currentPrice * 1.02; // 每月上涨2%
        } else if (priceTrend === 'down') {
          currentPrice = currentPrice * 0.98; // 每月下跌2%
        } else {
          // volatile - 波动
          currentPrice = index % 2 === 0 ? currentPrice * 1.05 : currentPrice * 0.95;
        }

        cumulativeGrams += baseGrams;

        records.push({
          id: `metal-${idCounter++}`,
          metalType,
          date: month,
          grams: baseGrams,
          pricePerGram: currentPrice.toFixed(2),
          averagePrice: currentPrice.toFixed(2),
          totalAmount: (baseGrams * currentPrice).toFixed(2),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    });

    return records;
  }

  /**
   * 创建日期筛选关键测试场景
   * 这是防止bug重现的最重要测试用例
   */
  static createDateFilterCriticalCase(): {
    allData: InvestmentRecord[];
    filterRange: { start: string; end: string };
    expectedResults: {
      month6Profit: number; // 使用01-06月数据计算
      month7Profit: number; // 使用01-07月数据计算
      month8Profit: number; // 使用01-08月数据计算
    };
  } {
    // 创建12个月数据 (2024-01 到 2024-12)
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return `2024-${month.toString().padStart(2, '0')}`;
    });

    const allData = this.createInvestmentRecords({
      accounts: ['测试账户'],
      assetTypes: ['股票'],
      months,
      baseAmount: 10000,
      growthRate: 0.05,
      includeSnapshots: true
    });

    // 计算预期收益
    // 月度收益 = (当月快照 - 上月快照 - 当月投资)
    // 第6个月收益应该使用01-06月的所有数据计算
    const month6Investment = 10000 * (1 + 0.05 * 5); // 6月投资
    const month6Snapshot = 10000 * Math.pow(1.05, 6); // 6月快照
    const month5Snapshot = 10000 * Math.pow(1.05, 5); // 5月快照
    const month6Profit = month6Snapshot - month5Snapshot - month6Investment;

    const month7Investment = 10000 * (1 + 0.05 * 6);
    const month7Snapshot = 10000 * Math.pow(1.05, 7);
    const month6Snapshot2 = 10000 * Math.pow(1.05, 6);
    const month7Profit = month7Snapshot - month6Snapshot2 - month7Investment;

    const month8Investment = 10000 * (1 + 0.05 * 7);
    const month8Snapshot = 10000 * Math.pow(1.05, 8);
    const month7Snapshot2 = 10000 * Math.pow(1.05, 7);
    const month8Profit = month8Snapshot - month7Snapshot2 - month8Investment;

    return {
      allData,
      filterRange: { start: '2024-06', end: '2024-08' },
      expectedResults: {
        month6Profit: parseFloat(month6Profit.toFixed(2)),
        month7Profit: parseFloat(month7Profit.toFixed(2)),
        month8Profit: parseFloat(month8Profit.toFixed(2))
      }
    };
  }

  /**
   * 创建12个月完整场景
   */
  static create12MonthScenario(): {
    investments: InvestmentRecord[];
    metals: PreciousMetalRecord[];
    expectedResults: {
      monthlyProfits: Map<string, number>;
      returnRates: Map<string, number>;
      rois: Map<string, number>;
    };
  } {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return `2024-${month.toString().padStart(2, '0')}`;
    });

    const investments = this.createInvestmentRecords({
      accounts: ['账户A', '账户B'],
      assetTypes: ['股票', '基金'],
      months,
      baseAmount: 10000,
      growthRate: 0.05,
      includeSnapshots: true
    });

    const metals = this.createMetalRecords({
      metalTypes: ['黄金'],
      months,
      baseGrams: 10,
      priceTrend: 'up',
      basePrice: 500
    });

    // 计算预期结果
    const monthlyProfits = new Map<string, number>();
    const returnRates = new Map<string, number>();
    const rois = new Map<string, number>();

    months.forEach((month, index) => {
      if (index === 0) {
        monthlyProfits.set(month, 0);
        returnRates.set(month, 0);
        rois.set(month, 0);
      } else {
        const investment = 10000 * (1 + 0.05 * index);
        const snapshot = 10000 * Math.pow(1.05, index + 1);
        const prevSnapshot = 10000 * Math.pow(1.05, index);
        const profit = snapshot - prevSnapshot - investment;
        const roi = investment > 0 ? (profit / investment) * 100 : 0;
        const returnRate = prevSnapshot > 0 ? (profit / prevSnapshot) * 100 : 0;

        monthlyProfits.set(month, parseFloat(profit.toFixed(2)));
        returnRates.set(month, parseFloat(returnRate.toFixed(2)));
        rois.set(month, parseFloat(roi.toFixed(2)));
      }
    });

    return {
      investments,
      metals,
      expectedResults: {
        monthlyProfits,
        returnRates,
        rois
      }
    };
  }

  /**
   * 创建边界情况测试数据
   */
  static createEdgeCases(): {
    firstMonth: InvestmentRecord[];
    gapInData: InvestmentRecord[];
    zeroInvestment: InvestmentRecord[];
    negativeProfit: InvestmentRecord[];
  } {
    // 首月（无上月快照）
    const firstMonth = this.createInvestmentRecords({
      accounts: ['测试账户'],
      assetTypes: ['股票'],
      months: ['2024-01'],
      baseAmount: 10000,
      includeSnapshots: true
    });

    // 月份不连续（有gap）
    const gapInData = this.createInvestmentRecords({
      accounts: ['测试账户'],
      assetTypes: ['股票'],
      months: ['2024-01', '2024-02', '2024-05', '2024-06'], // 03-04月缺失
      baseAmount: 10000,
      includeSnapshots: true
    });

    // 投资为0（无投资但有快照变化）
    const zeroInvestment: InvestmentRecord[] = [
      {
        id: 'inv-zero-1',
        type: '股票',
        account: '测试账户',
        date: '2024-01',
        amount: '10000',
        snapshot: '10000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-zero-2',
        type: '股票',
        account: '测试账户',
        date: '2024-02',
        amount: '0', // 无投资
        snapshot: '10500', // 但快照增加了
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 负收益（亏损）
    const negativeProfit: InvestmentRecord[] = [
      {
        id: 'inv-neg-1',
        type: '股票',
        account: '测试账户',
        date: '2024-01',
        amount: '10000',
        snapshot: '10000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-neg-2',
        type: '股票',
        account: '测试账户',
        date: '2024-02',
        amount: '5000',
        snapshot: '12000', // 快照减少，导致负收益
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return {
      firstMonth,
      gapInData,
      zeroInvestment,
      negativeProfit
    };
  }
}
