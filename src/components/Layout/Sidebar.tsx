import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@store/uiStore';
import { useInvestmentStore } from '@store/investmentStore';
import { usePreciousMetalStore } from '@store/preciousMetalStore';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { currentPage, sidebarOpen, isMobile, setCurrentPage } = useUIStore();
  const { recordsByType } = useInvestmentStore();
  const { recordsByMetalType } = usePreciousMetalStore();

  const investmentTotal = Object.values(recordsByType).flat().reduce((sum, r) => sum + r.amount, 0);
  const metalTotal = Object.values(recordsByMetalType).flat().reduce((sum, r) => sum + (r.grams * r.pricePerGram), 0);
  const totalInvestment = investmentTotal + metalTotal;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/', dataTutorial: 'sidebar-dashboard' },
    { id: 'tracker', label: 'Tracker', path: '/tracker', dataTutorial: 'sidebar-tracker' },
    { id: 'analytics', label: 'Analytics', path: '/analytics', dataTutorial: 'sidebar-analytics' },
    { id: 'settings', label: 'Settings', path: '/settings', dataTutorial: 'sidebar-settings' },
  ];

  const handleNavigation = (pageId: string, path: string) => {
    setCurrentPage(pageId as any);
    navigate(path);
    if (isMobile) useUIStore.getState().setSidebarOpen(false);
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-lg shadow-lg
      transform transition-transform z-50
      ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      md:translate-x-0
    `}>
      {/* macOS drag region for sidebar */}
      <div className="h-10 drag-region"></div>

      <div className="p-6">
        <div className="drag-region mb-6">
          <h1 className="text-xl font-bold text-gray-800 no-drag">Investment Tracker</h1>
        </div>

        {/* Quick stats */}
        <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total Investment</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalInvestment.toFixed(2)}
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              data-tutorial={item.dataTutorial}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`
                w-full px-4 py-3 rounded-lg text-left font-medium transition-all
                ${currentPage === item.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
