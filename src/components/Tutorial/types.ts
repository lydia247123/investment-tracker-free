export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: {
    // CSS selector for target element
    selector?: string;
    // Custom function to find element
    findElement?: () => HTMLElement | null;
    // Fallback position if element not found
    fallbackPosition?: { x: number; y: number };
  };
  // Navigate to this route before showing step
  navigateTo?: string;
  // Wait for element to appear (ms)
  waitForElement?: number;
  // Where to position the card relative to target
  cardPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  // Disable spotlight effect (for intro/outro)
  disableSpotlight?: boolean;
  // Custom padding for spotlight
  spotlightPadding?: number;
}

export interface TutorialConfig {
  id: string;
  name: string;
  steps: TutorialStep[];
  // When to show this tutorial
  triggerOn: 'first-launch' | 'manual';
  // LocalStorage key for completion tracking
  completionKey: string;
}
