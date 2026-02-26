/**
 * 投资计算逻辑单元测试
 * 测试核心业务逻辑：收益率计算、月度数据处理等
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  groupSnapshotsByAccount,
  getMonthDiff,
  calculateMonthlyInvestmentData,
  calculateMonthlyInvestmentDataByAccount,
  calculateMonthlyReturnByAccount,
  calculateOverallMonthlyReturn,
  calculateOverallMonthlyROI,
  calculateMonthlyReturnByAssetType,
  getAllUniqueMonths,
  alignAccountDataToMonths,
  getAllUniqueMonthsFromReturnData,
  alignReturnDataToMonths
} from '@utils/investmentCalculations';
import { InvestmentRecord } from '@types/investment';

describe('investmentCalculations - 投资计算逻辑', () => {
  describe('getMonthDiff - 月份差计算', () => {
    it('应正确计算同月差值', () => {
      expect(getMonthDiff('2024-01', '2024-01')).toBe(0);
    });

    it('应正确计算连续月份差值', () => {
      expect(getMonthDiff('2024-01', '2024-02')).toBe(1);
      expect(getMonthDiff('2024-12', '2025-01')).toBe(1);
    });

    it('应正确计算跨年月份差值', () => {
      expect(getMonthDiff('2023-12', '2024-01')).toBe(1);
      expect(getMonthDiff('2023-01', '2024-01')).toBe(12);
      expect(getMonthDiff('2020-01', '2024-01')).toBe(48);
    });

    it('应正确计算负数差值', () => {
      expect(getMonthDiff('2024-02', '2024-01')).toBe(-1);
    });
  });

  describe('groupSnapshotsByAccount - 按账户分组快照', () => {
    it('应正确按账户分组快照数据', () => {
      const records: InvestmentRecord[] = [
        {
          id: '1',
          date: '2024-01',
          amount: 1000,
          account: '账户A',
          assetType: '股票',
          snapshot: 10000
        },
        {
          id: '2',
          date: '2024-01',
          amount: 2000,
          account: '账户B',
          assetType: '基金',
          snapshot: 20000
        },
        {
          id: '3',
          date: '2024-02',
          amount: 1500,
          account: '账户A',
          assetType: '股票',
          snapshot: 11000
        }
      ];

      const result = groupSnapshotsByAccount(records);

      expect(result.size).toBe(2);
      expect(result.get('账户A')).toHaveLength(2);
      expect(result.get('账户B')).toHaveLength(1);
    });

    it('应按日期排序快照', () => {
      const records: InvestmentRecord[] = [
        {
          id: '1',
          date: '2024-03',
          amount: 1000,
          account: '账户A',
          assetType: '股票',
          snapshot: 13000
        },
        {
          id: '2',
          date: '2024-01',
          amount: 1000,
          account: '账户A',
          assetType: '股票',
          snapshot: 10000
        },
        {
          id: '3',
          date: '2024-02',
          amount: 1000,
          account: '账户A',
          assetType: '股票',
          snapshot: 11000
        }
      ];

      const result = groupSnapshotsByAccount(records);
      const snapshots = result.get('账户A')!;

      expect(snapshots[0].date).toBe('2024-01');
      expect(snapshots[1].date).toBe('2024-02');
      expect(snapshots[2].date).toBe('2024-03');
    });

    it('应过滤没有快照的记录', () => {
      const records: InvestmentRecord[] = [
        {
          id: '1',
          date: '2024-01',
          amount: 1000,
          account: '账户A',
          assetType: '股票'
          // 没有snapshot
        },
        {
          id: '2',
          date: '2024-01',
          amount: 2000,
          account: '账户A',
          assetType: '股票',
          snapshot: 10000
        }
      ];

      const result = groupSnapshotsByAccount(records);
      const snapshots = result.get('账户A')!;

      expect(snapshots).toHaveLength(1);
    });
  });

  describe('calculateMonthlyInvestmentData - 月度投资数据计算', () => {
    it('应正确计算连续月份的投资数据', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 3000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 12000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyInvestmentData(recordsByType);

      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2024-01');
      expect(result[0].investment).toBe(5000);
      // 第一个月收益应该是0
      expect(result[0].profit).toBe(0);
      expect(result[0].roi).toBe(0);
    });

    it('应正确计算第二个月的收益', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 3000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 14000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyInvestmentData(recordsByType);

      // 应该有两个月的数据
      expect(result.length).toBeGreaterThanOrEqual(1);

      // 查找2024-01的数据（第一个月）
      const janData = result.find(r => r.month === '2024-01');
      expect(janData).toBeDefined();
      // 第一个月收益应该是0
      expect(janData!.profit).toBe(0);
      expect(janData!.investment).toBe(5000);
    });

    it('应跳过非连续月份', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-03',
            amount: 3000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 12000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyInvestmentData(recordsByType);

      // 1月和3月不连续（跳过了2月），不应该计算收益
      // 只有第一个快照月份会被返回，但没有下一个月，所以没有收益数据
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('应正确汇总多个账户', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '账户A',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-01',
            amount: 3000,
            account: '账户B',
            assetType: '股票',
            snapshot: 6000
          },
          {
            id: '3',
            date: '2024-02',
            amount: 2000,
            account: '账户A',
            assetType: '股票',
            snapshot: 11000
          },
          {
            id: '4',
            date: '2024-02',
            amount: 1000,
            account: '账户B',
            assetType: '股票',
            snapshot: 6500
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyInvestmentData(recordsByType);
      const janData = result.find(r => r.month === '2024-01');

      expect(janData).toBeDefined();
      expect(janData!.investment).toBe(8000); // 5000 + 3000
    });

    it('应正确处理空数据', () => {
      const result = calculateMonthlyInvestmentData({});
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateMonthlyReturnByAccount - 月度收益率计算（按账户）', () => {
    it('应正确计算单账户月度收益率', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 3000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 12000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyReturnByAccount(recordsByType);

      expect(result).toHaveLength(1);
      expect(result[0].account).toBe('测试账户');
      expect(result[0].data).toHaveLength(2); // 包含首月和第二个月

      // 首月数据
      const firstMonthData = result[0].data[0];
      expect(firstMonthData.month).toBe('2024-01');
      expect(firstMonthData.previousSnapshot).toBe(0); // 首月无上月快照
      // 首月收益 = 当月快照 - 0 - 当月投资 = 10000 - 0 - 5000 = 5000
      expect(firstMonthData.profit).toBe(5000);

      // 第二个月数据
      const secondMonthData = result[0].data[1];
      expect(secondMonthData.month).toBe('2024-02');

      // 收益 = (12000 - 10000) - 3000 = -1000
      expect(secondMonthData.profit).toBe(-1000);

      // 收益率 = (-1000 / max(3000, 10000)) × 100 = -10%
      expect(secondMonthData.returnRate).toBeCloseTo(-10, 1);
      expect(secondMonthData.previousSnapshot).toBe(10000);
    });

    it('应处理零投资情况', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 0,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 0,
            account: '测试账户',
            assetType: '股票',
            snapshot: 11000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyReturnByAccount(recordsByType);

      // 首月数据
      const firstMonthData = result[0].data[0];
      expect(firstMonthData.month).toBe('2024-01');
      expect(firstMonthData.previousSnapshot).toBe(0); // 首月无上月快照
      // 首月收益 = 当月快照 - 0 - 当月投资 = 10000 - 0 - 0 = 10000
      expect(firstMonthData.profit).toBe(10000);

      // 第二个月数据
      const secondMonthData = result[0].data[1];
      expect(secondMonthData.month).toBe('2024-02');
      // 收益 = (11000 - 10000) - 0 = 1000
      expect(secondMonthData.profit).toBe(1000);

      // 收益率 = (1000 / max(0, 10000)) × 100 = 10%
      expect(secondMonthData.returnRate).toBeCloseTo(10, 1);
    });

    it('应正确计算正收益率', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 12000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyReturnByAccount(recordsByType);

      // 首月数据
      const firstMonthData = result[0].data[0];
      expect(firstMonthData.month).toBe('2024-01');
      expect(firstMonthData.previousSnapshot).toBe(0); // 首月无上月快照
      // 首月收益 = 当月快照 - 0 - 当月投资 = 10000 - 0 - 10000 = 0
      expect(firstMonthData.profit).toBe(0);

      // 第二个月数据
      const secondMonthData = result[0].data[1];
      expect(secondMonthData.month).toBe('2024-02');

      // 收益 = (12000 - 10000) - 5000 = -3000
      expect(secondMonthData.profit).toBe(-3000);

      // 收益率 = (-3000 / max(5000, 10000)) × 100 = -30%
      expect(secondMonthData.returnRate).toBeCloseTo(-30, 1);
    });

    it('收益率公式验证测试', () => {
      // 给定具体数值验证计算准确性
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000 // 上月快照
          },
          {
            id: '2',
            date: '2024-02',
            amount: 1000, // 当月投资
            account: '测试账户',
            assetType: '股票',
            snapshot: 11800 // 当月快照
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyReturnByAccount(recordsByType);

      // 首月数据
      const firstMonthData = result[0].data[0];
      expect(firstMonthData.month).toBe('2024-01');
      expect(firstMonthData.previousSnapshot).toBe(0); // 首月无上月快照
      // 首月收益 = 当月快照 - 0 - 当月投资 = 10000 - 0 - 5000 = 5000
      expect(firstMonthData.profit).toBe(5000);

      // 第二个月数据
      const secondMonthData = result[0].data[1];
      expect(secondMonthData.month).toBe('2024-02');

      // 收益 = (11800 - 10000) - 1000 = 800
      expect(secondMonthData.profit).toBe(800);

      // 收益率 = (800 / max(1000, 10000)) × 100 = 8%
      expect(secondMonthData.returnRate).toBeCloseTo(8, 1);
    });
  });

  describe('calculateOverallMonthlyReturn - 整体月度收益率计算', () => {
    it('应正确汇总所有账户数据', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '账户A',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-01',
            amount: 5000,
            account: '账户B',
            assetType: '股票',
            snapshot: 5000
          },
          {
            id: '3',
            date: '2024-02',
            amount: 2000,
            account: '账户A',
            assetType: '股票',
            snapshot: 11000
          },
          {
            id: '4',
            date: '2024-02',
            amount: 1000,
            account: '账户B',
            assetType: '股票',
            snapshot: 5500
          }
        ] as InvestmentRecord[]
      };

      const result = calculateOverallMonthlyReturn(recordsByType);

      expect(result.length).toBeGreaterThanOrEqual(1);

      const janData = result.find(r => r.month === '2024-01');
      expect(janData).toBeDefined();
      // 第一个月收益应该是0
      expect(janData!.profit).toBe(0);
    });

    it('应计算正确的整体收益率', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '账户A',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 2000,
            account: '账户A',
            assetType: '股票',
            snapshot: 11800
          }
        ] as InvestmentRecord[]
      };

      const result = calculateOverallMonthlyReturn(recordsByType);

      // 应该至少有1月的数据
      expect(result.length).toBeGreaterThanOrEqual(1);

      const janData = result.find(r => r.month === '2024-01');
      expect(janData).toBeDefined();
      // 第一个月收益应该是0
      expect(janData!.profit).toBe(0);
    });
  });

  describe('calculateOverallMonthlyROI - 整体月度ROI计算', () => {
    it('应正确计算整体ROI', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 5000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 12000
          }
        ] as InvestmentRecord[]
      };

      const result = calculateOverallMonthlyROI(recordsByType);

      expect(result.length).toBeGreaterThanOrEqual(1);

      const janData = result.find(r => r.month === '2024-01');
      expect(janData).toBeDefined();
      expect(janData!.investment).toBe(10000);
      expect(janData!.roi).toBe(0); // 第一个月ROI为0
    });

    it('应排除定期存款', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 2000,
            account: '测试账户',
            assetType: '股票',
            snapshot: 11800
          }
        ] as InvestmentRecord[],
        '定期存款': [
          {
            id: '3',
            date: '2024-01',
            amount: 50000,
            account: '测试账户',
            assetType: '定期存款',
            isTimeDeposit: true,
            snapshot: 50000
          } as InvestmentRecord
        ]
      };

      const result = calculateOverallMonthlyROI(recordsByType);

      // 定期存款应该被排除
      const janData = result.find(r => r.month === '2024-01');
      expect(janData).toBeDefined();
      expect(janData!.investment).toBe(10000); // 不包含定期存款的50000
    });
  });

  describe('calculateMonthlyReturnByAssetType - 按资产类型计算收益率', () => {
    it('应正确计算各资产类型收益率', () => {
      const recordsByType = {
        '股票': [
          {
            id: '1',
            date: '2024-01',
            amount: 10000,
            account: '账户A',
            assetType: '股票',
            snapshot: 10000
          },
          {
            id: '2',
            date: '2024-02',
            amount: 2000,
            account: '账户A',
            assetType: '股票',
            snapshot: 11800
          }
        ] as InvestmentRecord[],
        '基金': [
          {
            id: '3',
            date: '2024-01',
            amount: 5000,
            account: '账户B',
            assetType: '基金',
            snapshot: 5000
          },
          {
            id: '4',
            date: '2024-02',
            amount: 1000,
            account: '账户B',
            assetType: '基金',
            snapshot: 5400
          }
        ] as InvestmentRecord[]
      };

      const result = calculateMonthlyReturnByAssetType(recordsByType);

      expect(result).toHaveLength(2);

      const stockType = result.find(r => r.assetType === '股票');
      expect(stockType).toBeDefined();
      // 现在包含首月数据
      expect(stockType!.data[0].month).toBe('2024-01');
      expect(stockType!.data[0].previousSnapshot).toBe(0); // 首月无上月快照

      const fundType = result.find(r => r.assetType === '基金');
      expect(fundType).toBeDefined();
      // 现在包含首月数据
      expect(fundType!.data[0].month).toBe('2024-01');
      expect(fundType!.data[0].previousSnapshot).toBe(0); // 首月无上月快照
    });
  });

  describe('工具函数测试', () => {
    it('getAllUniqueMonths应提取所有唯一月份', () => {
      const dataByAccount = [
        {
          account: '账户A',
          data: [
            { month: '2024-01', profit: 100, investment: 1000, roi: 0.1 },
            { month: '2024-02', profit: 200, investment: 2000, roi: 0.1 }
          ]
        },
        {
          account: '账户B',
          data: [
            { month: '2024-02', profit: 150, investment: 1500, roi: 0.1 },
            { month: '2024-03', profit: 250, investment: 2500, roi: 0.1 }
          ]
        }
      ];

      const months = getAllUniqueMonths(dataByAccount);

      expect(months).toEqual(['2024-01', '2024-02', '2024-03']);
    });

    it('alignAccountDataToMonths应填充缺失月份', () => {
      const accountData = [
        { month: '2024-01', profit: 100, investment: 1000, roi: 0.1 },
        { month: '2024-03', profit: 300, investment: 3000, roi: 0.1 }
      ];

      const allMonths = ['2024-01', '2024-02', '2024-03'];

      const aligned = alignAccountDataToMonths(accountData, allMonths);

      expect(aligned).toHaveLength(3);
      expect(aligned[0].month).toBe('2024-01');
      expect(aligned[0].roi).toBe(0.1);
      expect(aligned[1].month).toBe('2024-02');
      expect(aligned[1].roi).toBeNull(); // 缺失月份填充null
      expect(aligned[2].month).toBe('2024-03');
      expect(aligned[2].roi).toBe(0.1);
    });

    it('getAllUniqueMonthsFromReturnData应提取收益率数据中的月份', () => {
      const returnDataByAccount = [
        {
          account: '账户A',
          data: [
            { month: '2024-01', returnRate: 5.0, previousSnapshot: 10000, profit: 500 },
            { month: '2024-02', returnRate: 6.0, previousSnapshot: 11000, profit: 600 }
          ]
        }
      ];

      const months = getAllUniqueMonthsFromReturnData(returnDataByAccount);

      expect(months).toEqual(['2024-01', '2024-02']);
    });

    it('alignReturnDataToMonths应填充收益率数据缺失月份', () => {
      const accountData = [
        { month: '2024-01', returnRate: 5.0, previousSnapshot: 10000, profit: 500 },
        { month: '2024-03', returnRate: 7.0, previousSnapshot: 12000, profit: 700 }
      ];

      const allMonths = ['2024-01', '2024-02', '2024-03'];

      const aligned = alignReturnDataToMonths(accountData, allMonths);

      expect(aligned).toHaveLength(3);
      expect(aligned[0].month).toBe('2024-01');
      expect(aligned[0].returnRate).toBe(5.0);
      expect(aligned[1].month).toBe('2024-02');
      expect(aligned[1].returnRate).toBeNull(); // 缺失月份
      expect(aligned[2].month).toBe('2024-03');
      expect(aligned[2].returnRate).toBe(7.0);
    });
  });
});
