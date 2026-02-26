import { RecordsByMetalType } from '@types/preciousMetal';

/**
 * 数据迁移：为贵金属记录添加账户字段
 *
 * 为所有没有 account 字段的贵金属记录添加默认账户
 *
 * @param recordsByMetalType - 按类型分组的贵金属记录
 * @param defaultAccount - 默认账户名称
 * @returns 迁移后的记录和迁移数量
 */
export function addAccountToPreciousMetals(
  recordsByMetalType: RecordsByMetalType,
  defaultAccount: string
): {
  migrated: RecordsByMetalType;
  count: number;
} {
  let migratedCount = 0;
  const migrated = JSON.parse(JSON.stringify(recordsByMetalType)) as RecordsByMetalType;

  Object.keys(migrated).forEach(metalType => {
    migrated[metalType] = migrated[metalType].map(record => {
      // 如果没有 account 字段，添加默认账户
      if (!record.account) {
        console.log(`🔧 迁移贵金属记录: ${record.date} | ${record.metalType} | ${record.grams}克`);
        migratedCount++;
        return { ...record, account: defaultAccount };
      }
      return record;
    });
  });

  if (migratedCount > 0) {
    console.log(`✅ 数据迁移完成：为 ${migratedCount} 条贵金属记录添加了账户`);
  }

  return { migrated, count: migratedCount };
}
