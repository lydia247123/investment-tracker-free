import { create } from 'zustand';

type Page = 'dashboard' | 'tracker' | 'analytics' | 'settings';

interface UIState {
  currentPage: Page;
  sidebarOpen: boolean;
  isMobile: boolean;

  // Tutorial state
  tutorialActive: boolean;
  tutorialCompleted: boolean;
  currentTutorialStep: number;

  setCurrentPage: (page: Page) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;

  // Tutorial actions
  setTutorialActive: (active: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  setCurrentTutorialStep: (step: number) => void;
  startTutorial: () => void;
  exitTutorial: () => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  resetTutorial: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  isMobile: false,

  // Tutorial state
  tutorialActive: typeof window !== 'undefined' ? (localStorage.getItem('tutorial_active') === 'true') : false,
  tutorialCompleted: typeof window !== 'undefined' ? localStorage.getItem('tutorial_onboarding_completed') === 'true' : false,
  currentTutorialStep: 0,

  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsMobile: (isMobile) => set({ isMobile }),

  // Tutorial actions
  setTutorialActive: (active) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutorial_active', active ? 'true' : 'false');
    }
    set({ tutorialActive: active });
  },

  setTutorialCompleted: (completed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutorial_onboarding_completed', completed ? 'true' : 'false');
    }
    set({ tutorialCompleted: completed });
  },

  setCurrentTutorialStep: (step) => set({ currentTutorialStep: step }),

  startTutorial: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutorial_active', 'true');
    }
    set({ tutorialActive: true, currentTutorialStep: 0 });
  },

  exitTutorial: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutorial_active', 'false');
    }
    set({ tutorialActive: false, currentTutorialStep: 0 });
  },

  nextTutorialStep: () => set((state) => ({ currentTutorialStep: state.currentTutorialStep + 1 })),

  prevTutorialStep: () => set((state) => ({ currentTutorialStep: Math.max(0, state.currentTutorialStep - 1) })),

  resetTutorial: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tutorial_onboarding_completed');
    }
    set({
      tutorialCompleted: false,
      tutorialActive: true,
      currentTutorialStep: 0
    });
  },
}));
