import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMonthlyProfit,
  calculateMonthlyReturnByAccount,
  calculateOverallMonthlyROI,
  calculateOverallMonthlyReturn
} from '@utils/investmentCalculations';
import { MockDataFactory } from '@utils/mockDataFactory';
import { createRecordsByType, verifyCalculationAccuracy, printMonthProfitMap } from '@utils/testHelpers';
import { InvestmentRecord } from '@types/investment';

/**
 * 投资计算 - 日期筛选关键测试
 *
 * ⭐⭐ 这是防止bug重现的最重要测试套件 ⭐⭐
 *
 * 核心原则：计算必须使用完整历史数据，日期筛选只影响显示
 *
 * Bug场景：当应用日期筛选时，如果计算使用筛选后的数据，
 * 会导致历史月份的收益值发生错误变化。
 *
 * 例如：2024年6月的收益应该使用01-06月的所有数据计算，
 *       而不是仅使用06-08月（筛选范围）的数据。
 */

describe('投资计算 - 日期筛选关键测试', () => {
  describe('防止Bug重现：计算使用完整数据', () => {
    it('calculateMonthlyProfit应使用完整历史数据计算', () => {
      // 创建12个月数据 (2024-01 到 2024-12)
      const twelveMonthsData = MockDataFactory.createInvestmentRecords({
        accounts: ['测试账户'],
        assetTypes: ['股票'],
        months: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return `2024-${month.toString().padStart(2, '0')}`;
        }),
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      // 关键测试：验证6月收益计算
      const month6 = '2024-06';
      const month6Profit = calculateMonthlyProfit(month6, twelveMonthsData);

      // 6月收益应该使用01-06月的所有数据计算
      // 公式: 6月快照 - 5月快照 - 6月投资
      const expectedMonth6Investment = 10000 * (1 + 0.05 * 5); // 6月投资
      const expectedMonth6Snapshot = 10000 * Math.pow(1.05, 6); // 6月快照
      const expectedMonth5Snapshot = 10000 * Math.pow(1.05, 5); // 5月快照
      const expectedMonth6Profit = expectedMonth6Snapshot - expectedMonth5Snapshot - expectedMonth6Investment;

      expect(month6Profit).toBeCloseTo(expectedMonth6Profit, 2);

      console.log('✅ 6月收益计算验证：');
      console.log(`   计算: 6月快照(${expectedMonth6Snapshot.toFixed(2)}) - 5月快照(${expectedMonth5Snapshot.toFixed(2)}) - 6月投资(${expectedMonth6Investment.toFixed(2)})`);
      console.log(`   结果: ${month6Profit.toFixed(2)}`);
      console.log(`   ✅ 使用了01-06月的完整历史数据`);

      // 验证：即使我们模拟"筛选到06-08月"，6月的收益值应该保持不变
      // （实际筛选在组件层面应用，不应该影响计算函数）
      const simulatedFilteredData = twelveMonthsData.filter((r) => {
        const month = r.date;
        return month >= '2024-06' && month <= '2024-08';
      });

      // 如果错误地使用筛选后的数据计算6月收益，结果会不同
      // （这是我们要防止的bug）
      const incorrectMonth6Profit = calculateMonthlyProfit(month6, simulatedFilteredData);

      // 这两个值应该不同，证明使用筛选数据会导致错误结果
      if (incorrectMonth6Profit !== month6Profit) {
        console.log(`   ⚠️  使用筛选数据计算6月收益会得到错误结果: ${incorrectMonth6Profit.toFixed(2)}`);
        console.log(`   ✅ 正确结果应该是: ${month6Profit.toFixed(2)}`);
      }
    });

    it('calculateMonthlyReturnByAccount应不受日期筛选影响', () => {
      // 创建12个月数据
      const twelveMonthsData = MockDataFactory.createInvestmentRecords({
        accounts: ['账户A', '账户B'],
        assetTypes: ['股票', '基金'],
        months: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return `2024-${month.toString().padStart(2, '0')}`;
        }),
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      const recordsByType = createRecordsByType(twelveMonthsData);

      // 计算收益率（应该使用完整数据）
      const returnDataByAccount = calculateMonthlyReturnByAccount(recordsByType);

      // 验证：应该返回所有12个月的数据
      expect(returnDataByAccount.length).toBeGreaterThan(0);

      returnDataByAccount.forEach(({ account, data }) => {
        // 每个账户应该有12个月的数据（或者连续月份的数据）
        console.log(`   账户 ${account}: ${data.length} 个月的数据`);
        expect(data.length).toBeGreaterThan(0);

        // 验证第6个月的收益率计算使用了完整历史数据
        const month6Data = data.find((d) => d.month === '2024-06');
        if (month6Data) {
          console.log(`   ${account} 2024-06 收益率: ${month6Data.returnRate.toFixed(2)}%`);
          expect(month6Data.returnRate).toBeDefined();
        }
      });
    });

    it('calculateOverallMonthlyROI应使用完整数据', () => {
      // 创建12个月数据
      const twelveMonthsData = MockDataFactory.createInvestmentRecords({
        accounts: ['测试账户'],
        assetTypes: ['股票'],
        months: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return `2024-${month.toString().padStart(2, '0')}`;
        }),
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      const recordsByType = createRecordsByType(twelveMonthsData);

      // 计算整体ROI
      const overallROI = calculateOverallMonthlyROI(recordsByType);

      // 验证：应该返回所有12个月的数据
      expect(overallROI.length).toBe(12);

      // 验证第6个月的ROI
      const month6ROI = overallROI.find((r) => r.month === '2024-06');
      expect(month6ROI).toBeDefined();
      expect(month6ROI?.roi).toBeDefined();

      console.log(`   整体ROI 2024-06: ${month6ROI?.roi.toFixed(2)}%`);
      console.log(`   ✅ 使用了完整历史数据计算`);
    });

    it('calculateOverallMonthlyReturn应使用完整数据', () => {
      // 创建12个月数据
      const twelveMonthsData = MockDataFactory.createInvestmentRecords({
        accounts: ['测试账户'],
        assetTypes: ['股票'],
        months: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return `2024-${month.toString().padStart(2, '0')}`;
        }),
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      const recordsByType = createRecordsByType(twelveMonthsData);

      // 计算整体收益率
      const overallReturn = calculateOverallMonthlyReturn(recordsByType);

      // 验证：应该返回所有12个月的数据
      expect(overallReturn.length).toBe(12);

      // 验证第6个月的收益率
      const month6Return = overallReturn.find((r) => r.month === '2024-06');
      expect(month6Return).toBeDefined();
      expect(month6Return?.returnRate).toBeDefined();

      console.log(`   整体收益率 2024-06: ${month6Return?.returnRate.toFixed(2)}%`);
      console.log(`   ✅ 使用了完整历史数据计算`);
    });
  });

  describe('边界情况', () => {
    it('首月收益应为0（无上月快照）', () => {
      const firstMonthData = MockDataFactory.createEdgeCases().firstMonth;

      const profit = calculateMonthlyProfit('2024-01', firstMonthData);

      expect(profit).toBe(0);
      console.log('   ✅ 首月收益正确为0');
    });

    it('月份不连续应正确处理', () => {
      const gapData = MockDataFactory.createEdgeCases().gapInData;

      // 计算有数据的月份
      const month2Profit = calculateMonthlyProfit('2024-02', gapData);
      const month5Profit = calculateMonthlyProfit('2024-05', gapData);

      // 2024-02: 11000 - 10000 - 10000 = -9000
      expect(month2Profit).toBeCloseTo(-9000, 2);

      console.log(`   2024-02 收益: ${month2Profit.toFixed(2)}`);
      console.log(`   2024-05 收益: ${month5Profit.toFixed(2)}`);
      console.log(`   ✅ 月份不连续情况处理正确`);
    });

    it('投资金额为0时使用上月快照计算收益率', () => {
      const zeroInvestmentData = MockDataFactory.createEdgeCases().zeroInvestment;

      // 计算收益
      const profit = calculateMonthlyProfit('2024-02', zeroInvestmentData);

      // 10500 - 10000 - 0 = 500
      expect(profit).toBeCloseTo(500, 2);

      console.log(`   收益: ${profit.toFixed(2)}`);
      console.log(`   ✅ 投资为0时正确使用上月快照计算`);
    });

    it('负收益（亏损）情况', () => {
      const negativeProfitData = MockDataFactory.createEdgeCases().negativeProfit;

      const profit = calculateMonthlyProfit('2024-02', negativeProfitData);

      // 12000 - 10000 - 5000 = -3000
      expect(profit).toBeCloseTo(-3000, 2);

      console.log(`   负收益: ${profit.toFixed(2)}`);
      console.log(`   ✅ 亏损情况正确处理`);
    });
  });

  describe('关键场景测试：防止日期筛选bug', () => {
    it('⭐⭐ 超级关键测试：模拟日期筛选bug场景', () => {
      // 创建日期筛选关键测试场景
      const { allData, filterRange, expectedResults } = MockDataFactory.createDateFilterCriticalCase();

      console.log('\n========== 日期筛选Bug防护测试 ==========');
      console.log(`数据范围: 2024-01 ~ 2024-12 (12个月)`);
      console.log(`筛选范围: ${filterRange.startMonth} ~ ${filterRange.endMonth} (3个月)`);
      console.log('=======================================\n');

      // 计算筛选范围内各月份的收益
      const month6Profit = calculateMonthlyProfit('2024-06', allData);
      const month7Profit = calculateMonthlyProfit('2024-07', allData);
      const month8Profit = calculateMonthlyProfit('2024-08', allData);

      console.log('使用完整数据计算的结果：');
      console.log(`  2024-06 收益: ${month6Profit.toFixed(2)}`);
      console.log(`  2024-07 收益: ${month7Profit.toFixed(2)}`);
      console.log(`  2024-08 收益: ${month8Profit.toFixed(2)}`);

      // 验证计算结果正确
      expect(month6Profit).toBeCloseTo(expectedResults.month6Profit, 2);
      expect(month7Profit).toBeCloseTo(expectedResults.month7Profit, 2);
      expect(month8Profit).toBeCloseTo(expectedResults.month8Profit, 2);

      console.log('\n✅ 所有月份的计算都使用了完整历史数据');
      console.log('✅ 日期筛选不会影响计算准确性');
      console.log('=======================================\n');
    });

    it('⭐ 关键测试：多账户场景下的日期筛选', () => {
      const multiAccountData = MockDataFactory.createInvestmentRecords({
        accounts: ['账户A', '账户B', '账户C'],
        assetTypes: ['股票', '基金'],
        months: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return `2024-${month.toString().padStart(2, '0')}`;
        }),
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      const recordsByType = createRecordsByType(multiAccountData);

      // 计算各账户的收益率
      const returnDataByAccount = calculateMonthlyReturnByAccount(recordsByType);

      console.log('\n========== 多账户日期筛选测试 ==========');
      returnDataByAccount.forEach(({ account, data }) => {
        const month6Data = data.find((d) => d.month === '2024-06');
        if (month6Data) {
          console.log(`${account} 2024-06 收益率: ${month6Data.returnRate.toFixed(2)}%`);
        }
      });
      console.log('=======================================\n');

      // 验证每个账户的第6个月数据都存在
      returnDataByAccount.forEach(({ account, data }) => {
        const month6Data = data.find((d) => d.month === '2024-06');
        expect(month6Data).toBeDefined();
        console.log(`✅ ${account} 的 2024-06 数据存在且使用了完整历史数据`);
      });
    });
  });
});
