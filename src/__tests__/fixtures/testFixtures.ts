import { InvestmentRecord } from '@types/investment';
import { PreciousMetalRecord } from '@types/preciousMetal';

/**
 * 预定义的测试数据集
 * Predefined test data sets
 */

export const TestFixtures = {
  /**
   * 简单3个月场景
   * Simple 3-month scenario
   */
  simple3Month: {
    investments: [
      {
        id: 'inv-1',
        type: '股票',
        account: '测试账户',
        date: '2024-01',
        amount: '10000',
        snapshot: '10000',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'inv-2',
        type: '股票',
        account: '测试账户',
        date: '2024-02',
        amount: '10000',
        snapshot: '11000',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      },
      {
        id: 'inv-3',
        type: '股票',
        account: '测试账户',
        date: '2024-03',
        amount: '10000',
        snapshot: '12000',
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z'
      }
    ] as InvestmentRecord[],
    expected: {
      profits: {
        '2024-01': 0, // 首月，无上月快照
        '2024-02': 11000 - 10000 - 10000, // -9000
        '2024-03': 12000 - 11000 - 10000 // -9000
      },
      rois: {
        '2024-01': 0,
        '2024-02': ((11000 - 10000 - 10000) / 10000) * 100, // -90%
        '2024-03': ((12000 - 11000 - 10000) / 10000) * 100 // -90%
      }
    }
  },

  /**
   * 日期筛选关键测试场景
   * Date filtering critical test case
   */
  dateFilterCritical: {
    allData: Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        id: `inv-${i}`,
        type: '股票',
        account: '测试账户',
        date: `2024-${month.toString().padStart(2, '0')}`,
        amount: (10000 * (1 + 0.05 * i)).toFixed(2),
        snapshot: (10000 * Math.pow(1.05, i + 1)).toFixed(2),
        createdAt: `2024-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`,
        updatedAt: `2024-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`
      };
    }) as InvestmentRecord[],
    filterRange: { start: '2024-06', end: '2024-08' },
    // 第6个月使用01-06月数据计算
    expectedMonth6Profit: 10000 * Math.pow(1.05, 6) - 10000 * Math.pow(1.05, 5) - 10000 * (1 + 0.05 * 5),
    expectedMonth7Profit: 10000 * Math.pow(1.05, 7) - 10000 * Math.pow(1.05, 6) - 10000 * (1 + 0.05 * 6),
    expectedMonth8Profit: 10000 * Math.pow(1.05, 8) - 10000 * Math.pow(1.05, 7) - 10000 * (1 + 0.05 * 7),
    expectedDisplayedMonths: ['2024-06', '2024-07', '2024-08']
  },

  /**
   * 多账户场景
   * Multi-account scenario
   */
  multiAccount: {
    accounts: ['账户A', '账户B', '账户C'],
    data: [
      // 账户A
      {
        id: 'inv-a1',
        type: '股票',
        account: '账户A',
        date: '2024-01',
        amount: '10000',
        snapshot: '10000',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'inv-a2',
        type: '股票',
        account: '账户A',
        date: '2024-02',
        amount: '10000',
        snapshot: '11000',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      },
      // 账户B
      {
        id: 'inv-b1',
        type: '基金',
        account: '账户B',
        date: '2024-01',
        amount: '20000',
        snapshot: '20000',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'inv-b2',
        type: '基金',
        account: '账户B',
        date: '2024-02',
        amount: '20000',
        snapshot: '22000',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      },
      // 账户C
      {
        id: 'inv-c1',
        type: '债券',
        account: '账户C',
        date: '2024-01',
        amount: '15000',
        snapshot: '15000',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'inv-c2',
        type: '债券',
        account: '账户C',
        date: '2024-02',
        amount: '15000',
        snapshot: '16000',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      }
    ] as InvestmentRecord[],
    expected: {
      aggregated: {
        '2024-01': 0,
        '2024-02':
          (11000 - 10000 - 10000) + // 账户A收益
          (22000 - 20000 - 20000) + // 账户B收益
          (16000 - 15000 - 15000) // 账户C收益
      },
      perAccount: {
        '账户A': {
          '2024-02': -9000
        },
        '账户B': {
          '2024-02': -18000
        },
        '账户C': {
          '2024-02': -14000
        }
      }
    }
  },

  /**
   * 贵金属测试数据
   * Precious metal test data
   */
  preciousMetal: {
    metals: [
      {
        id: 'metal-1',
        metalType: '黄金',
        date: '2024-01',
        grams: 10,
        pricePerGram: '500.00',
        averagePrice: '500.00',
        totalAmount: '5000.00',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'metal-2',
        metalType: '黄金',
        date: '2024-02',
        grams: 10,
        pricePerGram: '510.00',
        averagePrice: '510.00',
        totalAmount: '5100.00',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      },
      {
        id: 'metal-3',
        metalType: '黄金',
        date: '2024-03',
        grams: 10,
        pricePerGram: '520.00',
        averagePrice: '520.00',
        totalAmount: '5200.00',
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z'
      }
    ] as PreciousMetalRecord[],
    expected: {
      monthlyProfits: {
        '2024-01': 0, // 首月，收益为0
        '2024-02': 20 * 510 - 10 * 500 - 5100, // 10200 - 5000 - 5100 = 100
        '2024-03': 30 * 520 - 20 * 510 - 5200 // 15600 - 10200 - 5200 = 200
      }
    }
  },

  /**
   * 边界情况
   * Edge cases
   */
  edgeCases: {
    /**
     * 首月（无上月快照）
     */
    firstMonth: {
      investments: [
        {
          id: 'inv-first',
          type: '股票',
          account: '测试账户',
          date: '2024-01',
          amount: '10000',
          snapshot: '10000',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ] as InvestmentRecord[],
      expected: {
        profit: 0, // 首月收益为0
        roi: 0,
        returnRate: 0
      }
    },

    /**
     * 月份不连续（有gap）
     */
    gapInData: {
      investments: [
        {
          id: 'inv-gap-1',
          type: '股票',
          account: '测试账户',
          date: '2024-01',
          amount: '10000',
          snapshot: '10000',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'inv-gap-2',
          type: '股票',
          account: '测试账户',
          date: '2024-02',
          amount: '10000',
          snapshot: '11000',
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z'
        },
        {
          id: 'inv-gap-3',
          type: '股票',
          account: '测试账户',
          date: '2024-05', // 03-04月缺失
          amount: '10000',
          snapshot: '12000',
          createdAt: '2024-05-01T00:00:00.000Z',
          updatedAt: '2024-05-01T00:00:00.000Z'
        }
      ] as InvestmentRecord[],
      expected: {
        // 2024-02: 11000 - 10000 - 10000 = -9000
        '2024-02': -9000,
        // 2024-05应该与2024-02不连续，可能不计算或特殊处理
        // 根据实际实现逻辑决定
      }
    },

    /**
     * 投资金额为0（使用上月快照计算收益率）
     */
    zeroInvestment: {
      investments: [
        {
          id: 'inv-zero-1',
          type: '股票',
          account: '测试账户',
          date: '2024-01',
          amount: '10000',
          snapshot: '10000',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'inv-zero-2',
          type: '股票',
          account: '测试账户',
          date: '2024-02',
          amount: '0', // 无投资
          snapshot: '10500', // 但快照增加了
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z'
        }
      ] as InvestmentRecord[],
      expected: {
        profit: 10500 - 10000 - 0, // 500
        roi: 0, // 投资为0，ROI为0或不计算
        returnRate: (500 / 10000) * 100 // 5%，使用上月快照作为分母
      }
    },

    /**
     * 负收益（亏损）
     */
    negativeProfit: {
      investments: [
        {
          id: 'inv-neg-1',
          type: '股票',
          account: '测试账户',
          date: '2024-01',
          amount: '10000',
          snapshot: '10000',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'inv-neg-2',
          type: '股票',
          account: '测试账户',
          date: '2024-02',
          amount: '5000',
          snapshot: '12000', // 快照增加
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z'
        }
      ] as InvestmentRecord[],
      expected: {
        profit: 12000 - 10000 - 5000, // -3000，负收益
        roi: (-3000 / 5000) * 100, // -60%
        returnRate: (-3000 / 10000) * 100 // -30%
      }
    }
  }
};
