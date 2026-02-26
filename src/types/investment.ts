export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM格式
  amount: number;              // 投资金额
  snapshot?: number;           // 快照金额
  account: string;
  assetType: string; // 资产类型
  note?: string;

  // 定期存款专用字段
  isTimeDeposit?: boolean;         // 标识是否为定期存款
  depositTermMonths?: number;      // 存期（月数）
  annualInterestRate?: number;     // 年化利率（如5%传入5）
  maturityDate?: string;           // 到期日期（YYYY-MM格式）

  // 股票专用字段
  shares?: number;                 // 股数（支持小数，如港股碎股）
  sharePrice?: number;             // 每股价格
}

export interface RecordsByType {
  [assetType: string]: InvestmentRecord[];
}

export interface AssetTypeStats {
  totalInvestment: number;
  currentAssets: number;
  totalProfit: number;
  returnRate: number;
}
