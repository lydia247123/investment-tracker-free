export type TrackerMode = 'investment' | 'metal';

interface TrackerModeSwitchProps {
  mode: TrackerMode;
  onModeChange: (mode: TrackerMode) => void;
}

export const TrackerModeSwitch: React.FC<TrackerModeSwitchProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className="bg-white rounded-xl p-2 shadow-lg mb-6 inline-flex">
      <button
        onClick={() => onModeChange('investment')}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all
          ${mode === 'investment'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        Investments
      </button>
      <button
        onClick={() => onModeChange('metal')}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all
          ${mode === 'metal'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        Precious Metals
      </button>
    </div>
  );
};
