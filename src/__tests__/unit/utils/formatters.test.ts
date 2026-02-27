/**
 * 格式化函数单元测试
 * 测试数据格式化工具函数
 */
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatMonth
} from '@utils/formatters';

describe('formatters - 格式化函数', () => {
  describe('formatCurrency - 货币格式化', () => {
    it('应正确格式化USD整数金额', () => {
      expect(formatCurrency(100)).toBe('$100');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(10000)).toBe('$10000');
    });

    it('应正确格式化USD小数金额', () => {
      expect(formatCurrency(1000.5)).toBe('$1000.50');
      expect(formatCurrency(1000.123)).toBe('$1000.12');
      expect(formatCurrency(1000.567)).toBe('$1000.57');
    });

    it('应正确处理负数', () => {
      expect(formatCurrency(-1000)).toBe('$-1000');
      expect(formatCurrency(-100.5)).toBe('$-100.50');
    });

    it('应正确处理大数值', () => {
      expect(formatCurrency(1000000)).toBe('$1000000');
      expect(formatCurrency(1234567.89)).toBe('$1234567.89');
    });
  });

  describe('formatPercentage - 百分比格式化', () => {
    it('应正确格式化正百分比', () => {
      expect(formatPercentage(5.256)).toBe('5.26%');
      expect(formatPercentage(10)).toBe('10.00%');
      expect(formatPercentage(0.5)).toBe('0.50%');
    });

    it('应正确格式化负百分比', () => {
      expect(formatPercentage(-5.256)).toBe('-5.26%');
      expect(formatPercentage(-10)).toBe('-10.00%');
    });

    it('应正确格式化零', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('应正确保留两位小数', () => {
      expect(formatPercentage(12.345)).toBe('12.35%'); // 四舍五入
      expect(formatPercentage(12.344)).toBe('12.34%');
      expect(formatPercentage(12.3456)).toBe('12.35%');
    });

    it('应正确处理小数点后零', () => {
      expect(formatPercentage(15)).toBe('15.00%');
      expect(formatPercentage(15.5)).toBe('15.50%');
    });

    it('应正确处理非常小的数值', () => {
      expect(formatPercentage(0.001)).toBe('0.00%');
      expect(formatPercentage(0.009)).toBe('0.01%');
    });

    it('应正确处理大数值', () => {
      expect(formatPercentage(100)).toBe('100.00%');
      expect(formatPercentage(123.456)).toBe('123.46%');
    });
  });

  describe('formatDate - 日期格式化', () => {
    it('应正确转换YYYY-MM格式', () => {
      expect(formatDate('2024-01')).toBe('2024年01月');
      expect(formatDate('2024-12')).toBe('2024年12月');
      expect(formatDate('2023-06')).toBe('2023年06月');
    });

    it('应正确处理不同年份', () => {
      expect(formatDate('2020-01')).toBe('2020年01月');
      expect(formatDate('2021-01')).toBe('2021年01月');
      expect(formatDate('2022-01')).toBe('2022年01月');
      expect(formatDate('2023-01')).toBe('2023年01月');
      expect(formatDate('2024-01')).toBe('2024年01月');
    });

    it('应正确处理不同月份', () => {
      expect(formatDate('2024-01')).toBe('2024年01月');
      expect(formatDate('2024-02')).toBe('2024年02月');
      expect(formatDate('2024-03')).toBe('2024年03月');
      expect(formatDate('2024-09')).toBe('2024年09月');
      expect(formatDate('2024-10')).toBe('2024年10月');
      expect(formatDate('2024-11')).toBe('2024年11月');
      expect(formatDate('2024-12')).toBe('2024年12月');
    });

    it('应正确处理个位月份', () => {
      expect(formatDate('2024-01')).toBe('2024年01月'); // 1月
      expect(formatDate('2024-09')).toBe('2024年09月'); // 9月
      expect(formatDate('2024-1')).toBe('2024年1月'); // 不带前导零
    });
  });

  describe('formatMonth - 月份格式化', () => {
    it('应与formatDate行为一致', () => {
      expect(formatMonth('2024-01')).toBe('2024年01月');
      expect(formatMonth('2024-12')).toBe('2024年12月');
      expect(formatMonth('2023-06')).toBe('2023年06月');
    });

    it('应正确处理边界情况', () => {
      expect(formatMonth('2020-01')).toBe('2020年01月');
      expect(formatMonth('1999-12')).toBe('1999年12月');
      expect(formatMonth('2025-06')).toBe('2025年06月');
    });
  });

  describe('边界条件和特殊情况', () => {
    it('formatCurrency应正确处理NaN', () => {
      const result = formatCurrency(NaN);
      expect(result).toBe('$NaN');
    });

    it('formatCurrency应正确处理Infinity', () => {
      expect(formatCurrency(Infinity)).toBe('$Infinity');
      expect(formatCurrency(-Infinity)).toBe('$-Infinity');
    });

    it('formatPercentage应正确处理NaN', () => {
      expect(formatPercentage(NaN)).toBe('NaN%');
    });

    it('formatDate应处理完整日期格式', () => {
      // 如果传入YYYY-MM-DD格式，应只取年月
      expect(formatDate('2024-01-15')).toBe('2024年01月');
      // split会得到三个部分，但只取前两个
    });
  });

  describe('实际使用场景测试', () => {
    it('应正确格式化投资金额显示', () => {
      const amount = 12345.67;
      expect(formatCurrency(amount)).toBe('$12345.67');
    });

    it('应正确格式化收益率显示', () => {
      const returnRate = 8.567;
      expect(formatPercentage(returnRate)).toBe('8.57%');
    });

    it('应正确格式化月份选择器显示', () => {
      const selectedMonth = '2024-03';
      expect(formatDate(selectedMonth)).toBe('2024年03月');
    });

    it('应正确格式化Dashboard标题日期', () => {
      const currentMonth = '2024-12';
      expect(formatMonth(currentMonth)).toBe('2024年12月');
    });
  });
});
