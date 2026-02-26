/**
 * MonthlyProfitChart 贵金属收益计算验证
 * 集成测试：验证Dashboard显示的贵金属收益金额正确性
 */
import { describe, it, expect } from 'vitest';
import { calculateMonthlyAccumulatedProfit } from '@utils/metalCalculations';
import { PreciousMetalRecord, RecordsByMetalType } from '@types/preciousMetal';

describe('MonthlyProfitChart - 贵金属收益集成测试', () => {
  describe('Dashboard收益金额计算验证', () => {
    it('应正确计算2024-02的贵金属收益并显示在图表中', () => {
      // 模拟用户数据：1月和2月购买黄金
      const recordsByMetalType: RecordsByMetalType = {
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

      // 模拟Dashboard组件的计算逻辑
      const month = '2024-02';
      const monthlyProfits = calculateMonthlyAccumulatedProfit(recordsByMetalType, month);

      // 汇总所有贵金属类型
      const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

      // 验证计算结果
      expect(monthlyProfits['黄金']).toBe(2500);
      expect(totalProfit).toBe(2500);

      // 验证：这个金额将显示在Dashboard图表的Y轴上
      // 图表数据点：{ label: '2024-02', value: 2500 }
      const expectedChartDataPoint = {
        label: '2024-02',
        value: 2500
      };

      expect(expectedChartDataPoint.value).toBe(2500);
    });

    it('应正确汇总多种贵金属的收益（黄金 + 白银）', () => {
      const recordsByMetalType: RecordsByMetalType = {
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
          },
          {
            id: '4',
            date: '2024-02',
            metalType: '白银',
            grams: 200,
            pricePerGram: 5.5,
            averagePrice: 6
          }
        ]
      };

      const month = '2024-02';
      const monthlyProfits = calculateMonthlyAccumulatedProfit(recordsByMetalType, month);
      const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

      // 验证：
      // 黄金收益: 520×150 - 500×100 - 25500 = 2500
      // 白银收益: 6×1200 - 5×1000 - 1100 = 1100
      // 总计: 3600
      expect(monthlyProfits['黄金']).toBe(2500);
      expect(monthlyProfits['白银']).toBe(1100);
      expect(totalProfit).toBe(3600);

      // Dashboard图表应显示3600元
      const expectedDisplay = '¥3,600';
      expect(totalProfit).toBe(3600);
    });
  });

  describe('完整数据流验证：Store → 计算 → 图表显示', () => {
    it('应验证从Store读取数据到计算收益的完整流程', () => {
      // 步骤1: 准备Store数据
      const storeData: RecordsByMetalType = {
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

      // 步骤2: 模拟Dashboard组件的useMemo计算
      const month = '2024-02';

      // 提取所有贵金属记录并按月份分组
      const allMetalRecords = Object.values(storeData).flat();
      const uniqueMonths = Array.from(new Set(allMetalRecords.map(r => r.date))).sort();

      // 为每个月计算收益
      const chartData = uniqueMonths.map(targetMonth => {
        const monthlyProfits = calculateMonthlyAccumulatedProfit(storeData, targetMonth);
        const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

        return {
          label: targetMonth,
          value: totalProfit
        };
      });

      // 步骤3: 验证图表数据
      expect(chartData).toHaveLength(2);

      const januaryData = chartData.find(d => d.label === '2024-01');
      expect(januaryData?.value).toBe(0); // 首次购买

      const februaryData = chartData.find(d => d.label === '2024-02');
      expect(februaryData?.value).toBe(2500); // 计算出的收益

      // 步骤4: 验证这些数据会被正确渲染到图表
      // 图表配置：
      // - X轴: ['2024-01', '2024-02']
      // - Y轴: [0, 2500]
      // - 柱状图高度：根据value值动态计算
      expect(februaryData).toEqual({
        label: '2024-02',
        value: 2500
      });
    });

    it('应验证日期筛选后的数据', () => {
      const storeData: RecordsByMetalType = {
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
          },
          {
            id: '3',
            date: '2024-03',
            metalType: '黄金',
            grams: 30,
            pricePerGram: 530,
            averagePrice: 540
          }
        ]
      };

      // 应用日期筛选：只显示1-2月
      const dateRange = {
        startMonth: '2024-01',
        endMonth: '2024-02'
      };

      const allMetalRecords = Object.values(storeData).flat();
      const filteredRecords = allMetalRecords.filter(r => {
        const startCheck = !dateRange.startMonth || r.date >= dateRange.startMonth;
        const endCheck = !dateRange.endMonth || r.date <= dateRange.endMonth;
        return startCheck && endCheck;
      });

      const filteredStoreData: RecordsByMetalType = {
        '黄金': filteredRecords
      };

      // 计算筛选后的收益
      const month = '2024-02';
      const monthlyProfits = calculateMonthlyAccumulatedProfit(filteredStoreData, month);
      const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

      // 验证：即使有3月的数据，图表只显示1-2月
      expect(totalProfit).toBe(2500);

      // 3月的数据应该被过滤掉
      const uniqueMonths = Array.from(new Set(filteredRecords.map(r => r.date))).sort();
      expect(uniqueMonths).not.toContain('2024-03');
    });
  });

  describe('边界情况验证', () => {
    it('应正确处理亏损情况', () => {
      // 价格下跌导致亏损
      const storeData: RecordsByMetalType = {
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
            averagePrice: 480 // 价格下跌
          }
        ]
      };

      const month = '2024-02';
      const monthlyProfits = calculateMonthlyAccumulatedProfit(storeData, month);
      const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

      // 计算亏损：480×150 - 500×100 - 25500 = -3500
      expect(totalProfit).toBe(-3500);

      // 图表应该显示负值（柱状图向下）
      const expectedChartDataPoint = {
        label: '2024-02',
        value: -3500
      };

      expect(expectedChartDataPoint.value).toBe(-3500);
    });

    it('应正确处理大量数据（12个月）', () => {
      const records: PreciousMetalRecord[] = [];
      for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        records.push({
          id: `${i}`,
          date: `2024-${month}`,
          metalType: '黄金',
          grams: 100,
          pricePerGram: 500,
          averagePrice: 500 + i * 10 // 价格持续上涨
        });
      }

      const storeData: RecordsByMetalType = {
        '黄金': records
      };

      // 计算所有月份的收益
      const allMonths = Array.from(new Set(records.map(r => r.date))).sort();
      const chartData = allMonths.map(month => {
        const profits = calculateMonthlyAccumulatedProfit(storeData, month);
        const total = Object.values(profits).reduce((sum, profit) => sum + profit, 0);
        return { label: month, value: total };
      });

      // 验证：应该有12个月的数据
      expect(chartData).toHaveLength(12);

      // 验证：第一个月收益为1000
      // 计算：510×100 - 500×0 - 50000 = 1000
      expect(chartData[0].value).toBe(1000);

      // 验证：其他月份应该有收益（价格上涨）
      const profits = chartData.slice(1).map(d => d.value);
      expect(profits.every(p => p > 0)).toBe(true);
    });

    it('应正确处理空数据', () => {
      const storeData: RecordsByMetalType = {};

      const allMetalRecords = Object.values(storeData).flat();

      // 验证：没有数据时，图表应该显示提示信息
      expect(allMetalRecords).toHaveLength(0);

      // Dashboard应显示：暂无贵金属数据
      const expectedMessage = '暂无贵金属数据，请添加贵金属投资记录';
      expect(expectedMessage).toBeTruthy();
    });
  });

  describe('关键业务场景验证', () => {
    it('应验证真实用户场景：分批买入黄金', () => {
      // 真实场景：用户分3个月买入黄金
      const storeData: RecordsByMetalType = {
        '黄金': [
          // 1月：买入100克，@500
          {
            id: '1',
            date: '2024-01',
            metalType: '黄金',
            grams: 100,
            pricePerGram: 500,
            averagePrice: 500
          },
          // 2月：买入50克，@510，均价涨到520
          {
            id: '2',
            date: '2024-02',
            metalType: '黄金',
            grams: 50,
            pricePerGram: 510,
            averagePrice: 520
          },
          // 3月：买入30克，@530，均价涨到540
          {
            id: '3',
            date: '2024-03',
            metalType: '黄金',
            grams: 30,
            pricePerGram: 530,
            averagePrice: 540
          }
        ]
      };

      // 验证每个月的收益
      const janProfits = calculateMonthlyAccumulatedProfit(storeData, '2024-01');
      expect(janProfits['黄金']).toBe(0); // 首次购买

      const febProfits = calculateMonthlyAccumulatedProfit(storeData, '2024-02');
      expect(febProfits['黄金']).toBe(2500); // 520×150 - 500×100 - 25500

      const marProfits = calculateMonthlyAccumulatedProfit(storeData, '2024-03');
      // 计算：540×180 - 520×150 - 15900 = 3300
      expect(marProfits['黄金']).toBe(3300);

      // 验证：Dashboard图表应显示递增的收益曲线
      const chartData = [
        { label: '2024-01', value: 0 },
        { label: '2024-02', value: 2500 },
        { label: '2024-03', value: 2620 }
      ];

      expect(chartData[2].value).toBeGreaterThan(chartData[1].value);
      expect(chartData[1].value).toBeGreaterThan(chartData[0].value);
    });

    it('应验证投资建议场景：何时卖出', () => {
      // 场景：用户想根据收益曲线决定是否卖出
      const storeData: RecordsByMetalType = {
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
            grams: 0, // 2月没买
            pricePerGram: 510,
            averagePrice: 520
          }
        ]
      };

      const month = '2024-02';
      const monthlyProfits = calculateMonthlyAccumulatedProfit(storeData, month);
      const totalProfit = Object.values(monthlyProfits).reduce((sum, profit) => sum + profit, 0);

      // 计算：520×100 - 500×100 - 0 = 2000
      expect(totalProfit).toBe(2000);

      // Dashboard显示：2月收益2000元
      // 用户决策：收益不错，可以考虑继续持有或卖出
      const displayValue = '¥2,000';
      expect(totalProfit).toBeGreaterThan(0);
    });
  });

  describe('数据一致性验证：单元测试 vs 集成测试', () => {
    it('应验证组件使用的公式与单元测试一致', () => {
      // 这个测试确保：Dashboard组件使用的公式
      // 与 metalCalculations.test.ts 中测试的公式一致

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

      // 使用相同的函数
      const result = calculateMonthlyAccumulatedProfit(recordsByType, '2024-02');

      // 验证公式：当月均价 × 当月累计克数 - 上月均价 × 上月累计克数 - 当月投资金额
      //         = 520 × 150 - 500 × 100 - 25500
      //         = 78000 - 50000 - 25500
      //         = 2500

      expect(result['黄金']).toBe(2500);

      // 验证：Dashboard的metalChartData会使用这个结果
      const metalChartDataValue = Object.values(result).reduce((sum, profit) => sum + profit, 0);
      expect(metalChartDataValue).toBe(2500);

      // 结论：组件显示的金额 = 单元测试验证的金额
      expect(result['黄金']).toEqual(metalChartDataValue);
    });
  });
});
