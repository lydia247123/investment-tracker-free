import { create } from 'zustand';
import { RiskLevel } from '../types/risk';
import { getDefaultRiskLevel } from '../utils/constants/assetRiskMapping';

interface RiskConfigState {
  getAssetRiskLevel: (assetType: string) => RiskLevel;
}

export const useRiskConfigStore = create<RiskConfigState>(() => ({
  getAssetRiskLevel: (assetType: string) => {
    // 直接使用默认映射，不再支持自定义
    return getDefaultRiskLevel(assetType);
  },
}));
