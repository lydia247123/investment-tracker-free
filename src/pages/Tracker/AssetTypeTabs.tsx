import { useMemo } from 'react';
import { useInvestmentStore } from '@store/investmentStore';

const DEFAULT_ASSET_TYPES = ['Stocks', 'Funds', 'Bonds', 'Time Deposits', 'Others'] as const;

interface AssetTypeTabsProps {
  selectedTypes: string[];
  onSelectTypes: (types: string[]) => void;
}

export const AssetTypeTabs: React.FC<AssetTypeTabsProps> = ({
  selectedTypes,
  onSelectTypes,
}) => {
  const { recordsByType } = useInvestmentStore();

  const handleTypeClick = (type: string) => {
    if (selectedTypes.includes(type)) {
      // 如果已选中，取消选中
      onSelectTypes(selectedTypes.filter(t => t !== type));
    } else {
      // 如果未选中，添加选中
      onSelectTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {DEFAULT_ASSET_TYPES.map((type) => {
        const isSelected = selectedTypes.includes(type);
        const count = recordsByType[type]?.length || 0;

        return (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all border-2
              ${isSelected
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md border-green-500'
                : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
              }
            `}
          >
            {type}
            {count > 0 && (
              <span className={`ml-2 text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
