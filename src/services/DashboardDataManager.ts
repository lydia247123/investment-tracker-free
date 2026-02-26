/**
 * Dashboard 数据计算服务
 * 目标：计算一次，多处使用，避免重复计算
 *
 * 问题：每个图表组件独立计算相同的基础数据，导致大量重复计算
 * 解决：在 Dashboard 顶层一次性计算所有基础数据，图表组件直接使用
 */

import { RecordsByType } from '@types/investment';
import { RecordsByMetalType } from '@types/preciousMetal';
import {
  calculateMonthlyProfit,
  calculateMonthlyReturnByAccount,
  calculateMonthlyReturnByAssetType,
  calculatePreciousMetalMonthlyReturns,
  getAllUniqueMonthsFromReturnData,
  groupSnapshotsByAccount
} from '@utils/investmentCalculations';
import {
  calculateMonthlyMetalValues,
  calculateMonthlyAccumulatedProfit,
  calculateTotalMetalValue
} from '@utils/metalCalculations';
import { calculateTimeDepositTotalProfit } from '@utils/timeDepositCalculations';

/**
 * 日期范围类型
 */
export interface DateRange {
  startMonth: string | null;
  endMonth: string | null;
}

/**
 * Dashboard 基础数据接口
 *
 * 包含所有图表组件共享的基础计算结果
 */
export interface BaseDashboardData {
  // ========== 基础月度数据 ==========
  /** 所有唯一月份（已排序） */
  allMonths: string[];

  // ========== 普通投资数据 ==========
  /** 所有投资记录 */
  allRecords: any[];

  /** 月度收益（月份 → 收益金额） */
  monthlyProfits: Map<string, number>;

  /** 按账户分组的月度收益率数据 */
  returnDataByAccount: Array<{
    account: string;
    data: Array<{
      month: string;
      returnRate: number;
    }>;
  }>;

  /** 按投资类型分组的月度收益率数据 */
  returnDataByAssetType: Array<{
    assetType: string;
    data: Array<{
      month: string;
      returnRate: number;
    }>;
  }>;

  /** 按账户分组的快照数据 */
  snapshotsByAccount: Map<string, Array<{ date: string; snapshot: number }>>;

  /** 定期存款记录 */
  timeDepositRecords: any[];

  /** 月度总资产（月份 → 总资产，包含普通投资、定期存款、贵金属） */
  monthlyTotalAssets: Map<string, number>;

  /** 月度普通投资资产（月份 → 普通投资资产，仅包含普通投资和定期存款，不包含贵金属） */
  monthlyInvestmentAssets: Map<string, number>;

  // ========== 贵金属数据 ==========
  /** 月度贵金属资产值（月份 → {金属类型 → 总价值}） */
  monthlyMetalValues: Map<string, Record<string, number>>;

  /** 月度贵金属收益（月份 → {金属类型 → 收益}） */
  monthlyMetalProfits: Map<string, Record<string, number>>;

  /** 贵金属收益率数据 */
  metalReturnData: Array<{
    month: string;
    returnRate: number;
  }>;

  /** 贵金属记录 */
  allMetalRecords: any[];
}

/**
 * Dashboard 数据管理器
 *
 * 负责一次性计算所有 Dashboard 需要的基础数据
 */
export class DashboardDataManager {
  /**
   * 计算所有基础数据
   *
   * @param recordsByType - 按类型分组的投资记录
   * @param recordsByMetalType - 按类型分组的贵金属记录
   * @returns 所有基础数据
   */
  static calculateBaseData(
    recordsByType: RecordsByType,
    recordsByMetalType: RecordsByMetalType
  ): BaseDashboardData {
    try {
      // ========== 第1步：收集基础数据 ==========
      const safeRecordsByType = recordsByType || {};
      const safeRecordsByMetalType = recordsByMetalType || {};

      const allRecords = Object.values(safeRecordsByType)
        .filter(Array.isArray)
        .flat()
        .filter(r => r && typeof r === 'object');

      const allMetalRecords = Object.values(safeRecordsByMetalType)
        .filter(Array.isArray)
        .flat()
        .filter(r => r && typeof r === 'object');

      const timeDepositRecords = allRecords.filter(r => r.isTimeDeposit === true);

      // ========== 第2步：计算所有唯一月份 ==========
      const allMonthsSet = new Set<string>();

      // 从投资记录中提取月份
      allRecords.forEach(record => {
        if (record.date) allMonthsSet.add(record.date);
      });

      // 从贵金属记录中提取月份
      allMetalRecords.forEach(record => {
        if (record.date) allMonthsSet.add(record.date);
      });

      const allMonths = Array.from(allMonthsSet).sort();

      // ========== 第3步：计算月度收益（普通投资） ==========
      const monthlyProfits = new Map<string, number>();

      allMonths.forEach(month => {
        const profit = calculateMonthlyProfit(month, allRecords);
        monthlyProfits.set(month, profit);
      });

      // ========== 第4步：计算按账户分组的月度收益率 ==========
      const returnDataByAccount = calculateMonthlyReturnByAccount(safeRecordsByType) || [];

      // ========== 第5步：计算按投资类型分组的月度收益率 ==========
      const returnDataByAssetType = calculateMonthlyReturnByAssetType(safeRecordsByType) || [];

      // ========== 第6步：按账户分组快照数据 ==========
      const snapshotsByAccount = groupSnapshotsByAccount(
        allRecords.filter(r => r.snapshot !== undefined)
      ) || new Map();

      // ========== 第7步：计算月度总资产 ==========
      const monthlyTotalAssets = new Map<string, number>();
      const monthlyInvestmentAssets = new Map<string, number>();

      allMonths.forEach(month => {
        let totalAssets = 0;
        let investmentAssets = 0;

        // 汇总普通投资快照（排除定期存款，定期存款在下面单独处理）
        const recordsByAccount = new Map<string, any[]>();
        allRecords
          .filter(r => r.date <= month && !r.isTimeDeposit)
          .forEach(r => {
            if (!recordsByAccount.has(r.account)) recordsByAccount.set(r.account, []);
            recordsByAccount.get(r.account)!.push(r);
          });

        recordsByAccount.forEach(accRecords => {
          if (!Array.isArray(accRecords) || accRecords.length === 0) return;
          const sortedAccRecords = [...accRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          const latest = sortedAccRecords[0];
          const value = latest && latest.snapshot !== undefined
            ? latest.snapshot
            : accRecords.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);

          totalAssets += value;
          investmentAssets += value;
        });

        // 汇总定期存款（本金 + 利息）
        timeDepositRecords.filter(r => r.date <= month).forEach(record => {
          const totalProfit = calculateTimeDepositTotalProfit(record, month);
          const currentValue = (Number(record.amount) || 0) + (Number(totalProfit) || 0);
          totalAssets += currentValue;
          investmentAssets += currentValue;
        });

        // 汇总贵金属（仅添加到总资产，不添加到普通投资资产）
        const metalValue = calculateTotalMetalValue(safeRecordsByMetalType, month);
        totalAssets += metalValue;

        monthlyTotalAssets.set(month, totalAssets);
        monthlyInvestmentAssets.set(month, investmentAssets);
      });

      // ========== 第8步：计算贵金属数据 ==========
      const monthlyMetalValues = new Map<string, Record<string, number>>();
      const monthlyMetalProfits = new Map<string, Record<string, number>>();

      allMonths.forEach(month => {
        // 计算月度贵金属资产值
        const metalValues = calculateMonthlyMetalValues(safeRecordsByMetalType, month) || {};
        monthlyMetalValues.set(month, metalValues);

        // 计算月度贵金属收益
        const metalProfits = calculateMonthlyAccumulatedProfit(safeRecordsByMetalType, month) || {};
        monthlyMetalProfits.set(month, metalProfits);
      });

      // ========== 第9步：计算贵金属收益率 ==========
      const metalReturnData = calculatePreciousMetalMonthlyReturns(safeRecordsByMetalType) || [];

      return {
        allMonths,
        allRecords,
        monthlyProfits,
        returnDataByAccount,
        returnDataByAssetType,
        snapshotsByAccount,
        timeDepositRecords,
        monthlyTotalAssets,
        monthlyInvestmentAssets,
        monthlyMetalValues,
        monthlyMetalProfits,
        metalReturnData,
        allMetalRecords
      };
    } catch (error) {
      console.error('❌ [DashboardDataManager] Critical error in base data calculation:', error);
      // Return minimal usable structure to prevent downstream crashes
      return {
        allMonths: [],
        allRecords: [],
        monthlyProfits: new Map(),
        returnDataByAccount: [],
        returnDataByAssetType: [],
        snapshotsByAccount: new Map(),
        timeDepositRecords: [],
        monthlyTotalAssets: new Map(),
        monthlyInvestmentAssets: new Map(),
        monthlyMetalValues: new Map(),
        monthlyMetalProfits: new Map(),
        metalReturnData: [],
        allMetalRecords: []
      };
    }
  }

  /**
   * 根据日期范围筛选月份
   *
   * @param allMonths - 所有月份
   * @param dateRange - 日期范围
   * @returns 筛选后的月份
   */
  static filterMonthsByDateRange(
    allMonths: string[],
    dateRange: DateRange | undefined
  ): string[] {
    if (!dateRange || (!dateRange.startMonth && !dateRange.endMonth)) {
      return allMonths;
    }

    return allMonths.filter(month => {
      if (dateRange.startMonth && month < dateRange.startMonth) return false;
      if (dateRange.endMonth && month > dateRange.endMonth) return false;
      return true;
    });
  }

  /**
   * 获取所有唯一月份（从收益率数据中提取）
   *
   * @param returnDataByAccount - 按账户分组的收益率数据
   * @returns 所有唯一月份
   */
  static getAllMonthsFromReturnData(
    returnDataByAccount: BaseDashboardData['returnDataByAccount']
  ): string[] {
    return getAllUniqueMonthsFromReturnData(returnDataByAccount);
  }

  /**
   * 计算指定月份的贵金属总市值
   *
   * @param recordsByMetalType - 按类型分组的贵金属记录
   * @param month - 月份
   * @returns 贵金属总市值
   */
  static calculateMetalTotalValue(
    recordsByMetalType: RecordsByMetalType,
    month: string
  ): number {
    return calculateTotalMetalValue(recordsByMetalType, month);
  }
}
