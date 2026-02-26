import { create } from 'zustand';
import { RecordsByMetalType, PreciousMetalRecord, PreciousMetalType } from '../types/preciousMetal';
import { addAccountToPreciousMetals } from '../utils/migrations/addAccountToPreciousMetals';
import { useAccountStore } from './accountStore';

interface PreciousMetalState {
  recordsByMetalType: RecordsByMetalType;
  selectedMetalTypes: Set<PreciousMetalType>;
  currentFilterMonth: string | null;
  isLoaded: boolean;

  // Actions
  loadRecords: (force?: boolean) => void;
  saveRecords: () => void;
  addRecord: (metalType: PreciousMetalType, record: PreciousMetalRecord) => void;
  updateRecord: (metalType: PreciousMetalType, recordId: string, record: PreciousMetalRecord) => void;
  deleteRecord: (metalType: PreciousMetalType, recordId: string) => void;
  setSelectedMetalTypes: (types: Set<PreciousMetalType>) => void;
  setFilterMonth: (month: string | null) => void;
}

export const usePreciousMetalStore = create<PreciousMetalState>((set, get) => ({
  recordsByMetalType: {
    'Gold': [],
    'Silver': [],
    'Platinum': [],
    'Palladium': [],
  },
  selectedMetalTypes: new Set(),
  currentFilterMonth: null,
  isLoaded: false,

  loadRecords: (force = false) => {
    if (get().isLoaded && !force) {
      console.log('🥇 preciousMetalStore: Data already loaded, skipping duplicate read');
      return;
    }
    console.log('🥇 preciousMetalStore.loadRecords starting execution');
    const records = localStorage.getItem('preciousMetalRecords');
    const filterMonth = localStorage.getItem('metalFilterMonth');

    console.log('🥇 localStorage read result:', {
      hasRecords: !!records,
      hasFilterMonth: !!filterMonth,
    });

    if (records) {
      let parsedRecords = JSON.parse(records);
      console.log('🥇 Parsed precious metal types:', Object.keys(parsedRecords));
      console.log('🥇 Total record count:', Object.values(parsedRecords).flat().length);

      // Data migration: Add account field to old records
      const accountStore = useAccountStore.getState();
      const defaultAccount = accountStore.accounts[0]?.name || 'Default Account';
      const hasMigration = localStorage.getItem('preciousMetalAccountMigration');

      if (!hasMigration) {
        const migrationResult = addAccountToPreciousMetals(parsedRecords, defaultAccount);
        if (migrationResult.count > 0) {
          parsedRecords = migrationResult.migrated;
          localStorage.setItem('preciousMetalRecords', JSON.stringify(parsedRecords));
          localStorage.setItem('preciousMetalAccountMigration', 'true');
          console.log('✅ Precious metal record account migration completed');
        }
      }

      // Data migration: Convert Chinese metal types to English
      const englishMigration = () => {
        const migrationFlag = localStorage.getItem('englishMetalMigration_v1');
        if (migrationFlag) return;

        try {
          const METAL_TYPE_MAP: Record<string, string> = {
            '黄金': 'Gold',
            '白银': 'Silver',
            '铂金': 'Platinum',
            '钯金': 'Palladium'
          };

          // Check if migration is needed
          const needsMigration = Object.keys(parsedRecords).some(key =>
            Object.keys(METAL_TYPE_MAP).includes(key)
          );

          if (needsMigration) {
            const migratedRecords: RecordsByMetalType = {};

            Object.entries(parsedRecords).forEach(([metalType, records]) => {
              const newMetalType = METAL_TYPE_MAP[metalType] || metalType;
              const migratedRecordsList = records.map((record: PreciousMetalRecord) => ({
                ...record,
                metalType: newMetalType
              }));
              migratedRecords[newMetalType] = migratedRecordsList;
            });

            // Save migrated data
            parsedRecords = migratedRecords;
            localStorage.setItem('preciousMetalRecords', JSON.stringify(parsedRecords));
            console.log('✅ Precious metal data migrated to English successfully');
          }

          // Mark migration as complete
          localStorage.setItem('englishMetalMigration_v1', 'true');
        } catch (e) {
          console.error('❌ Precious metal migration failed:', e);
        }
      };

      englishMigration();

      set({ recordsByMetalType: parsedRecords });
      console.log('✅ preciousMetalStore updated recordsByMetalType');
    } else {
      console.warn('⚠️ preciousMetalStore: No preciousMetalRecords in localStorage');
    }
    if (filterMonth) set({ currentFilterMonth: filterMonth });
    set({ isLoaded: true });
  },

  saveRecords: () => {
    const { recordsByMetalType } = get();
    localStorage.setItem('preciousMetalRecords', JSON.stringify(recordsByMetalType));
  },

  addRecord: (metalType, record) => {
    const { recordsByMetalType } = get();
    const newRecords = {
      ...recordsByMetalType,
      [metalType]: [...(recordsByMetalType[metalType] || []), record]
    };
    set({ recordsByMetalType: newRecords });
    get().saveRecords();
  },

  updateRecord: (metalType, recordId, updatedRecord) => {
    const { recordsByMetalType } = get();
    const newRecords = { ...recordsByMetalType };
    const index = newRecords[metalType].findIndex(r => r.id === recordId);

    if (index !== -1) {
      newRecords[metalType][index] = {
        ...updatedRecord,
        id: recordId, // Keep original ID
        metalType: metalType // Ensure correct metal type
      };
      set({ recordsByMetalType: newRecords });
      get().saveRecords();
    }
  },

  deleteRecord: (metalType, recordId) => {
    const { recordsByMetalType } = get();
    const newRecords = { ...recordsByMetalType };
    newRecords[metalType] = newRecords[metalType].filter(r => r.id !== recordId);
    set({ recordsByMetalType: newRecords });
    get().saveRecords();
  },

  setSelectedMetalTypes: (types) => set({ selectedMetalTypes: types }),
  setFilterMonth: (month) => {
    set({ currentFilterMonth: month });
    if (month) {
      localStorage.setItem('metalFilterMonth', month);
    } else {
      localStorage.removeItem('metalFilterMonth');
    }
  },
}));
