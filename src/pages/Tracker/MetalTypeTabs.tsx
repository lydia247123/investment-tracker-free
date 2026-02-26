import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { PreciousMetalType } from '@types/preciousMetal';

const METAL_TYPES: PreciousMetalType[] = ['Gold', 'Silver', 'Platinum', 'Palladium'];

interface MetalTypeTabsProps {
  selectedTypes: PreciousMetalType[];
  onSelectTypes: (types: PreciousMetalType[]) => void;
}

export const MetalTypeTabs: React.FC<MetalTypeTabsProps> = ({
  selectedTypes,
  onSelectTypes,
}) => {
  const { recordsByMetalType } = usePreciousMetalStore();

  const handleTypeClick = (type: PreciousMetalType) => {
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
      {METAL_TYPES.map((type) => {
        const isSelected = selectedTypes.includes(type);
        const count = recordsByMetalType[type]?.length || 0;
        return (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all border-2
              ${isSelected
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md border-amber-500'
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
