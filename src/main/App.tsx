import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@components/Layout/AppLayout';
import { Dashboard } from '@pages/Dashboard';
import { Tracker } from '@pages/Tracker';
import { Analytics } from '@pages/Analytics';
import { Settings } from '@pages/Settings';
import { TutorialOverlay } from '@components/Tutorial';
import { ONBOARDING_TUTORIAL } from '@components/Tutorial/tutorialSteps';
import { useEffect, useState } from 'react';
import { useUIStore } from '@store/uiStore';

function App() {
  const location = useLocation();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const { tutorialCompleted, setTutorialActive, startTutorial } = useUIStore();

  useEffect(() => {
    console.log('🛣️ [App] Current Route:', location.pathname);
    console.log('🎓 [App] Tutorial completed:', tutorialCompleted);
    console.log('🎓 [App] localStorage check:', localStorage.getItem('tutorial_onboarding_completed'));

    // 初始渲染完成后，标记为非初始状态
    if (isInitialRender) {
      console.log('🚀 [App] Initial render detected, forcing route check');
      setIsInitialRender(false);

      // 首次启动自动弹出tutorial
      if (!tutorialCompleted) {
        console.log('🎓 [App] First launch detected, starting tutorial in 1 second...');
        // 延迟1秒启动，确保页面完全加载
        setTimeout(() => {
          console.log('🎓 [App] Starting tutorial now!');
          startTutorial();
        }, 1000);
      } else {
        console.log('🎓 [App] Tutorial already completed, skipping auto-start');
      }
    }
  }, [location, isInitialRender, tutorialCompleted, startTutorial]);

  return (
    <AppLayout>
      <TutorialOverlay tutorial={ONBOARDING_TUTORIAL} />
      <Routes>
        {/*
          核心修复：在初始进入 "/" 时，如果页面空白，可能是因为 HashRouter
          在 file:// 协议下初始路径识别延迟。
          我们保留 Dashboard 作为首页，但在 AppLayout 中确保它被正确渲染。
        */}
        <Route path="/" element={<Dashboard key={location.pathname === '/' ? 'root-dash' : 'dash'} />} />

        {/* 兼容性路径 */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />

        {/* 功能页面 */}
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />

        {/* 兜底路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
