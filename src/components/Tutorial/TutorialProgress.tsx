interface TutorialProgressProps {
  current: number;
  total: number;
}

export const TutorialProgress: React.FC<TutorialProgressProps> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step text */}
      <div className="text-xs text-gray-500 font-medium">
        Step {current} of {total}
      </div>
    </div>
  );
};
