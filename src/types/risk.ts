/**
 * 5级风险等级枚举
 */
export enum RiskLevel {
  LOW = 'low',                // 低风险
  MEDIUM_LOW = 'medium_low',  // 中低风险
  MEDIUM = 'medium',          // 中风险
  MEDIUM_HIGH = 'medium_high',// 中高风险
  HIGH = 'high'               // 高风险
}

/**
 * 风险等级配置接口
 */
export interface RiskLevelConfig {
  level: RiskLevel;
  name: string;           // 中文名称
  color: string;          // 颜色标识（hex）
  bgColor: string;        // 背景颜色类名
  textColor: string;      // 文本颜色类名
  description: string;    // 描述说明
  shortDescription: string; // 简短描述（1-2词）
  volatility: string;     // 预期波动范围
  order: number;          // 排序序号（1-5）
}

/**
 * 资产类型风险映射接口
 */
export interface AssetTypeRiskMapping {
  assetType: string;       // 资产类型名称
  riskLevel: RiskLevel;    // 风险等级
}

/**
 * 风险分析数据接口
 */
export interface RiskAnalysisData {
  riskLevel: RiskLevel;
  totalAssets: number;     // 该风险等级的总资产
  percentage: number;      // 占总资产百分比
  assetTypes: string[];    // 包含的资产类型
  assetCount: number;      // 资产项目数量
}
