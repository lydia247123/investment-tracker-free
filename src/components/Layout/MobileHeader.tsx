import { useUIStore } from '@store/uiStore';

export const MobileHeader: React.FC = () => {
  const { sidebarOpen, toggleSidebar, isMobile } = useUIStore();

  if (!isMobile) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg shadow-md z-30 md:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">投资跟踪器</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
    </>
  );
};
