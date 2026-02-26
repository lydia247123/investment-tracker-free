import { useState, useEffect } from 'react';
import { InvestmentRecord } from '@types/investment';
import { useAccountStore } from '@store/accountStore';
import { formatMonth, formatCurrency } from '@utils/formatters';

interface EditRecordDialogProps {
  record: InvestmentRecord;
  onClose: () => void;
  onUpdate: (assetType: string, recordId: string, updatedRecord: InvestmentRecord) => void;
}

export const EditRecordDialog: React.FC<EditRecordDialogProps> = ({
  record,
  onClose,
  onUpdate
}) => {
  const { accounts } = useAccountStore();

  const initialAmount = record.amount.toString();
  const initialSnapshot = record.snapshot?.toString() || '';

  const [amount, setAmount] = useState(initialAmount);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedAccount, setSelectedAccount] = useState(record.account);
  const [note, setNote] = useState(record.note || '');
  const [date, setDate] = useState(record.date); // 可编辑日期

  // 股票相关状态
  const [shares, setShares] = useState('');
  const [sharePrice, setSharePrice] = useState('');

  // 卖出资产相关状态
  const [sellAmount, setSellAmount] = useState('');
  const [addSellNote, setAddSellNote] = useState(true);

  // 确保账户存在
  useEffect(() => {
    if (accounts.length > 0 && !accounts.find(a => a.name === selectedAccount)) {
      setSelectedAccount(accounts[0].name);
    }
  }, [accounts, selectedAccount]);

  // 初始化股票数据
  useEffect(() => {
    if (record.assetType === 'Stocks' && record.shares && record.sharePrice) {
      setShares(record.shares.toString());
      setSharePrice(record.sharePrice.toString());
    } else {
      setShares('');
      setSharePrice('');
    }
  }, [record]);

  const parseAmount = (value: string): number => {
    const num = parseFloat(value);
    if (!value.includes('.') || value.endsWith('.0') || value.endsWith('.00')) {
      return Math.round(num);
    }
    return Math.round(num * 100) / 100;
  };

  const handleApplySell = () => {
    const sellAmountValue = parseFloat(sellAmount);
    const currentSnapshot = parseFloat(snapshot);

    // 1. 验证卖出金额
    if (!sellAmount || isNaN(sellAmountValue) || sellAmountValue <= 0) {
      alert('Please enter a valid sell amount');
      return;
    }

    if (snapshot && isNaN(currentSnapshot)) {
      alert('Current snapshot amount is invalid. Please set the snapshot amount first');
      return;
    }

    if (snapshot && sellAmountValue > currentSnapshot) {
      alert('Sell amount cannot exceed the current snapshot amount');
      return;
    }

    // 2. 计算新的快照金额
    const newSnapshot = currentSnapshot - sellAmountValue;

    // 3. 更新快照输入框
    setSnapshot(newSnapshot.toString());

    // 4. 如果勾选了"在备注中添加卖出标记"
    if (addSellNote) {
      const sellNote = `Sold $${sellAmountValue.toFixed(2)}`;
      setNote(note ? `${note}; ${sellNote}` : sellNote);
    }

    // 5. 清空卖出金额输入框
    setSellAmount('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !selectedAccount) {
      alert('Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < 0) {
      alert('Investment amount must be a valid number and cannot be negative');
      return;
    }

    if (snapshot) {
      const snapshotValue = parseFloat(snapshot);
      if (isNaN(snapshotValue) || snapshotValue < 0) {
        alert('Snapshot amount must be a valid number and cannot be negative');
        return;
      }
    }

    const finalAmount = parseAmount(amount);
    const finalSnapshot = snapshot ? parseAmount(snapshot) : undefined;

    const updatedRecord: InvestmentRecord = {
      ...record, // 保持原 ID、资产类型
      date, // 使用编辑后的日期
      amount: finalAmount,
      snapshot: finalSnapshot,
      account: selectedAccount,
      note: note.trim() || undefined,
      ...(record.assetType === 'Stocks' && shares && sharePrice && {
        shares: parseFloat(shares),
        sharePrice: parseFloat(sharePrice),
      }),
    };

    onUpdate(record.assetType, record.id, updatedRecord);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">✏️ Edit Investment Record</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 资产类型显示（只读） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                {record.assetType}
              </span>
            </div>
          </div>

          {/* 月份选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
            <input
              type="month"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Changing the date will affect profit calculation and historical data statistics
            </p>
          </div>

          {/* 投资金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter investment amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 股票专用：股数和每股价格 */}
          {record.assetType === 'Stocks' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shares
                  <span className="ml-2 text-xs text-gray-500">(Decimals supported, leave empty to not modify)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={shares}
                  onChange={(e) => {
                    setShares(e.target.value);
                    const newShares = parseFloat(e.target.value);
                    const price = parseFloat(sharePrice);
                    if (!isNaN(newShares) && !isNaN(price) && newShares > 0 && price > 0) {
                      const calculatedAmount = (newShares * price).toFixed(2);
                      setAmount(calculatedAmount);
                    }
                  }}
                  placeholder="Enter number of shares (decimals supported)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Share ($)
                  <span className="ml-2 text-xs text-gray-500">(Leave empty to not modify)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sharePrice}
                  onChange={(e) => {
                    setSharePrice(e.target.value);
                    const newPrice = parseFloat(e.target.value);
                    const sh = parseFloat(shares);
                    if (!isNaN(newPrice) && !isNaN(sh) && newPrice > 0 && sh > 0) {
                      const calculatedAmount = (sh * newPrice).toFixed(2);
                      setAmount(calculatedAmount);
                    }
                  }}
                  placeholder="Enter price per share"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 实时计算提示 */}
              {shares && sharePrice && (
                <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-calculated investment amount:</span>
                    <div className="text-right">
                      <span className="font-bold text-purple-700 text-lg">
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

          {/* 快照金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Snapshot Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={snapshot}
              onChange={(e) => setSnapshot(e.target.value)}
              placeholder="Enter snapshot amount for the month"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Snapshot amount is used to record the actual total assets for the month
            </p>
          </div>

          {/* 卖出资产区域 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="font-medium text-orange-800">🔄 Sell Assets (Optional)</div>

            {/* 卖出金额输入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter sell amount if you sold part of your assets"
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* 实时计算显示 */}
            {sellAmount && !isNaN(parseFloat(sellAmount)) && parseFloat(sellAmount) > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current snapshot:</span>
                  <span className="font-medium text-gray-900">
                    {snapshot ? formatCurrency(parseFloat(snapshot)) : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Sell amount:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(parseFloat(sellAmount))}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-1 mt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Snapshot after sale:</span>
                    <span className="font-bold text-blue-600">
                      {snapshot ? formatCurrency(parseFloat(snapshot) - parseFloat(sellAmount)) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 应用卖出按钮和备注标记 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={addSellNote}
                  onChange={(e) => setAddSellNote(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Add sell marker in note</span>
              </label>
              <button
                type="button"
                onClick={handleApplySell}
                disabled={!sellAmount || isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) <= 0}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Apply Sell
              </button>
            </div>
          </div>

          {/* 账户选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {accounts.map((account) => (
                <option key={account.name} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
