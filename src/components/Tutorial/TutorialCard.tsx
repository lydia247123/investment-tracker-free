import { useMemo } from 'react';
import { useSpotlightPosition } from './hooks/useSpotlightPosition';
import { TutorialProgress } from './TutorialProgress';
import { TutorialNavigation } from './TutorialNavigation';
import type { TutorialStep } from './types';

interface TutorialCardProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isLastStep,
  isFirstStep
}) => {
  const { position, cardPosition } = useSpotlightPosition(step.target, currentStep);

  const cardStyle = useMemo(() => {
    if (!position) {
      // Center in viewport
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const cardWidth = 320; // approximate card width

    switch (cardPosition) {
      case 'top':
        return {
          bottom: `calc(100vh - ${position.top - padding}px)`,
          left: `${Math.max(padding, Math.min(position.left, window.innerWidth - cardWidth - padding))}px`,
        };
      case 'bottom':
        return {
          top: `${position.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(position.left, window.innerWidth - cardWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${Math.max(padding, Math.min(position.top, window.innerHeight - 200))}px`,
          right: `${window.innerWidth - position.left + padding}px`,
        };
      case 'right':
        return {
          top: `${Math.max(padding, Math.min(position.top, window.innerHeight - 200))}px`,
          left: `${position.right + padding}px`,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  }, [position, cardPosition]);

  return (
    <div
      className="tutorial-card fixed z-[9999] w-80 bg-white rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300"
      style={cardStyle}
    >
      {/* Progress indicator */}
      <TutorialProgress
        current={currentStep + 1}
        total={totalSteps}
      />

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        {step.description}
      </p>

      {/* Navigation buttons */}
      <TutorialNavigation
        onNext={onNext}
        onPrevious={onPrevious}
        onSkip={onSkip}
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
      />
    </div>
  );
};
