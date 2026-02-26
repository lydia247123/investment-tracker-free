export type DashboardFilter = 'all' | 'investment' | 'metal';

interface DashboardFilterProps {
  currentFilter: DashboardFilter;
  onFilterChange: (filter: DashboardFilter) => void;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  return (
    <div className="bg-white rounded-xl p-2 shadow-lg mb-6 inline-flex items-center gap-4">
      {/* 筛选按钮组 */}
      <div className="flex">
        <button
        onClick={() => onFilterChange('all')}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all no-drag
          ${currentFilter === 'all'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        All
      </button>
        <button
          onClick={() => onFilterChange('investment')}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all no-drag
            ${currentFilter === 'investment'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          Investments
        </button>
        <button
          onClick={() => onFilterChange('metal')}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all no-drag
            ${currentFilter === 'metal'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          Metals
        </button>
      </div>
    </div>
  );
};
