import { useState, useEffect, useRef } from 'react';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { useAccountStore } from '@store/accountStore';
import { PreciousMetalRecord, PreciousMetalType } from '@types/preciousMetal';
import { formatMonth } from '@utils/formatters';

const METAL_TYPES: PreciousMetalType[] = ['Gold', 'Silver', 'Platinum', 'Palladium'];

interface MetalRecordFormProps {
  metalType: PreciousMetalType;
}

export const MetalRecordForm: React.FC<MetalRecordFormProps> = ({ metalType }) => {
  const { addRecord, recordsByMetalType } = usePreciousMetalStore();
  const { accounts } = useAccountStore();

  const [selectedMetalType, setSelectedMetalType] = useState<PreciousMetalType>(metalType);
  const [month, setMonth] = useState('');
  const monthPickerRef = useRef<HTMLInputElement>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.name || '');
  const [grams, setGrams] = useState('');
  const [pricePerGram, setPricePerGram] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [note, setNote] = useState('');

  // 计算购买总额预览
  const totalAmount = grams && pricePerGram
    ? (parseFloat(grams) * parseFloat(pricePerGram)).toFixed(2)
    : '0.00';

  useEffect(() => {
    setSelectedMetalType(metalType);
  }, [metalType]);

  // Sync with first account
  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].name);
    }
  }, [accounts]);

  useEffect(() => {
    // 优先使用上次输入的月份
    const lastMonth = localStorage.getItem('lastMetalMonth');
    if (lastMonth) {
      setMonth(lastMonth);
      return;
    }

    // 如果没有记忆的月份，自动填充下个月
    const records = recordsByMetalType[selectedMetalType] || [];
    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      const nextMonth = new Date(lastRecord.date + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setMonth(nextMonth.toISOString().slice(0, 7));
    } else {
      setMonth(new Date().toISOString().slice(0, 7));
    }
  }, [selectedMetalType, recordsByMetalType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !grams || !pricePerGram || !averagePrice) {
      alert('Please fill in all required fields');
      return;
    }

    // Handle numeric precision, avoid floating point issues
    const parseValue = (value: string): number => {
      const num = parseFloat(value);
      // If input is an integer (no decimal point or all zeros after decimal), return integer
      if (!value.includes('.') || value.endsWith('.0') || value.endsWith('.00')) {
        return Math.round(num);
      }
      // Otherwise keep two decimal places
      return Math.round(num * 100) / 100;
    };

    const gramsValue = parseValue(grams);
    const pricePerGramValue = parseValue(pricePerGram);
    const averagePriceValue = parseValue(averagePrice);

    if (gramsValue <= 0 || pricePerGramValue <= 0 || averagePriceValue <= 0) {
      alert('Values must be greater than 0');
      return;
    }

    const record: PreciousMetalRecord = {
      id: `metal-${Date.now()}`,
      date: month,
      metalType: selectedMetalType,
      account: selectedAccount,
      grams: gramsValue,
      pricePerGram: pricePerGramValue,
      averagePrice: averagePriceValue,
      note: note.trim() || undefined,
    };

    addRecord(selectedMetalType, record);

    // Save current month to localStorage
    localStorage.setItem('lastMetalMonth', month);

    // Reset form
    setGrams('');
    setPricePerGram('');
    setAveragePrice('');
    setNote('');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Precious Metal Record</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Metal type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metal Type *</label>
          <select
            value={selectedMetalType}
            onChange={(e) => setSelectedMetalType(e.target.value as PreciousMetalType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          >
            {METAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Month selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
          <input
            ref={monthPickerRef}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
          {month && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {formatMonth(month)}
            </p>
          )}
        </div>

        {/* Purchase grams */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Amount (grams) *</label>
          <input
            type="number"
            step="0.01"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="Enter purchase grams"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        {/* Purchase price per gram */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price Per Gram ($) *</label>
          <input
            type="number"
            step="0.01"
            value={pricePerGram}
            onChange={(e) => setPricePerGram(e.target.value)}
            placeholder="Enter purchase price per gram"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        {/* Purchase total preview */}
        {(grams && pricePerGram) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-sm text-amber-800">
              <span className="font-medium">Total Purchase: ${totalAmount}</span>
            </div>
          </div>
        )}

        {/* Current month market price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Month Market Price ($/gram) *
            <span className="ml-2 text-xs text-gray-500">(Used for profit calculation)</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={averagePrice}
            onChange={(e) => setAveragePrice(e.target.value)}
            placeholder="Enter current month market price"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Market price is used for profit calculation, you can refer to the average market price of the metal for the current month
          </p>
        </div>

        {/* Account selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          Add Record
        </button>
      </form>
    </div>
  );
};
