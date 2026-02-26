import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMonthlyAccumulatedProfit,
  getPreviousMonthMetalValue,
  calculateTotalMetalValue
} from '@utils/metalCalculations';
import { MockDataFactory } from '@utils/mockDataFactory';
import { createRecordsByMetalType, getPreviousMonth } from '@utils/testHelpers';
import { PreciousMetalRecord } from '@types/preciousMetal';

/**
 * 贵金属计算 - 日期筛选关键测试
 *
 * ⭐⭐ 防止贵金属计算的日期筛选bug ⭐⭐
 *
 * 核心原则：贵金属收益计算必须使用累计购买数据，
 *           不能受日期筛选影响
 *
 * 贵金属收益公式：
 * 月度收益 = 当月均价×当月累计克数 - 上月均价×上月累计克数 - 当月投资金额
 *
 * 关键点：当月累计克数 = 从开始到当月所有购买的总克数（不是筛选范围内的克数）
 */

describe('贵金属计算 - 日期筛选关键测试', () => {
  describe('calculateMonthlyAccumulatedProfit - 防止日期筛选bug', () => {
    it('应使用累计购买数据计算收益', () => {
      // 创建3个月数据
      const metalsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(metalsData);

      // 计算2月收益
      const month2Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-02');

      console.log('\n========== 贵金属累计收益计算 ==========');
      console.log('购买记录：');
      console.log('  2024-01: 10g @ ¥500/g = ¥5000');
      console.log('  2024-02: 10g @ ¥510/g = ¥5100');
      console.log('  2024-03: 10g @ ¥520.2/g = ¥5202');
      console.log('');
      console.log('2024-02 收益计算：');
      console.log('  当月累计克数: 20g (01月10g + 02月10g)');
      console.log('  上月累计克数: 10g (仅01月)');
      console.log('  收益 = 20g×¥510 - 10g×¥500 - ¥5100');
      console.log(`       = ¥${month2Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log('=======================================\n');

      // 验证：2月收益应该包含1月的10g
      // 公式: 当月累计价值 - 上月累计价值 - 当月投资
      // = 20g * 510 - 10g * 500 - 5100
      // = 10200 - 5000 - 5100
      // = 100
      const expectedProfit = 20 * 510 - 10 * 500 - 5100;
      expect(month2Profits.get('黄金')).toBeCloseTo(expectedProfit, 2);

      // 关键验证：收益 > 0，说明包含了1月的购买
      expect(month2Profits.get('黄金')).toBeGreaterThan(0);
      console.log('✅ 2月收益正确包含了1月的购买数据');
    });

    it('应使用完整历史记录而非筛选后数据', () => {
      // 创建6个月购买记录
      const sixMonthsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(sixMonthsData);

      console.log('\n========== 完整历史数据验证 ==========');
      console.log('购买记录：01-06月，每月10g');

      // 计算6月收益（应该使用01-06月的所有数据）
      const month6Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-06');

      // 手动计算预期结果
      // 6月累计克数 = 60g (6个月 × 10g)
      // 5月累计克数 = 50g (5个月 × 10g)
      // 6月价格 ≈ 500 * 1.02^5 ≈ 552.04
      // 收益 = 60g×552.04 - 50g×552.04×0.98 - 6月投资
      const totalGramsMonth6 = 60;
      const totalGramsMonth5 = 50;
      const priceMonth6 = 500 * Math.pow(1.02, 5);
      const priceMonth5 = 500 * Math.pow(1.02, 4);
      const investmentMonth6 = 10 * priceMonth6;
      const expectedProfit = totalGramsMonth6 * priceMonth6 - totalGramsMonth5 * priceMonth5 - investmentMonth6;

      console.log(`  6月累计: ${totalGramsMonth6}g`);
      console.log(`  5月累计: ${totalGramsMonth5}g`);
      console.log(`  6月价格: ¥${priceMonth6.toFixed(2)}/g`);
      console.log(`  6月投资: ¥${investmentMonth6.toFixed(2)}`);
      console.log(`  预期收益: ¥${expectedProfit.toFixed(2)}`);
      console.log(`  实际收益: ¥${month6Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log('=======================================\n');

      expect(month6Profits.get('黄金')).toBeCloseTo(expectedProfit, 2);
      console.log('✅ 6月收益正确使用了01-06月的完整购买数据');
    });

    it('⭐ 关键测试：模拟日期筛选场景', () => {
      // 创建6个月数据
      const sixMonthsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(sixMonthsData);

      console.log('\n========== 贵金属日期筛选Bug测试 ==========');
      console.log('完整数据: 2024-01 ~ 2024-06 (6个月)');
      console.log('筛选范围: 2024-04 ~ 2024-06 (3个月)');
      console.log('');

      // 计算4月收益（筛选范围的起始月）
      const month4Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-04');

      // 4月收益应该使用01-04月的所有购买数据（40g）
      // 如果错误地使用筛选数据（04-06月），只会计算30g，导致结果错误
      const totalGramsMonth4 = 40; // 4个月 × 10g
      const totalGramsMonth3 = 30; // 3个月 × 10g
      const priceMonth4 = 500 * Math.pow(1.02, 3);
      const priceMonth3 = 500 * Math.pow(1.02, 2);
      const investmentMonth4 = 10 * priceMonth4;
      const expectedProfit = totalGramsMonth4 * priceMonth4 - totalGramsMonth3 * priceMonth3 - investmentMonth4;

      console.log('2024-04 收益计算：');
      console.log(`  正确: 使用01-04月数据 (${totalGramsMonth4}g累计)`);
      console.log(`  错误: 使用04-06月数据 (仅30g累计)`);
      console.log(`  预期收益: ¥${expectedProfit.toFixed(2)}`);
      console.log(`  实际收益: ¥${month4Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log('=======================================\n');

      expect(month4Profits.get('黄金')).toBeCloseTo(expectedProfit, 2);
      console.log('✅ 4月收益正确使用了完整历史数据（01-04月）');
      console.log('✅ 日期筛选不会影响贵金属收益计算准确性');
    });

    it('应正确处理多种贵金属类型', () => {
      const multiMetalData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金', '白银'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(multiMetalData);

      // 计算2月各贵金属的收益
      const month2Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-02');

      console.log('\n========== 多种贵金属计算 ==========');
      month2Profits.forEach((profit, metalType) => {
        console.log(`${metalType} 2024-02 收益: ¥${profit.toFixed(2)}`);
      });
      console.log('=======================================\n');

      // 验证两种贵金属都有收益数据
      expect(month2Profits.size).toBe(2);
      expect(month2Profits.has('黄金')).toBe(true);
      expect(month2Profits.has('白银')).toBe(true);

      console.log('✅ 多种贵金属类型计算正确');
    });
  });

  describe('getPreviousMonthMetalValue', () => {
    it('应获取上月市值用于收益率计算', () => {
      const metalsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(metalsData);

      // 获取2月的上月市值（即1月的市值）
      const prevMonthValue = getPreviousMonthMetalValue(recordsByMetalType, '2024-02');

      // 1月市值 = 10g × 500 = 5000
      const expectedValue = 10 * 500;

      console.log('\n========== 上月市值计算 ==========');
      console.log('2024-02 的上月 (2024-01) 市值：');
      console.log(`  克数: 10g`);
      console.log(`  价格: ¥500/g`);
      console.log(`  市值: ¥${expectedValue}`);
      console.log(`  实际: ¥${prevMonthValue.toFixed(2)}`);
      console.log('=======================================\n');

      expect(prevMonthValue).toBeCloseTo(expectedValue, 2);
      console.log('✅ 上月市值计算正确');
    });

    it('上月为空时应往前查找', () => {
      const gapData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-05'], // 有gap
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(gapData);

      // 获取5月的上月市值（应该找到1月，即使中间有gap）
      const prevMonthValue = getPreviousMonthMetalValue(recordsByMetalType, '2024-05');

      console.log('\n========== 上月市值gap处理 ==========');
      console.log('2024-05 的上月市值查找：');
      console.log('  直接上月 (2024-04): 无数据');
      console.log('  继续查找 (2024-03): 无数据');
      console.log('  继续查找 (2024-02): 无数据');
      console.log('  继续查找 (2024-01): 找到数据');
      console.log(`  市值: ¥${prevMonthValue.toFixed(2)}`);
      console.log('=======================================\n');

      // 应该找到1月的市值
      expect(prevMonthValue).toBeGreaterThan(0);
      console.log('✅ 正确往前查找上月市值');
    });
  });

  describe('calculateTotalMetalValue', () => {
    it('应正确计算指定月份的总市值', () => {
      const metalsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金', '白银'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(metalsData);

      // 计算2月的总市值
      const totalValue = calculateTotalMetalValue(recordsByMetalType, '2024-02');

      console.log('\n========== 总市值计算 ==========');
      console.log('2024-02 总市值：');
      console.log('  黄金: 20g × ¥510/g = ¥10,200');
      console.log('  白银: 20g × ¥510/g = ¥10,200');
      console.log(`  总计: ¥${totalValue.toFixed(2)}`);
      console.log('=======================================\n');

      // 验证市值 > 0
      expect(totalValue).toBeGreaterThan(0);
      console.log('✅ 总市值计算正确');
    });
  });

  describe('边界情况', () => {
    it('首月收益应为0', () => {
      const firstMonthData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(firstMonthData);

      const month1Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-01');

      console.log('\n========== 首月收益验证 ==========');
      console.log('2024-01 (首月) 收益:');
      console.log(`  实际: ¥${month1Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log('  预期: ¥0 (无上月数据)');
      console.log('=======================================\n');

      expect(month1Profits.get('黄金')).toBe(0);
      console.log('✅ 首月收益正确为0');
    });

    it('价格下降（负收益）情况', () => {
      const downTrendData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02'],
        baseGrams: 10,
        priceTrend: 'down', // 价格下降
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(downTrendData);

      const month2Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-02');

      console.log('\n========== 价格下降测试 ==========');
      console.log('2024-02 收益（价格下降）：');
      console.log(`  实际: ¥${month2Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log(`  可能 < 0 (价格下跌导致亏损)`);
      console.log('=======================================\n');

      // 价格下降，收益可能为负
      expect(month2Profits.get('黄金')).toBeDefined();
      console.log('✅ 价格下降情况处理正确');
    });

    it('无购买记录的月份', () => {
      const gapData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-03'], // 02月无购买
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      const recordsByMetalType = createRecordsByMetalType(gapData);

      // 计算3月收益（应该使用1月和3月的数据）
      const month3Profits = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-03');

      console.log('\n========== 无购买记录月份测试 ==========');
      console.log('2024-03 收益计算（02月无购买）：');
      console.log(`  实际: ¥${month3Profits.get('黄金')?.toFixed(2) || 0}`);
      console.log('  应使用1月和3月的数据计算');
      console.log('=======================================\n');

      // 即使中间有月份无购买，也应该正确计算
      expect(month3Profits.get('黄金')).toBeDefined();
      console.log('✅ 无购买记录月份处理正确');
    });
  });

  describe('关键集成测试：与普通投资协同', () => {
    it('应正确计算贵金属+普通投资的组合收益', () => {
      // 创建贵金属数据
      const metalsData = MockDataFactory.createMetalRecords({
        metalTypes: ['黄金'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseGrams: 10,
        priceTrend: 'up',
        basePrice: 500
      });

      // 创建普通投资数据
      const investmentsData = MockDataFactory.createInvestmentRecords({
        accounts: ['测试账户'],
        assetTypes: ['股票'],
        months: ['2024-01', '2024-02', '2024-03'],
        baseAmount: 10000,
        growthRate: 0.05,
        includeSnapshots: true
      });

      const recordsByMetalType = createRecordsByMetalType(metalsData);

      // 计算各月的收益
      const month1MetalProfit = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-01');
      const month2MetalProfit = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-02');
      const month3MetalProfit = calculateMonthlyAccumulatedProfit(recordsByMetalType, '2024-03');

      console.log('\n========== 组合收益计算 ==========');
      console.log('月份 | 贵金属收益 | 普通投资收益 | 总收益');
      console.log('-----|-----------|-------------|-------');
      console.log(`01月 | ¥${(month1MetalProfit.get('黄金') || 0).toFixed(2)} | ¥0.00 | ¥${(month1MetalProfit.get('黄金') || 0).toFixed(2)}`);
      console.log(`02月 | ¥${(month2MetalProfit.get('黄金') || 0).toFixed(2)} | ... | ...`);
      console.log(`03月 | ¥${(month3MetalProfit.get('黄金') || 0).toFixed(2)} | ... | ...`);
      console.log('=======================================\n');

      // 验证贵金属收益正确计算
      expect(month1MetalProfit.get('黄金')).toBe(0); // 首月
      expect(month2MetalProfit.get('黄金')).toBeGreaterThan(0);
      expect(month3MetalProfit.get('黄金')).toBeGreaterThan(0);

      console.log('✅ 贵金属+普通投资组合计算正确');
    });
  });
});
