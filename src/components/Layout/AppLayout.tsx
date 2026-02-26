import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@store/uiStore';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsMobile, setCurrentPage } = useUIStore();
  const location = useLocation();

  // 根据路由自动更新 currentPage 状态
  useEffect(() => {
    const pathToPageMap: Record<string, 'dashboard' | 'tracker' | 'analytics' | 'settings'> = {
      '/': 'dashboard',
      '/tracker': 'tracker',
      '/analytics': 'analytics',
      '/settings': 'settings',
    };
    const page = pathToPageMap[location.pathname] || 'dashboard';
    setCurrentPage(page);
  }, [location.pathname, setCurrentPage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  return (
    <div className="min-h-screen bg-apple-gradient relative">
      <MobileHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 pt-20 md:pt-12 md:ml-64 no-drag">
          {children}
        </main>
      </div>
    </div>
  );
};
