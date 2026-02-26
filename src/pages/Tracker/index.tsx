import { useState, useEffect } from 'react';
import { AssetTypeTabs } from './AssetTypeTabs';
import { AccountFilter } from './AccountFilter';
import { AddRecordForm } from './AddRecordForm';
import { RecordsTable } from './RecordsTable';
import { StatsCards } from './StatsCards';
import { MonthFilter } from './MonthFilter';
import { TrackerModeSwitch } from './TrackerModeSwitch';
import { MetalTypeTabs } from './MetalTypeTabs';
import { MetalRecordForm } from './MetalRecordForm';
import { MetalStatsCards } from './MetalStatsCards';
import { MetalRecordsTable } from './MetalRecordsTable';
import { useInvestmentStore } from '@store/investmentStore';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { useAccountStore } from '@store/accountStore';
import { PreciousMetalType } from '@types/preciousMetal';

const DEFAULT_ASSET_TYPE = 'Stocks';
const DEFAULT_METAL_TYPE: PreciousMetalType = 'Gold';

export const Tracker = () => {
  const [trackerMode, setTrackerMode] = useState<'investment' | 'metal'>('investment');
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>([]); // Empty array means no type selected
  const [selectedMetalTypes, setSelectedMetalTypes] = useState<PreciousMetalType[]>([]); // Empty array means no type selected
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]); // Empty array means all accounts selected

  const { recordsByType, currentFilterMonth, setFilterMonth } = useInvestmentStore();
  const { recordsByMetalType, currentFilterMonth: metalFilterMonth, setFilterMonth: setMetalFilterMonth } = usePreciousMetalStore();
  const { accounts } = useAccountStore();

  // 在组件加载时初始化数据
  useEffect(() => {
    usePreciousMetalStore.getState().loadRecords();
  }, []);

  // Helper function to get latest date from records
  const getLatestDate = (records: { date: string }[]): string | null => {
    if (records.length === 0) return null;
    const dates = records.map(r => r.date);
    dates.sort((a, b) => b.localeCompare(a)); // Sort descending (latest first)
    return dates[0];
  };

  // Get investment records for selected asset types
  const investmentRecords = selectedAssetTypes.length === 0
    ? Object.values(recordsByType).flat() // No type selected, show all
    : selectedAssetTypes.flatMap(type => recordsByType[type] || []); // Specific types selected, show those types

  // Filter records by account
  const investmentRecordsByAccount = selectedAccounts.length === 0
    ? investmentRecords // Empty array = all accounts
    : investmentRecords.filter(r => selectedAccounts.includes(r.account));

  // Get latest investment date and use it if no filter is selected
  const latestInvestmentDate = getLatestDate(investmentRecordsByAccount);
  const effectiveInvestmentFilterMonth = currentFilterMonth || latestInvestmentDate;

  // Filter records by month (for table display)
  const filteredInvestmentRecords = trackerMode === 'investment' && effectiveInvestmentFilterMonth
    ? investmentRecordsByAccount.filter(r => r.date === effectiveInvestmentFilterMonth) // Only show records for selected month
    : investmentRecordsByAccount; // Show all records

  // Get metal records for selected metal types
  const metalRecords = selectedMetalTypes.length === 0
    ? Object.values(recordsByMetalType).flat() // No type selected, show all
    : selectedMetalTypes.flatMap(type => recordsByMetalType[type] || []); // Specific types selected, show those types

  // Get latest metal date and use it if no filter is selected
  const latestMetalDate = getLatestDate(metalRecords);
  const effectiveMetalFilterMonth = metalFilterMonth || latestMetalDate;

  // Filter metal records by month (for table display)
  const filteredMetalRecords = trackerMode === 'metal' && effectiveMetalFilterMonth
    ? metalRecords.filter(r => r.date === effectiveMetalFilterMonth) // Only show records for selected month
    : metalRecords; // Show all records

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Investment Tracker</h1>

      {/* Mode switch */}
      <div data-tutorial="tracker-mode-switch">
        <TrackerModeSwitch mode={trackerMode} onModeChange={setTrackerMode} />
      </div>

      {trackerMode === 'investment' ? (
        <>
          {/* Asset type selection */}
          <div data-tutorial="asset-type-tabs">
            <AssetTypeTabs
              selectedTypes={selectedAssetTypes}
              onSelectTypes={setSelectedAssetTypes}
            />
          </div>

          {/* Month filter */}
          <MonthFilter
            records={investmentRecords}
            selectedMonth={currentFilterMonth}
            onMonthChange={setFilterMonth}
          />

          {/* Account filter */}
          <AccountFilter
            selectedAccounts={selectedAccounts}
            onSelectAccounts={setSelectedAccounts}
            accounts={accounts}
          />

          {/* Stats cards */}
          <StatsCards
            selectedTypes={selectedAssetTypes}
            selectedAccounts={selectedAccounts}
            filterMonth={trackerMode === 'investment' ? effectiveInvestmentFilterMonth : undefined}
          />

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add form */}
            <div className="lg:col-span-1" data-tutorial="add-record-form">
              <AddRecordForm initialAssetType={selectedAssetTypes[0] || DEFAULT_ASSET_TYPE} />
            </div>

            {/* Right: Records list */}
            <div className="lg:col-span-2" data-tutorial="records-table">
              <RecordsTable
                selectedTypes={selectedAssetTypes}
                records={filteredInvestmentRecords}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Metal type selection */}
          <MetalTypeTabs
            selectedTypes={selectedMetalTypes}
            onSelectTypes={setSelectedMetalTypes}
          />

          {/* Month filter */}
          <MonthFilter
            records={metalRecords}
            selectedMonth={metalFilterMonth}
            onMonthChange={setMetalFilterMonth}
          />

          {/* Stats cards */}
          <MetalStatsCards
            selectedTypes={selectedMetalTypes}
            filterMonth={trackerMode === 'metal' ? effectiveMetalFilterMonth : undefined}
          />

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add form */}
            <div className="lg:col-span-1">
              <MetalRecordForm metalType={selectedMetalTypes[0] || DEFAULT_METAL_TYPE} />
            </div>

            {/* Right: Records list */}
            <div className="lg:col-span-2">
              <MetalRecordsTable
                selectedTypes={selectedMetalTypes}
                records={filteredMetalRecords}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

