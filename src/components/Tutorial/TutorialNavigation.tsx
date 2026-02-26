interface TutorialNavigationProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
}

export const TutorialNavigation: React.FC<TutorialNavigationProps> = ({
  onNext,
  onPrevious,
  onSkip,
  isLastStep,
  isFirstStep
}) => {
  return (
    <div className="flex gap-2">
      {/* Skip button (always visible) */}
      <button
        onClick={onSkip}
        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Skip
      </button>

      <div className="flex-1" />

      {/* Previous button */}
      {!isFirstStep && (
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Previous
        </button>
      )}

      {/* Next/Finish button */}
      <button
        onClick={onNext}
        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        {isLastStep ? 'Finish' : 'Next'}
      </button>
    </div>
  );
};
