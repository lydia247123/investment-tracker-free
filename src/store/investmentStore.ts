import { create } from 'zustand';
import { RecordsByType, InvestmentRecord } from '../types/investment';
import { fixTimeDepositFlags } from '../utils/migrations/fixTimeDepositFlags';

interface InvestmentState {
  recordsByType: RecordsByType;
  selectedAssetTypes: Set<string>;
  selectedAccounts: Set<string>;
  currentFilterMonth: string | null;
  isLoaded: boolean;

  // Actions
  loadRecords: (force?: boolean) => void;
  saveRecords: () => void;
  addRecord: (assetType: string, record: InvestmentRecord) => void;
  updateRecord: (assetType: string, recordId: string, record: InvestmentRecord) => void;
  deleteRecord: (assetType: string, recordId: string) => void;
  setSelectedAssetTypes: (types: Set<string>) => void;
  setSelectedAccounts: (accounts: Set<string>) => void;
  setFilterMonth: (month: string | null) => void;
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  recordsByType: {},
  selectedAssetTypes: new Set(),
  selectedAccounts: new Set(),
  currentFilterMonth: null,
  isLoaded: false,

  loadRecords: (force = false) => {
    if (get().isLoaded && !force) {
      return;
    }
    const records = localStorage.getItem('investmentRecords');
    const filterMonth = localStorage.getItem('investmentFilterMonth');

    if (records) {
      try {
        const parsedRecords = JSON.parse(records);

        // 数据迁移：为旧记录添加 assetType 字段
        let needsMigration = false;
        Object.keys(parsedRecords).forEach(assetType => {
          parsedRecords[assetType] = parsedRecords[assetType].map(record => {
            let recordChanged = false;
            let updatedRecord = { ...record };

            if (!updatedRecord.assetType) {
              updatedRecord.assetType = assetType;
              recordChanged = true;
            }

            if (recordChanged) {
              needsMigration = true;
              return updatedRecord;
            }
            return record;
          });
        });

        // 如果有数据需要迁移，保存回 localStorage
        if (needsMigration) {
          localStorage.setItem('investmentRecords', JSON.stringify(parsedRecords));
        }

        // 数据迁移：修复定期存款标记
        const migrationResult = fixTimeDepositFlags(parsedRecords);
        if (migrationResult.count > 0) {
          // 如果有记录被修复，保存回 localStorage
          localStorage.setItem('investmentRecords', JSON.stringify(migrationResult.fixed));
          set({ recordsByType: migrationResult.fixed });
        } else {
          set({ recordsByType: parsedRecords });
        }
      } catch (e) {
        console.error('Failed to parse investmentRecords:', e);
      }
    }
    if (filterMonth) set({ currentFilterMonth: filterMonth });

    // 清理旧的 initialAssets 数据
    localStorage.removeItem('initialAssets');

    // 清理已删除的货币功能缓存
    localStorage.removeItem('currency-cache');

    // 数据迁移：清理标签字段
    const tagRemovalMigration = () => {
      const migrationFlag = localStorage.getItem('tagRemovalMigration');
      if (migrationFlag) return;

      try {
        // 1. 清理投资记录中的 tag 字段
        const records = localStorage.getItem('investmentRecords');
        if (records) {
          const parsedRecords = JSON.parse(records);
          let hasTags = false;

          Object.keys(parsedRecords).forEach(assetType => {
            parsedRecords[assetType] = parsedRecords[assetType].map((record: any) => {
              if (record.tag) {
                hasTags = true;
                const { tag, ...rest } = record;
                return rest;
              }
              return record;
            });
          });

          if (hasTags) {
            localStorage.setItem('investmentRecords', JSON.stringify(parsedRecords));
          }
        }

        // 2. 清理账户中的 tag 字段
        const accounts = localStorage.getItem('accounts');
        if (accounts) {
          const parsedAccounts = JSON.parse(accounts);
          const cleanedAccounts = parsedAccounts.map((acc: any) => {
            if (acc.tag) {
              const { tag, ...rest } = acc;
              return rest;
            }
            return acc;
          });
          localStorage.setItem('accounts', JSON.stringify(cleanedAccounts));
        }

        // 3. 删除自定义标签存储
        localStorage.removeItem('custom-tags');

        // Mark migration as complete
        localStorage.setItem('tagRemovalMigration', 'true');
      } catch (error) {
        console.error('Tag data migration failed:', error);
      }
    };

    tagRemovalMigration();

    // Data migration: Convert Chinese asset types to English
    const englishMigration = () => {
      const migrationFlag = localStorage.getItem('englishMigration_v1');
      if (migrationFlag) return;

      try {
        const ASSET_TYPE_MAP: Record<string, string> = {
          '股票': 'Stocks',
          '基金': 'Funds',
          '债券': 'Bonds',
          '现金': 'Cash',
          '黄金': 'Gold',
          '定期存款': 'Time Deposits',
          '其他': 'Others'
        };

        const records = localStorage.getItem('investmentRecords');
        if (records) {
          const parsedRecords = JSON.parse(records);

          // Check if migration is needed
          const needsMigration = Object.keys(parsedRecords).some(key =>
            Object.keys(ASSET_TYPE_MAP).includes(key)
          );

          if (needsMigration) {
            const migratedRecords: RecordsByType = {};

            Object.entries(parsedRecords).forEach(([assetType, records]) => {
              const newAssetType = ASSET_TYPE_MAP[assetType] || assetType;
              const migratedRecordsList = records.map((record: InvestmentRecord) => ({
                ...record,
                assetType: newAssetType
              }));
              migratedRecords[newAssetType] = migratedRecordsList;
            });

            // Save migrated data
            localStorage.setItem('investmentRecords', JSON.stringify(migratedRecords));
            set({ recordsByType: migratedRecords });
            console.log('✅ Data migrated to English successfully');
          }

          // Mark migration as complete
          localStorage.setItem('englishMigration_v1', 'true');
        }
      } catch (e) {
        console.error('❌ Data migration failed:', e);
      }
    };

    englishMigration();

    set({ isLoaded: true });
  },

  saveRecords: () => {
    const { recordsByType } = get();
    localStorage.setItem('investmentRecords', JSON.stringify(recordsByType));
  },

  addRecord: (assetType, record) => {
    const { recordsByType } = get();
    const newRecords = {
      ...recordsByType,
      [assetType]: [...(recordsByType[assetType] || []), record]
    };
    set({ recordsByType: newRecords });
    get().saveRecords();
  },

  updateRecord: (assetType, recordId, updatedRecord) => {
    const { recordsByType } = get();
    const newRecords = { ...recordsByType };
    const index = newRecords[assetType].findIndex(r => r.id === recordId);

    if (index !== -1) {
      // 保持原 ID，只更新其他字段
      newRecords[assetType][index] = {
        ...updatedRecord,
        id: recordId, // 确保 ID 不变
        assetType: assetType // 确保资产类型正确
      };
      set({ recordsByType: newRecords });
      get().saveRecords();
    }
  },

  deleteRecord: (assetType, recordId) => {
    const { recordsByType } = get();
    const newRecords = { ...recordsByType };
    newRecords[assetType] = newRecords[assetType].filter(r => r.id !== recordId);
    set({ recordsByType: newRecords });
    get().saveRecords();
  },

  setSelectedAssetTypes: (types) => set({ selectedAssetTypes: types }),
  setSelectedAccounts: (accounts) => set({ selectedAccounts: accounts }),
  setFilterMonth: (month) => {
    set({ currentFilterMonth: month });
    if (month) {
      localStorage.setItem('investmentFilterMonth', month);
    } else {
      localStorage.removeItem('investmentFilterMonth');
    }
  },
}));
