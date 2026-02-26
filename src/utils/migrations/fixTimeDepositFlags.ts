import { RecordsByType } from '@types/investment';

/**
 * 数据迁移：修复定期存款标记
 *
 * 检查所有投资记录，如果记录有定期存款参数（depositTermMonths 和 annualInterestRate）
 * 但 isTimeDeposit 不是 true，则自动将其标记为定期存款
 *
 * @param recordsByType - 按类型分组的投资记录
 * @returns 修复后的记录和修复数量
 */
export function fixTimeDepositFlags(recordsByType: RecordsByType): {
  fixed: RecordsByType;
  count: number;
} {
  let fixedCount = 0;
  const fixed = JSON.parse(JSON.stringify(recordsByType)) as RecordsByType;

  Object.keys(fixed).forEach(assetType => {
    fixed[assetType] = fixed[assetType].map(record => {
      // 如果有定期存款参数但 isTimeDeposit 不是 true，自动标记
      if (
        record.depositTermMonths &&
        record.annualInterestRate &&
        record.isTimeDeposit !== true
      ) {
        console.log(`🔧 修复定期存款标记: ${record.date} | ${record.account} | ¥${record.amount}`);
        fixedCount++;
        return { ...record, isTimeDeposit: true };
      }
      return record;
    });
  });

  if (fixedCount > 0) {
    console.log(`✅ 数据迁移完成：修复了 ${fixedCount} 条定期存款记录的标记`);
  }

  return { fixed, count: fixedCount };
}
