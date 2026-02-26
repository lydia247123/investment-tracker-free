import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@store/uiStore';
import { TutorialSpotlight } from './TutorialSpotlight';
import { TutorialCard } from './TutorialCard';
import { useTutorialNavigation } from './hooks/useTutorialNavigation';
import type { TutorialConfig } from './types';

export const TutorialOverlay: React.FC<{ tutorial: TutorialConfig }> = ({ tutorial }) => {
  const { tutorialActive, currentTutorialStep, exitTutorial } = useUIStore();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const currentStep = tutorial.steps[currentTutorialStep];

  const {
    handleNext,
    handlePrevious,
    handleSkip,
    isLastStep,
    isFirstStep
  } = useTutorialNavigation(tutorial);

  // Find or create portal root
  useEffect(() => {
    let root = document.getElementById('tutorial-portal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tutorial-portal-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);

    return () => {
      // Clean up if tutorial is inactive
      if (!tutorialActive && root) {
        // Optional: remove root to clean up DOM
      }
    };
  }, [tutorialActive]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!tutorialActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          exitTutorial();
          break;
        case 'ArrowRight':
          if (!isLastStep) handleNext();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) handlePrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialActive, isLastStep, isFirstStep, handleNext, handlePrevious, exitTutorial]);

  if (!tutorialActive || !portalRoot || !currentStep) {
    return null;
  }

  return createPortal(
    <div className="tutorial-overlay-container">
      {/* Semi-transparent backdrop with spotlight cutout */}
      <TutorialSpotlight
        target={currentStep.target}
        disableSpotlight={currentStep.disableSpotlight}
        padding={currentStep.spotlightPadding}
      />

      {/* Tutorial card */}
      <TutorialCard
        step={currentStep}
        currentStep={currentTutorialStep}
        totalSteps={tutorial.steps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={exitTutorial}
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
      />
    </div>,
    portalRoot
  );
};
