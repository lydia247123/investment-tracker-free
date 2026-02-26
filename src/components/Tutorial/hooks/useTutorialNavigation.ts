import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@store/uiStore';
import type { TutorialConfig } from '../types';

export const useTutorialNavigation = (tutorial: TutorialConfig) => {
  const navigate = useNavigate();
  const {
    currentTutorialStep,
    nextTutorialStep,
    prevTutorialStep,
    setTutorialActive,
    setTutorialCompleted,
    setCurrentTutorialStep
  } = useUIStore();

  const handleNext = useCallback(() => {
    if (currentTutorialStep < tutorial.steps.length - 1) {
      const nextStep = tutorial.steps[currentTutorialStep + 1];

      // Navigate if needed
      if (nextStep.navigateTo) {
        navigate(nextStep.navigateTo);
      }

      // Wait for navigation and element to render
      setTimeout(() => {
        nextTutorialStep();
      }, nextStep.waitForElement || 300);
    } else {
      // Tutorial completed
      setTutorialCompleted(true);
      setTutorialActive(false);
    }
  }, [
    currentTutorialStep,
    tutorial.steps,
    nextTutorialStep,
    setTutorialCompleted,
    setTutorialActive,
    navigate
  ]);

  const handlePrevious = useCallback(() => {
    if (currentTutorialStep > 0) {
      const prevStep = tutorial.steps[currentTutorialStep - 1];

      // Navigate if needed
      if (prevStep.navigateTo) {
        navigate(prevStep.navigateTo);
      }

      setTimeout(() => {
        prevTutorialStep();
      }, prevStep.waitForElement || 300);
    }
  }, [
    currentTutorialStep,
    tutorial.steps,
    prevTutorialStep,
    navigate
  ]);

  const handleSkip = useCallback(() => {
    setTutorialActive(false);
    setCurrentTutorialStep(0);
  }, [setTutorialActive, setCurrentTutorialStep]);

  return {
    handleNext,
    handlePrevious,
    handleSkip,
    isLastStep: currentTutorialStep === tutorial.steps.length - 1,
    isFirstStep: currentTutorialStep === 0,
    currentStep: tutorial.steps[currentTutorialStep]
  };
};
