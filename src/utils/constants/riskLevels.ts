import { RiskLevel, RiskLevelConfig } from '../../types/risk';

/**
 * 5级风险等级完整配置
 */
export const RISK_LEVELS_CONFIG: Record<RiskLevel, RiskLevelConfig> = {
  [RiskLevel.LOW]: {
    level: RiskLevel.LOW,
    name: 'Low Risk',
    color: '#10B981',            // emerald-500
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    description: 'Capital preservation focused, stable returns',
    shortDescription: 'Stable',
    volatility: '< 2%',
    order: 1
  },
  [RiskLevel.MEDIUM_LOW]: {
    level: RiskLevel.MEDIUM_LOW,
    name: 'Medium-Low Risk',
    color: '#14B8A6',            // teal-500
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    description: 'Lower risk, steady returns',
    shortDescription: 'Lower risk',
    volatility: '2% - 5%',
    order: 2
  },
  [RiskLevel.MEDIUM]: {
    level: RiskLevel.MEDIUM,
    name: 'Medium Risk',
    color: '#F59E0B',            // amber-500
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    description: 'Moderate risk, fluctuating returns',
    shortDescription: 'Moderate',
    volatility: '5% - 15%',
    order: 3
  },
  [RiskLevel.MEDIUM_HIGH]: {
    level: RiskLevel.MEDIUM_HIGH,
    name: 'Medium-High Risk',
    color: '#F97316',            // orange-500
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    description: 'Higher risk, uncertain returns',
    shortDescription: 'Higher risk',
    volatility: '15% - 21%',
    order: 4
  },
  [RiskLevel.HIGH]: {
    level: RiskLevel.HIGH,
    name: 'High Risk',
    color: '#EF4444',            // red-500
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    description: 'High risk, potential for large losses',
    shortDescription: 'High volatility',
    volatility: '30%+',
    order: 5
  }
};

/**
 * 获取风险等级配置
 */
export function getRiskLevelConfig(level: RiskLevel): RiskLevelConfig {
  return RISK_LEVELS_CONFIG[level];
}

/**
 * 获取所有风险等级（按序号排序）
 */
export function getAllRiskLevels(): RiskLevelConfig[] {
  return Object.values(RISK_LEVELS_CONFIG)
    .sort((a, b) => a.order - b.order);
}
