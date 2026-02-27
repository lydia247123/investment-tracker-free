import { useState, useEffect } from 'react';
import { useInvestmentStore } from '@store/investmentStore';
import { useAccountStore } from '@store/accountStore';
import { InvestmentRecord } from '@types/investment';
import { calculateMaturityDate } from '@utils/timeDepositCalculations';
import { formatMonth } from '@utils/formatters';

const DEFAULT_ASSET_TYPES = ['Stocks', 'Funds', 'Bonds', 'Time Deposits', 'Others'] as const;

interface AddRecordFormProps {
  initialAssetType?: string; // 可选的初始类型
}

export const AddRecordForm: React.FC<AddRecordFormProps> = ({ initialAssetType }) => {
  const [selectedAssetType, setSelectedAssetType] = useState(initialAssetType || 'Stocks');
  const { addRecord, recordsByType } = useInvestmentStore();
  const { accounts } = useAccountStore();

  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');
  const [snapshot, setSnapshot] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.name || '');
  const [note, setNote] = useState('');
  const [depositTerm, setDepositTerm] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [shares, setShares] = useState('');
  const [sharePrice, setSharePrice] = useState('');
  // 新增：股票输入方式：'amount' | 'shares'
  const [stockInputMethod, setStockInputMethod] = useState<'amount' | 'shares'>('amount');

  useEffect(() => {
    // 优先使用上次输入的月份
    const lastMonth = localStorage.getItem('lastInvestmentMonth');
    if (lastMonth) {
      setMonth(lastMonth);
      return;
    }

    // 如果没有记忆的月份，自动填充下个月
    const records = recordsByType[selectedAssetType] || [];
    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      const nextMonth = new Date(lastRecord.date + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setMonth(nextMonth.toISOString().slice(0, 7));
    } else {
      setMonth(new Date().toISOString().slice(0, 7));
    }
  }, [selectedAssetType, recordsByType]);

  useEffect(() => {
    // Use first account as default
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].name);
    }
  }, [accounts]);

  // Generate month options (past 12 months to future 12 months)
  const generateMonthOptions = (): string[] => {
    const months: string[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Generate past 12 months
    for (let i = 12; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i - 1, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    // Generate future 12 months
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth + i - 1, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    return months;
  };

  // When asset type switches, reset stock-related fields and input method
  useEffect(() => {
    if (selectedAssetType !== 'Stocks') {
      setShares('');
      setSharePrice('');
      setStockInputMethod('amount'); // Reset to default method
    }
  }, [selectedAssetType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !amount || !selectedAccount) {
      alert('Please fill in all required fields');
      return;
    }

    // 处理金额：确保精度正确，避免浮点数问题
    const parseAmount = (value: string): number => {
      const num = parseFloat(value);
      // 如果输入是整数（没有小数点或小数点后都是0），返回整数
      if (!value.includes('.') || value.endsWith('.0') || value.endsWith('.00')) {
        return Math.round(num);
      }
      // 否则保留两位小数
      return Math.round(num * 100) / 100;
    };

    const inputAmount = parseAmount(amount);
    const finalAmount = inputAmount;

    // Parse snapshot
    let snapshotValue: number | undefined;
    if (snapshot) {
      snapshotValue = parseAmount(snapshot);
    }

    const record: InvestmentRecord = {
      id: `${selectedAssetType}-${Date.now()}`,
      date: month,
      amount: finalAmount,
      snapshot: snapshotValue,
      account: selectedAccount,
      assetType: selectedAssetType,
      note: note.trim() || undefined,
      ...(selectedAssetType === 'Time Deposits' && {
        isTimeDeposit: true,
        depositTermMonths: parseInt(depositTerm),
        annualInterestRate: parseFloat(annualInterestRate),
        maturityDate: calculateMaturityDate(month, parseInt(depositTerm)),
      }),
      ...(selectedAssetType === 'Stocks' && shares && sharePrice && {
        shares: parseFloat(shares),
        sharePrice: parseFloat(sharePrice),
      }),
    };

    addRecord(selectedAssetType, record);

    // Save current month to localStorage
    localStorage.setItem('lastInvestmentMonth', month);

    // Reset form
    setAmount('');
    setSnapshot('');
    setNote('');
    setDepositTerm('');
    setAnnualInterestRate('');
    setShares('');
    setSharePrice('');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Investment Record</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Investment type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type *</label>
          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            {DEFAULT_ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Month selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Select Month</option>
            {generateMonthOptions().map(monthOption => (
              <option key={monthOption} value={monthOption}>
                {formatMonth(monthOption)}
              </option>
            ))}
          </select>
        </div>

        {/* Stock-specific: input method selection */}
        {selectedAssetType === 'Stocks' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Method *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="stockInputMethod"
                  value="amount"
                  checked={stockInputMethod === 'amount'}
                  onChange={(e) => setStockInputMethod('amount')}
                  className="mr-2"
                />
                <span className="text-sm">Enter investment amount directly</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="stockInputMethod"
                  value="shares"
                  checked={stockInputMethod === 'shares'}
                  onChange={(e) => setStockInputMethod('shares')}
                  className="mr-2"
                />
                <span className="text-sm">Calculate by shares (recommended for newly purchased stocks)</span>
              </label>
            </div>
          </div>
        )}

        {/* Stock-specific: shares and price per share */}
        {selectedAssetType === 'Stocks' && stockInputMethod === 'shares' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Shares
                <span className="ml-2 text-xs text-gray-500">
                  (Decimals supported, e.g., odd lots in HK stocks)
                  {stockInputMethod === 'shares' && ' * Required'}
                  {stockInputMethod === 'amount' && ' (Optional, for record only)'}
                </span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={shares}
                onChange={(e) => {
                  setShares(e.target.value);
                  // Only auto-update amount in "Calculate by shares" mode
                  if (stockInputMethod === 'shares') {
                    const newShares = parseFloat(e.target.value);
                    const price = parseFloat(sharePrice);
                    if (!isNaN(newShares) && !isNaN(price) && newShares > 0 && price > 0) {
                      const calculatedAmount = (newShares * price).toFixed(2);
                      setAmount(calculatedAmount);
                    }
                  }
                }}
                placeholder="Enter number of shares (decimals supported)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required={stockInputMethod === 'shares'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Per Share ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={sharePrice}
                onChange={(e) => {
                  setSharePrice(e.target.value);
                  // Only auto-update amount in "Calculate by shares" mode
                  if (stockInputMethod === 'shares') {
                    const newPrice = parseFloat(e.target.value);
                    const sh = parseFloat(shares);
                    if (!isNaN(newPrice) && !isNaN(sh) && newPrice > 0 && sh > 0) {
                      const calculatedAmount = (sh * newPrice).toFixed(2);
                      setAmount(calculatedAmount);
                    }
                  }
                }}
                placeholder="Enter price per share"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required={stockInputMethod === 'shares'}
              />
            </div>

            {/* Real-time calculation hint */}
            {shares && sharePrice && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auto-calculated investment amount:</span>
                  <div className="text-right">
                    <span className="font-bold text-green-700 text-lg">
                      ${(parseFloat(shares) * parseFloat(sharePrice)).toFixed(2)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {shares} shares × ${sharePrice}/share
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Investment amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Investment Amount ($) *
            {stockInputMethod === 'shares' && selectedAssetType === 'Stocks' && (
              <span className="ml-2 text-xs text-green-600">(Auto-calculated from shares × price per share)</span>
            )}
            {stockInputMethod === 'amount' && selectedAssetType === 'Stocks' && (
              <span className="ml-2 text-xs text-gray-500">(Can enter 0, for snapshot only)</span>
            )}
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter investment amount (can be 0)"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              stockInputMethod === 'shares' && selectedAssetType === 'Stocks'
                ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
                : 'border-gray-300'
            }`}
            required
            readOnly={stockInputMethod === 'shares' && selectedAssetType === 'Stocks'}
          />
        </div>

        {/* Snapshot amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Snapshot Amount ($)
            <span className="ml-2 text-xs text-gray-500">(Optional, to record actual total assets for the month)</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={snapshot}
            onChange={(e) => setSnapshot(e.target.value)}
            placeholder="Enter snapshot amount for the month"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Snapshot amount is used to record the actual total assets for the month, facilitating future comparison and return rate calculation
          </p>
        </div>

        {/* Time deposit-specific fields */}
        {selectedAssetType === 'Time Deposits' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Term (Months) *</label>
              <input
                type="number"
                value={depositTerm}
                onChange={(e) => setDepositTerm(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                value={annualInterestRate}
                onChange={(e) => setAnnualInterestRate(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              {amount && annualInterestRate && (
                <p className="mt-1 text-xs text-gray-500">
                  Monthly profit = ${(parseFloat(amount) * (parseFloat(annualInterestRate) / 100 / 12)).toFixed(2)}
                </p>
              )}
            </div>

            {depositTerm && month && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-gray-600">Expected maturity date:</span>
                <span className="ml-2 font-semibold text-blue-700">
                  {calculateMaturityDate(month, parseInt(depositTerm))}
                </span>
              </div>
            )}
          </>
        )}

        {/* Account selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            {accounts.map((account) => (
              <option key={account.name} value={account.name}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          Add Record
        </button>
      </form>
    </div>
  );
};
