/**
 * 数字格式化工具函数
 * 用于处理统计卡中数字的显示问题
 */

/**
 * 根据数字字符串长度获取对应的 Tailwind 字体类
 * 解决长数字被遮挡的问题
 *
 * @param value - 数字字符串（如 "¥123456.78" 或 "12.34%"）
 * @returns Tailwind CSS 字体类名
 *
 * @example
 * getNumberFontSizeClass("¥1,234.56")  // "text-2xl" (24px)
 * getNumberFontSizeClass("¥123,456,789.01")  // "text-xl" (20px)
 * getNumberFontSizeClass("¥123,456,789,012.34")  // "text-lg" (18px)
 * getNumberFontSizeClass("¥123,456,789,012,345.67")  // "text-base" (16px)
 */
export function getNumberFontSizeClass(value: string): string {
  const length = value.length;

  // 根据字符串长度返回合适的字体类
  if (length <= 10) return 'text-2xl';      // 24px - 短数字，正常大小
  if (length <= 14) return 'text-xl';       // 20px - 中等数字，稍微缩小
  if (length <= 18) return 'text-lg';       // 18px - 长数字，明显缩小
  return 'text-base';                       // 16px - 超长数字，最小但仍可读
}
