/**
 * 贵金属计算逻辑单元测试
 * 测试贵金属投资的核心计算逻辑
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTotalGrams,
  calculateTotalAmount,
  calculateMonthlyProfit,
  calculateTotalProfit,
  calculateMetalStats,
  calculateMonthlyMetalValues,
  calculateTotalMetalValue,
  getPreviousMonthMetalValue,
  calculateMonthlyAccumulatedProfit,
  calculateMonthlyTotalProfit
} from '@utils/metalCalculations';
import { PreciousMetalRecord, RecordsByMetalType } from '@types/preciousMetal';

describe('metalCalculations - 贵金属计算逻辑', () => {
  describe('calculateTotalGrams - 累计克数计算', () => {
    it('应正确计算累计购买克数', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 10,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 20,
          pricePerGram: 510,
          averagePrice: 510
        },
        {
          id: '3',
          date: '2024-03',
          metalType: '黄金',
          grams: 15.5,
          pricePerGram: 520,
          averagePrice: 520
        }
      ];

      const result = calculateTotalGrams(records);
      expect(result).toBe(45.5); // 10 + 20 + 15.5
    });

    it('空数据应返回0', () => {
      expect(calculateTotalGrams([])).toBe(0);
    });
  });

  describe('calculateTotalAmount - 累计金额计算', () => {
    it('应正确计算累计购买金额', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 10,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 20,
          pricePerGram: 510,
          averagePrice: 510
        }
      ];

      const result = calculateTotalAmount(records);
      expect(result).toBe(15200); // 10*500 + 20*510
    });

    it('应正确处理小数', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '白银',
          grams: 100.5,
          pricePerGram: 5.5,
          averagePrice: 5.5
        }
      ];

      const result = calculateTotalAmount(records);
      expect(result).toBe(552.75); // 100.5 * 5.5
    });
  });

  describe('calculateTotalProfit - 整体收益计算', () => {
    it('应正确计算整体收益', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 520
        }
      ];

      const result = calculateTotalProfit(records);

      // 累计克数 = 100 + 50 = 150克
      // 累计金额 = 100*500 + 50*510 = 50000 + 25500 = 75500
      // 当前市值 = 520 * 150 = 78000
      // 整体收益 = 78000 - 75500 = 2500
      expect(result).toBe(2500);
    });

    it('应正确处理亏损情况', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 480 // 价格下跌
        }
      ];

      const result = calculateTotalProfit(records);

      // 当前市值 = 480 * 150 = 72000
      // 整体收益 = 72000 - 75500 = -3500
      expect(result).toBe(-3500);
    });

    it('空数据应返回0', () => {
      expect(calculateTotalProfit([])).toBe(0);
    });
  });

  describe('calculateMonthlyProfit - 月度收益计算', () => {
    it('应正确分摊月度收益', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 520
        }
      ];

      const result = calculateMonthlyProfit(records);

      // 整体收益 = 2500
      // 非重复月份数量 = 2（1月和2月）
      // 月度收益 = 2500 / 2 = 1250
      expect(result).toBe(1250);
    });

    it('单个月份应返回整体收益', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 520
        }
      ];

      const result = calculateMonthlyProfit(records);

      // 整体收益 = 520 * 100 - 50000 = 2000
      // 月度收益 = 2000 / 1 = 2000
      expect(result).toBe(2000);
    });

    it('同一月份的多笔记录应算作一个月', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-01',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 510
        }
      ];

      const result = calculateMonthlyProfit(records);

      // 非重复月份数量 = 1
      const totalProfit = calculateTotalProfit(records);
      expect(result).toBe(totalProfit);
    });
  });

  describe('calculateMetalStats - 综合统计计算', () => {
    it('应正确计算综合统计', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 520
        }
      ];

      const stats = calculateMetalStats(records);

      expect(stats.totalGrams).toBe(150);
      expect(stats.totalAmount).toBe(75500);
      expect(stats.currentValue).toBe(78000);
      expect(stats.totalProfit).toBe(2500);
      expect(stats.monthlyProfit).toBe(1250);
    });

    it('应根据月份筛选数据', () => {
      const records: PreciousMetalRecord[] = [
        {
          id: '1',
          date: '2024-01',
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500
        },
        {
          id: '2',
          date: '2024-02',
          metalType: '黄金',
          grams: 50,
          pricePerGram: 510,
          averagePrice: 520
        },
        {
          id: '3',
          date: '2024-03',
          metalType: '黄金',
          grams: 30,
          pricePerGram: 530,
          averagePrice: 540
        }
      ];

      const stats = calculateMetalStats(records, '2024-02');

      // 只包含2024-01和2024-02的数据
      expect(stats.totalGrams).toBe(150);
      expect(stats.totalAmount).toBe(75500);
      expect(stats.currentValue).toBe(78000);
    });

    it('空数据应返回零值', () => {
      const stats = calculateMetalStats([]);

      expect(stats.totalGrams).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.currentValue).toBe(0);
      expect(stats.monthlyProfit).toBe(0);
      expect(stats.totalProfit).toBe(0);
    });
  });

  describe('calculateMonthlyMetalValues - 月度市值计算', () => {
    it('应正确计算各类型月度市值', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          },
          {
            id: '2',
            date: '2024-02',
            metalType: '黄金',
            grams: 50,
            pricePerGram: 510,
            averagePrice: 520
          }
        ],
        '白银': [
          {
            id: '3',
            date: '2024-01',
            metalType: '白银',
            grams: 1000,
            pricePerGram: 5,
            averagePrice: 5
          }
        ]
      };

      const values = calculateMonthlyMetalValues(recordsByType, '2024-02');

      // 黄金: 150克 * 520 = 78000
      expect(values['黄金']).toBe(78000);

      // 白银: 1000克 * 5 = 5000（白银没有2024-02的数据，使用1月的均价）
      expect(values['白银']).toBe(5000);
    });

    it('没有数据时应返回0', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': []
      };

      const values = calculateMonthlyMetalValues(recordsByType, '2024-01');
      expect(values['黄金']).toBe(0);
    });
  });

  describe('calculateTotalMetalValue - 总市值计算', () => {
    it('应正确汇总所有类型市值', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          }
        ],
        '白银': [
          {
            id: '2',
            date: '2024-01',
            metalType: '白银',
            grams: 1000,
            pricePerGram: 5,
            averagePrice: 5
          }
        ]
      };

      const total = calculateTotalMetalValue(recordsByType, '2024-01');

      // 黄金: 100 * 500 = 50000
      // 白银: 1000 * 5 = 5000
      // 总计: 55000
      expect(total).toBe(55000);
    });
  });

  describe('getPreviousMonthMetalValue - 获取上月市值', () => {
    it('应正确获取上月市值', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          },
          {
            id: '2',
            date: '2024-02',
            metalType: '黄金',
            grams: 50,
            pricePerGram: 510,
            averagePrice: 520
          }
        ]
      };

      const prevValue = getPreviousMonthMetalValue(recordsByType, '2024-02');

      // 上月（2024-01）市值: 100 * 500 = 50000
      expect(prevValue).toBe(50000);
    });

    it('上月无数据时应往前查找', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          }
        ]
      };

      const prevValue = getPreviousMonthMetalValue(recordsByType, '2024-03');

      // 3月和2月都没有数据，应找到1月的数据
      expect(prevValue).toBe(50000);
    });

    it('没有任何数据时应返回0', () => {
      const prevValue = getPreviousMonthMetalValue({}, '2024-02');
      expect(prevValue).toBe(0);
    });
  });

  describe('calculateMonthlyAccumulatedProfit - 累计收益计算', () => {
    it('应正确计算单月累计收益', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          },
          {
            id: '2',
            date: '2024-02',
            metalType: '黄金',
            grams: 50,
            pricePerGram: 510,
            averagePrice: 520
          }
        ]
      };

      const profits = calculateMonthlyAccumulatedProfit(recordsByType, '2024-02');

      // 上月（2024-01）:
      // - 累计克数: 100
      // - 市值: 100 * 500 = 50000
      // 当月（2024-02）:
      // - 累计克数: 150
      // - 市值: 150 * 520 = 78000
      // - 当月投入: 50 * 510 = 25500
      // 收益 = 78000 - 50000 - 25500 = 2500
      expect(profits['黄金']).toBe(2500);
    });

    it('应正确处理首次购买', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          }
        ]
      };

      const profits = calculateMonthlyAccumulatedProfit(recordsByType, '2024-01');

      // 上月没有数据
      // 当月市值: 100 * 500 = 50000
      // 当月投入: 100 * 500 = 50000
      // 收益 = 50000 - 0 - 50000 = 0
      expect(profits['黄金']).toBe(0);
    });

    it('应支持多种贵金属类型', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          }
        ],
        '白银': [
          {
            id: '2',
            date: '2024-01',
            metalType: '白银',
            grams: 1000,
            pricePerGram: 5,
            averagePrice: 5
          }
        ]
      };

      const profits = calculateMonthlyAccumulatedProfit(recordsByType, '2024-01');

      // 都是首次购买，收益都应该是0
      expect(profits['黄金']).toBe(0);
      expect(profits['白银']).toBe(0);
    });
  });

  describe('calculateMonthlyTotalProfit - 月度总收益计算', () => {
    it('应正确计算累计收益', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          },
          {
            id: '2',
            date: '2024-02',
            metalType: '黄金',
            grams: 50,
            pricePerGram: 510,
            averagePrice: 520
          }
        ]
      };

      const profits = calculateMonthlyTotalProfit(recordsByType, '2024-02');

      // 到2024-02为止:
      // - 累计克数: 150
      // - 累计金额: 75500
      // - 当前市值: 150 * 520 = 78000
      // - 累计收益: 78000 - 75500 = 2500
      expect(profits['黄金']).toBe(2500);
    });

    it('第一个月累计收益应为0', () => {
      const recordsByType: RecordsByMetalType = {
        '黄金': [
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          }
        ]
      };

      const profits = calculateMonthlyTotalProfit(recordsByType, '2024-01');

      // 第一个月买入成本等于市值
      expect(profits['黄金']).toBe(0);
    });
  });
});
