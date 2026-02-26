import { RiskLevel, AssetTypeRiskMapping } from '../../types/risk';

/**
 * 默认资产类型风险映射
 *
 * 设计原则：
 * - 现金类：低风险
 * - 债券类：中低风险
 * - 贵金属：中风险（波动较大但长期保值）
 * - 基金类：中风险
 * - 股票类：高风险
 */
export const DEFAULT_ASSET_RISK_MAPPING: AssetTypeRiskMapping[] = [
  // 投资类型
  { assetType: '现金', riskLevel: RiskLevel.LOW },
  { assetType: '定期存款', riskLevel: RiskLevel.LOW },
  { assetType: '债券', riskLevel: RiskLevel.MEDIUM_LOW },
  { assetType: '黄金', riskLevel: RiskLevel.MEDIUM },
  { assetType: '基金', riskLevel: RiskLevel.MEDIUM },
  { assetType: '股票', riskLevel: RiskLevel.HIGH },
  { assetType: '其他', riskLevel: RiskLevel.MEDIUM },

  // 贵金属类型
  { assetType: '黄金', riskLevel: RiskLevel.MEDIUM },
  { assetType: '白银', riskLevel: RiskLevel.MEDIUM_HIGH },
  { assetType: '铂金', riskLevel: RiskLevel.MEDIUM_HIGH },
  { assetType: '钯金', riskLevel: RiskLevel.HIGH },
];

/**
 * 获取资产类型的默认风险等级
 */
export function getDefaultRiskLevel(assetType: string): RiskLevel {
  const mapping = DEFAULT_ASSET_RISK_MAPPING.find(m => m.assetType === assetType);
  return mapping?.riskLevel || RiskLevel.MEDIUM;
}
