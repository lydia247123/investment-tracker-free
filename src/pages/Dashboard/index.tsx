import { useEffect, useState, lazy, Suspense } from 'react';
import { useInvestmentStore } from '@store/investmentStore';
import { useAccountStore } from '@store/accountStore';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { shouldInitMockData, initMockData } from '@utils/mockData';
import '@utils/dataManagement'; // 导入以启用控制台命令
import '@utils/snapshotTestData'; // 导入以启用快照测试数据控制台命令
import DashboardStats from './DashboardStats';
import { DashboardFilter, DashboardFilter as DashboardFilterType } from './DashboardFilter';
import { useMemo } from 'react';
import { DashboardDataManager, BaseDashboardData } from '@services/DashboardDataManager';
import { LazyErrorBoundary } from '@components/ErrorBoundary';

// 懒加载图表组件，减少初始渲染负担
// 在生产环境下，如果切换卡顿，可能是因为懒加载触发了大量的重新计算
// 我们先尝试将它们改为普通加载，看看是否能解决卡顿和加载不出来的问题
import MonthlyProfitChart from './MonthlyProfitChart';
import AssetsTrendChart from './AssetsTrendChart';
import MetalAssetsChart from './MetalAssetsChart';

export const Dashboard = () => {
  // 使用 selector 模式：只有这些特定数据变化时才会触发重新渲染
  const recordsByType = useInvestmentStore(state => state.recordsByType);
  const recordsByMetalType = usePreciousMetalStore(state => state.recordsByMetalType);
  const loadRecords = useInvestmentStore(state => state.loadRecords);
  const loadAccounts = useAccountStore(state => state.loadAccounts);
  const loadMetalRecords = usePreciousMetalStore(state => state.loadRecords);
  const isInvestmentLoaded = useInvestmentStore(state => state.isLoaded);
  const isMetalLoaded = usePreciousMetalStore(state => state.isLoaded);
  const isAccountLoaded = useAccountStore(state => state.isLoaded);

  // 数据加载状态 - 简化为单一状态
  const [isLoading, setIsLoading] = useState(!isInvestmentLoaded || !isMetalLoaded || !isAccountLoaded);
  const [dataReady, setDataReady] = useState(isInvestmentLoaded && isMetalLoaded && isAccountLoaded);

  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilterType>('all');

  useEffect(() => {
    // 如果数据已经加载过，直接标记为就绪
    if (isInvestmentLoaded && isMetalLoaded && isAccountLoaded) {
      setDataReady(true);
      setIsLoading(false);
      return;
    }

    // 设置强制超时：3秒后无论如何都停止加载状态，确保页面能显示出来
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setDataReady(true);
        setIsLoading(false);
      }
    }, 3000);

    const initData = async () => {
      try {
        // 并行加载所有数据
        await Promise.all([
          loadRecords(),
          loadAccounts(),
          loadMetalRecords()
        ]);

        clearTimeout(timeoutId);
        setDataReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        clearTimeout(timeoutId);
        setDataReady(true);
        setIsLoading(false);
      }
    };

    initData();

    return () => clearTimeout(timeoutId);
  }, [
    loadRecords, 
    loadAccounts, 
    loadMetalRecords, 
    isInvestmentLoaded, 
    isMetalLoaded, 
    isAccountLoaded
  ]);

  // ========== 性能优化：一次性计算所有基础数据 ==========
  // 在 Dashboard 顶层计算所有图表共享的基础数据
  // 避免每个图表组件重复计算相同的数据
  const baseData = useMemo(() => {
    if (!dataReady) return null; // 数据未就绪时不计算
    
    // 只有在 recordsByType 或 recordsByMetalType 真正有数据变化时才计算
    const hasInvestmentData = Object.keys(recordsByType).length > 0;
    const hasMetalData = Object.keys(recordsByMetalType).length > 0;
    
    if (!hasInvestmentData && !hasMetalData) return null;

    return DashboardDataManager.calculateBaseData(
      recordsByType,
      recordsByMetalType
    );
  }, [recordsByType, recordsByMetalType, dataReady]);

  return (
    <div className="space-y-6">
      {!dataReady ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Window drag handle for macOS */}
          <div className="mb-4 h-6 drag-region -mt-20 md:-mt-12"></div>

          <div className="space-y-4">
            <div data-tutorial="dashboard-filter">
              <DashboardFilter
                currentFilter={dashboardFilter}
                onFilterChange={setDashboardFilter}
              />
            </div>
          </div>

          <div data-tutorial="dashboard-stats">
            <DashboardStats
              filterType={dashboardFilter}
              recordsByType={recordsByType}
              recordsByMetalType={recordsByMetalType}
              baseData={baseData}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Metal mode: Show only metal assets chart */}
            {dashboardFilter === 'metal' ? (
              <div className="lg:col-span-2">
                <MetalAssetsChart
                  filterType={dashboardFilter}
                  recordsByType={recordsByType}
                  recordsByMetalType={recordsByMetalType}
                  baseData={baseData}
                />
              </div>
            ) : (
              <>
                <div data-tutorial="monthly-profit-chart">
                  <MonthlyProfitChart
                    filterType={dashboardFilter}
                    recordsByType={recordsByType}
                    recordsByMetalType={recordsByMetalType}
                    baseData={baseData}
                  />
                </div>
                <div data-tutorial="assets-trend-chart">
                  <AssetsTrendChart
                    filterType={dashboardFilter}
                    recordsByType={recordsByType}
                    recordsByMetalType={recordsByMetalType}
                    baseData={baseData}
                  />
                </div>
                {/* All mode: Show assets chart for all investments (including metals) */}
                {dashboardFilter === 'all' && (
                  <div className="lg:col-span-2">
                    <MetalAssetsChart
                      filterType={dashboardFilter}
                      recordsByType={recordsByType}
                      recordsByMetalType={recordsByMetalType}
                      baseData={baseData}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
