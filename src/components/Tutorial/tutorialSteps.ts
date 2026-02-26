import type { TutorialConfig } from './types';

export const ONBOARDING_TUTORIAL: TutorialConfig = {
  id: 'onboarding',
  name: 'Quick Tour',
  completionKey: 'tutorial_onboarding_completed',
  triggerOn: 'first-launch',
  steps: [
    // === 步骤 1: 欢迎页 ===
    {
      id: 'welcome',
      title: 'Welcome to Investment Tracker! 👋',
      description: 'Let\'s set up your account and start tracking your investments.',
      target: {
        fallbackPosition: { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 }
      },
      disableSpotlight: true,
      cardPosition: 'auto'
    },

    // === 步骤 2: 添加账户 (第一步) ===
    {
      id: 'add-account',
      title: 'Create Your First Account',
      description: 'Start by creating an investment account. Click "Add Account" to organize your investments.',
      target: {
        selector: '[data-tutorial="account-management"]',
      },
      navigateTo: '/settings',
      waitForElement: 500,
      cardPosition: 'top',
      spotlightPadding: 8
    },

    // === 步骤 3: 添加记录 (第二步) ===
    {
      id: 'add-records',
      title: 'Add Your Investment Records',
      description: 'Now add your investment records. Select the type, fill in the amount, and save.',
      target: {
        selector: '[data-tutorial="add-record-form"]',
      },
      navigateTo: '/tracker',
      waitForElement: 500,
      cardPosition: 'left',
      spotlightPadding: 8
    },

    // === 步骤 4: 查看统计 (第三步) ===
    {
      id: 'view-dashboard',
      title: 'Track Your Performance',
      description: 'View your total investment, returns, and performance charts all in one place.',
      target: {
        selector: '[data-tutorial="dashboard-stats"]',
      },
      navigateTo: '/',
      waitForElement: 500,
      cardPosition: 'bottom',
      spotlightPadding: 8
    },

    // === 步骤 5: 完成 ===
    {
      id: 'completion',
      title: 'You\'re All Set! 🎉',
      description: 'You\'ve learned the basics! Add more records, track different accounts, and analyze your portfolio.',
      target: {
        fallbackPosition: { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 }
      },
      disableSpotlight: true,
      cardPosition: 'auto'
    }
  ]
};
