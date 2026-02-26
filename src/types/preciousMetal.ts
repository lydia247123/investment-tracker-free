export type PreciousMetalType = '黄金' | '白银' | '铂金' | '钯金';

export interface PreciousMetalRecord {
  id: string;
  date: string;                    // YYYY-MM格式
  metalType: PreciousMetalType;    // 贵金属类型
  account: string;                 // 账户名称
  grams: number;                   // 购买克数
  pricePerGram: number;            // 每克购买金额
  averagePrice: number;            // 当月市场均价（用户输入）
  note?: string;                   // 备注
}

export interface RecordsByMetalType {
  [metalType: string]: PreciousMetalRecord[];
}

export interface MetalTypeStats {
  totalGrams: number;              // 累计购买克数
  totalAmount: number;             // 累计购买金额
  currentValue: number;            // 当前市值（当月均价 × 累计克数）
  monthlyProfit: number;           // 月度收益
  totalProfit: number;             // 整体收益
}
