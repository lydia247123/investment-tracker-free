import { useState, useEffect } from 'react';
import { PreciousMetalRecord, PreciousMetalType } from '@types/preciousMetal';
import { formatMonth, formatCurrency } from '@utils/formatters';
import { useAccountStore } from '@store/accountStore';

interface EditMetalRecordDialogProps {
  record: PreciousMetalRecord;
  onClose: () => void;
  onUpdate: (metalType: PreciousMetalType, recordId: string, updatedRecord: PreciousMetalRecord) => void;
}

export const EditMetalRecordDialog: React.FC<EditMetalRecordDialogProps> = ({
  record,
  onClose,
  onUpdate
}) => {
  const { accounts } = useAccountStore();
  const [grams, setGrams] = useState(record.grams.toString());
  const [pricePerGram, setPricePerGram] = useState(record.pricePerGram.toString());
  const [averagePrice, setAveragePrice] = useState(record.averagePrice.toString());
  const [note, setNote] = useState(record.note || '');
  const [date, setDate] = useState(record.date); // 可编辑日期
  const [account, setAccount] = useState(record.account || ''); // 新增：账户状态

  // 购买总额预览
  const totalAmount = grams && pricePerGram
    ? (parseFloat(grams) * parseFloat(pricePerGram)).toFixed(2)
    : '0.00';

  const parseValue = (value: string): number => {
    const num = parseFloat(value);
    if (!value.includes('.') || value.endsWith('.0') || value.endsWith('.00')) {
      return Math.round(num);
    }
    return Math.round(num * 100) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!grams || !pricePerGram || !averagePrice) {
      alert('请填写所有必填项');
      return;
    }

    const gramsValue = parseFloat(grams);
    const pricePerGramValue = parseFloat(pricePerGram);
    const averagePriceValue = parseFloat(averagePrice);

    if (isNaN(gramsValue) || gramsValue <= 0) {
      alert('购买克数必须为有效数字且大于0');
      return;
    }

    if (isNaN(pricePerGramValue) || pricePerGramValue <= 0) {
      alert('每克购买金额必须为有效数字且大于0');
      return;
    }

    if (isNaN(averagePriceValue) || averagePriceValue <= 0) {
      alert('当月市场均价必须为有效数字且大于0');
      return;
    }

    const updatedRecord: PreciousMetalRecord = {
      ...record, // 保持原 ID、贵金属类型
      date, // 使用编辑后的日期
      account, // 新增：使用编辑后的账户
      grams: parseValue(grams),
      pricePerGram: parseValue(pricePerGram),
      averagePrice: parseValue(averagePrice),
      note: note.trim() || undefined,
    };

    onUpdate(record.metalType, record.id, updatedRecord);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">✏️ 编辑贵金属记录</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 贵金属类型显示（只读） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">贵金属类型</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                {record.metalType}
              </span>
            </div>
          </div>

          {/* 账户选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户 *</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.name} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* 月份选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月份 *</label>
            <input
              type="month"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 修改日期会影响收益计算和历史数据统计
            </p>
          </div>

          {/* 购买克数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">购买克数 (克) *</label>
            <input
              type="number"
              step="0.01"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="请输入购买克数"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* 每克购买金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">每克购买金额 (¥) *</label>
            <input
              type="number"
              step="0.01"
              value={pricePerGram}
              onChange={(e) => setPricePerGram(e.target.value)}
              placeholder="请输入每克购买金额"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* 购买总额预览 */}
          {(grams && pricePerGram) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm text-amber-800">
                <span className="font-medium">购买总额：{formatCurrency(parseFloat(totalAmount))}</span>
              </div>
            </div>
          )}

          {/* 当月市场均价 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当月市场均价 (¥/克) *
            </label>
            <input
              type="number"
              step="0.01"
              value={averagePrice}
              onChange={(e) => setAveragePrice(e.target.value)}
              placeholder="请输入当月市场均价"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 市场均价用于计算收益
            </p>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选备注"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              保存修改
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
