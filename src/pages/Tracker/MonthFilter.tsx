import { InvestmentRecord } from '@types/investment';
import { formatMonth } from '@utils/formatters';

interface MonthFilterProps {
  records: InvestmentRecord[];
  selectedMonth: string | null;
  onMonthChange: (month: string | null) => void;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  records,
  selectedMonth,
  onMonthChange,
}) => {
  // 生成所有月份列表（只显示有实际投资记录的月份）
  const generateMonths = (): string[] => {
    const monthSet = new Set<string>();

    // 只添加有实际投资记录的月份（包括定期存款的起息月份）
    records.forEach(r => {
      monthSet.add(r.date);
    });

    return Array.from(monthSet).sort().reverse();
  };

  const months = generateMonths();

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Select Month
        </label>
        <select
          value={selectedMonth || ''}
          onChange={(e) => onMonthChange(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Months</option>
          {months.map(month => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
