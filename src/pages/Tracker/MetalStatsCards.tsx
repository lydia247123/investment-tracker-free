import { useMemo, useState } from 'react';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { PreciousMetalType } from '@types/preciousMetal';
import { calculateMetalStats } from '@utils/metalCalculations';
import { exportMetalDataToCSV } from '@utils/metalDataExport';
import { MetalImportDialog } from './MetalImportDialog';
import { InfoTooltip } from '@components/ui/InfoTooltip';

interface MetalStatsCardsProps {
  selectedTypes: PreciousMetalType[];
  filterMonth?: string | null;
}

export const MetalStatsCards: React.FC<MetalStatsCardsProps> = ({
  selectedTypes,
  filterMonth
}) => {
  const { recordsByMetalType } = usePreciousMetalStore();
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 获取所有相关类型的记录
  const allRecords = selectedTypes.length === 0
    ? Object.values(recordsByMetalType).flat() // 未选中任何类型，获取全部
    : selectedTypes.flatMap(type => recordsByMetalType[type] || []); // 获取选中类型的记录

  // 使用useMemo缓存计算结果
  const stats = useMemo(() => {
    const statsData = calculateMetalStats(allRecords, filterMonth || undefined, recordsByMetalType);

    return [
      {
        label: 'Total Grams',
        value: `${statsData.totalGrams.toFixed(2)}g`,
        color: 'from-green-500 to-emerald-500',
        icon: '',
      },
      {
        label: 'Total Amount',
        value: `$${statsData.totalAmount.toFixed(2)}`,
        color: 'from-green-500 to-emerald-500',
        icon: '',
        tooltip: true,
        tooltipContent: [
          'Total Amount = Total Purchase Amount'
        ]
      },
      {
        label: 'Current Value',
        value: `$${statsData.currentValue.toFixed(2)}`,
        color: 'from-green-500 to-emerald-500',
        icon: '',
        tooltip: true,
        tooltipContent: [
          'Current Value = Monthly Average Price × Total Grams'
        ]
      },
      {
        label: 'Monthly Profit',
        value: statsData.monthlyProfit >= 0
          ? `+$${statsData.monthlyProfit.toFixed(2)}`
          : `-$${Math.abs(statsData.monthlyProfit).toFixed(2)}`,
        color: statsData.monthlyProfit >= 0
          ? 'from-green-500 to-emerald-500'
          : 'from-red-500 to-rose-600',
        icon: '',
        tooltip: true,
        tooltipContent: [
          'Monthly Profit =',
          'Current Month Avg Price × Current Month Total Grams',
          '- Previous Month Avg Price × Previous Month Total Grams',
          '- Current Month Purchase Amount'
        ]
      },
      {
        label: 'Total Profit',
        value: statsData.totalProfit >= 0
          ? `+$${statsData.totalProfit.toFixed(2)}`
          : `-$${Math.abs(statsData.totalProfit).toFixed(2)}`,
        color: statsData.totalProfit >= 0
          ? 'from-green-500 to-emerald-500'
          : 'from-red-500 to-rose-600',
        icon: '',
        tooltip: true,
        tooltipContent: [
          'Total Profit = Current Value - Total Amount'
        ]
      },
    ];
  }, [allRecords, filterMonth]);

  return (
    <>
      {/* Import/Export buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setShowImportDialog(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          title="Import precious metal data from JSON or CSV file"
        >
          Import Data
        </button>
        <button
          onClick={() => exportMetalDataToCSV(
            recordsByMetalType,
            selectedTypes.length > 0 ? selectedTypes : undefined
          )}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          title="Export as CSV format, can be opened in Excel"
        >
          Export CSV
        </button>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              {stat.label}
              {(stat as any).tooltip && <InfoTooltip content={(stat as any).tooltipContent} />}
            </div>
          </div>
        ))}
      </div>

      {/* Import dialog */}
      {showImportDialog && (
        <MetalImportDialog
          onClose={() => setShowImportDialog(false)}
          onImportSuccess={(count) => {
            setShowImportDialog(false);
          }}
        />
      )}
    </>
  );
};
