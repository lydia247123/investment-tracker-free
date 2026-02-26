import { InvestmentRecord } from '@types/investment';
import { PreciousMetalRecord } from '@types/preciousMetal';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import vi from 'vitest';

/**
 * 测试辅助函数集合
 */

/**
 * Mock存储数据
 * Mock stores with test data
 */
export function mockStoresWithData(data: {
  investments?: InvestmentRecord[];
  metals?: PreciousMetalRecord[];
}) {
  // 这个函数将在实际的测试文件中使用 vi.mock 实现
  // 这里只是提供类型定义和文档
  // Implementation will use vi.mock in actual test files
}

/**
 * 验证计算准确性
 * Verify calculation accuracy
 */
export function verifyCalculationAccuracy(
  calculated: Map<string, number>,
  expected: Map<string, number>,
  tolerance: number = 0.01
): void {
  expected.forEach((value, month) => {
    const calculatedValue = calculated.get(month);
    if (calculatedValue === undefined) {
      throw new Error(`Missing calculation for month: ${month}`);
    }

    const diff = Math.abs(calculatedValue - value);
    if (diff > tolerance) {
      throw new Error(
        `Calculation mismatch for ${month}: expected ${value}, got ${calculatedValue} (diff: ${diff})`
      );
    }
  });
}

/**
 * 格式化货币
 * Format currency for display in tests
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

/**
 * 格式化百分比
 * Format percentage for display in tests
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * 创建简单的测试用recordsByType
 * Create simple test recordsByType structure
 */
export function createRecordsByType(records: InvestmentRecord[]): Record<string, InvestmentRecord[]> {
  const recordsByType: Record<string, InvestmentRecord[]> = {};

  records.forEach((record) => {
    if (!recordsByType[record.type]) {
      recordsByType[record.type] = [];
    }
    recordsByType[record.type].push(record);
  });

  return recordsByType;
}

/**
 * 创建简单的测试用recordsByMetalType
 * Create simple test recordsByMetalType structure
 */
export function createRecordsByMetalType(records: PreciousMetalRecord[]): Record<string, PreciousMetalRecord[]> {
  const recordsByMetalType: Record<string, PreciousMetalRecord[]> = {};

  records.forEach((record) => {
    if (!recordsByMetalType[record.metalType]) {
      recordsByMetalType[record.metalType] = [];
    }
    recordsByMetalType[record.metalType].push(record);
  });

  return recordsByMetalType;
}

/**
 * 打印月份-收益映射（用于调试）
 * Print month-profit map for debugging
 */
export function printMonthProfitMap(profits: Map<string, number>, label: string = 'Profits'): void {
  console.log(`\n========== ${label} ==========`);
  const sortedMonths = Array.from(profits.keys()).sort();
  sortedMonths.forEach((month) => {
    console.log(`${month}: ${formatCurrency(profits.get(month) || 0)}`);
  });
  console.log('=====================================\n');
}

/**
 * 计算月度收益（测试辅助函数）
 * Calculate monthly profit (test helper)
 * 公式: 当月快照 - 上月快照 - 当月投资
 */
export function calculateMonthlyProfitTest(
  month: string,
  records: InvestmentRecord[]
): number {
  const monthRecords = records.filter((r) => r.date === month);
  const currentMonthInvestment = monthRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  // 获取当月快照
  const currentSnapshot = monthRecords.find((r) => r.snapshot !== undefined)?.snapshot;
  if (!currentSnapshot) {
    return 0; // 无快照，收益为0
  }

  // 获取上月快照
  const prevMonth = getPreviousMonth(month);
  const prevMonthRecords = records.filter((r) => r.date === prevMonth);
  const prevSnapshot = prevMonthRecords
    .filter((r) => r.snapshot !== undefined)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.snapshot;

  if (!prevSnapshot) {
    return 0; // 无上月快照，收益为0（首月）
  }

  const profit = parseFloat(currentSnapshot) - parseFloat(prevSnapshot) - currentMonthInvestment;
  return parseFloat(profit.toFixed(2));
}

/**
 * 获取上个月
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 2, 1); // monthNum - 2 因为Date月份从0开始
  return date.toISOString().slice(0, 7);
}

/**
 * 验证日期筛选是否正确应用
 * Verify date filtering is correctly applied
 */
export function verifyDateFiltering(
  allMonths: string[],
  displayedMonths: string[],
  dateRange: { startMonth: string | null; endMonth: string | null }
): void {
  displayedMonths.forEach((month) => {
    if (dateRange.startMonth && month < dateRange.startMonth) {
      throw new Error(`Month ${month} is before startMonth ${dateRange.startMonth}`);
    }
    if (dateRange.endMonth && month > dateRange.endMonth) {
      throw new Error(`Month ${month} is after endMonth ${dateRange.endMonth}`);
    }
  });
}

/**
 * 等待异步操作完成
 * Wait for async operations to complete
 */
export async function waitFor(condition: () => boolean, timeout: number = 1000): Promise<void> {
  const startTime = Date.now();
  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  if (!condition()) {
    throw new Error('Timeout waiting for condition');
  }
}

/**
 * 创建带默认选项的render函数
 * Create render function with default options
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // 可以在这里添加默认的Provider wrappers
  return render(ui, options);
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null
  };
}

/**
 * 验证组件是否渲染
 * Verify component is rendered
 */
export function expectComponentToBeRendered(getByText: (text: string | RegExp) => HTMLElement, text: string): void {
  const element = getByText(text);
  expect(element).toBeDefined();
  expect(element).toBeVisible();
}

/**
 * 创建日期范围
 * Create date range
 */
export function createDateRange(startMonth: string, endMonth: string): {
  startMonth: string;
  endMonth: string;
} {
  return { startMonth, endMonth };
}

/**
 * 生成月份序列
 * Generate month sequence
 */
export function generateMonths(startYear: number, startMonth: number, count: number): string[] {
  const months: string[] = [];
  let year = startYear;
  let month = startMonth;

  for (let i = 0; i < count; i++) {
    months.push(`${year}-${month.toString().padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}
