export const ASSET_TYPES = ['Stocks', 'Funds', 'Bonds', 'Cash', 'Gold', 'Time Deposits', 'Others'];

export const EMOJI_ICONS = [
  '💳', '💰', '🏦', '💎', '📈', '💵', '🪙', '💼',
  '🔷', '🔶', '⭐', '🌟', '✨', '💫', '🎯', '🔔',
];

// 贵金属类型常量
export const PRECIOUS_METAL_TYPES = ['Gold', 'Silver', 'Platinum', 'Palladium'] as const;

// 贵金属颜色配置
export const METAL_COLORS = {
  Gold: '#F7931A',
  Silver: '#C0C0C0',
  Platinum: '#E5E4E2',
  Palladium: '#7B6878',
} as const;
