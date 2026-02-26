/**
 * 图表颜色管理工具
 * 用于为不同账户分配一致且可区分的颜色
 */

/**
 * 预定义的颜色调色板
 * 选择了一组视觉上易于区分的颜色
 */
export const ACCOUNT_COLORS = [
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
] as const;

/**
 * 根据索引获取账户颜色
 * @param accountName - 账户名称（用于未来的哈希实现）
 * @param index - 账户在列表中的索引
 * @returns 颜色值（十六进制字符串）
 */
export function getAccountColor(accountName: string, index: number): string {
  return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}

/**
 * 为多个账户分配颜色
 * @param accountNames - 账户名称数组
 * @returns Map<账户名称, 颜色值>
 */
export function getAccountColors(accountNames: string[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  accountNames.forEach((account, index) => {
    colorMap.set(account, getAccountColor(account, index));
  });
  return colorMap;
}
