/**
 * InvestmentStore 单元测试
 * 测试投资记录的CRUD操作、localStorage同步和数据迁移
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useInvestmentStore } from '@store/investmentStore';
import { InvestmentRecord } from '@types/investment';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 辅助函数：创建测试记录
const createTestRecord = (overrides?: Partial<InvestmentRecord>): InvestmentRecord => ({
  id: `test-${Date.now()}-${Math.random()}`,
  date: '2024-01',
  amount: 1000,
  currency: 'CNY',
  account: '测试账户',
  assetType: '股票',
  ...overrides
});

describe('investmentStore - 投资记录管理', () => {
  beforeEach(() => {
    localStorage.clear();
    // 重置store状态
    useInvestmentStore.setState({
      recordsByType: {},
      selectedAssetTypes: new Set(),
      selectedAccounts: new Set(),
      currentFilterMonth: null
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应正确初始化默认状态', () => {
      const state = useInvestmentStore.getState();

      expect(state.recordsByType).toEqual({});
      expect(state.selectedAssetTypes).toEqual(new Set());
      expect(state.selectedAccounts).toEqual(new Set());
      expect(state.currentFilterMonth).toBeNull();
    });
  });

  describe('addRecord - 添加记录', () => {
    it('应正确添加单条记录', () => {
      const store = useInvestmentStore.getState();
      const record = createTestRecord();

      store.addRecord('股票', record);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(1);
      expect(state.recordsByType['股票'][0]).toEqual(record);
    });

    it('应正确添加多条记录到同一类型', () => {
      const store = useInvestmentStore.getState();
      const record1 = createTestRecord({ id: '1' });
      const record2 = createTestRecord({ id: '2' });

      store.addRecord('股票', record1);
      store.addRecord('股票', record2);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(2);
      expect(state.recordsByType['股票'][0]).toEqual(record1);
      expect(state.recordsByType['股票'][1]).toEqual(record2);
    });

    it('应正确添加不同类型的记录', () => {
      const store = useInvestmentStore.getState();
      const stockRecord = createTestRecord({ id: '1', assetType: '股票' });
      const fundRecord = createTestRecord({ id: '2', assetType: '基金' });

      store.addRecord('股票', stockRecord);
      store.addRecord('基金', fundRecord);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(1);
      expect(state.recordsByType['基金']).toHaveLength(1);
      expect(state.recordsByType['股票'][0]).toEqual(stockRecord);
      expect(state.recordsByType['基金'][0]).toEqual(fundRecord);
    });

    it('添加记录后应自动保存到localStorage', () => {
      const store = useInvestmentStore.getState();
      const record = createTestRecord();

      store.addRecord('股票', record);

      const savedData = localStorage.getItem('investmentRecords');
      expect(savedData).toBeTruthy();
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['股票']).toHaveLength(1);
      expect(parsedData['股票'][0]).toEqual(record);
    });
  });

  describe('updateRecord - 更新记录', () => {
    it('应正确更新存在的记录', () => {
      const store = useInvestmentStore.getState();
      const originalRecord = createTestRecord({ id: 'test-1', amount: 1000 });

      store.addRecord('股票', originalRecord);

      const updatedRecord = createTestRecord({ id: 'test-1', amount: 2000 });
      store.updateRecord('股票', 'test-1', updatedRecord);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(1);
      expect(state.recordsByType['股票'][0].amount).toBe(2000);
      expect(state.recordsByType['股票'][0].id).toBe('test-1'); // ID保持不变
    });

    it('更新记录后应保持assetType字段正确', () => {
      const store = useInvestmentStore.getState();
      const originalRecord = createTestRecord({ id: 'test-1', assetType: '股票' });

      store.addRecord('股票', originalRecord);

      const updatedRecord = createTestRecord({
        id: 'test-1',
        assetType: '债券' // 错误的assetType
      });
      store.updateRecord('股票', 'test-1', updatedRecord);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票'][0].assetType).toBe('股票'); // 应被修正
    });

    it('更新不存在的记录不应改变状态', () => {
      const store = useInvestmentStore.getState();
      const record1 = createTestRecord({ id: 'test-1' });

      store.addRecord('股票', record1);

      const originalLength = useInvestmentStore.getState().recordsByType['股票'].length;
      store.updateRecord('股票', 'non-existent', record1);

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(originalLength);
    });

    it('更新记录后应自动保存到localStorage', () => {
      const store = useInvestmentStore.getState();
      const originalRecord = createTestRecord({ id: 'test-1', amount: 1000 });

      store.addRecord('股票', originalRecord);

      const updatedRecord = createTestRecord({ id: 'test-1', amount: 2000 });
      store.updateRecord('股票', 'test-1', updatedRecord);

      const savedData = localStorage.getItem('investmentRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['股票'][0].amount).toBe(2000);
    });
  });

  describe('deleteRecord - 删除记录', () => {
    it('应正确删除存在的记录', () => {
      const store = useInvestmentStore.getState();
      const record1 = createTestRecord({ id: 'test-1' });
      const record2 = createTestRecord({ id: 'test-2' });

      store.addRecord('股票', record1);
      store.addRecord('股票', record2);

      expect(useInvestmentStore.getState().recordsByType['股票']).toHaveLength(2);

      store.deleteRecord('股票', 'test-1');

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(1);
      expect(state.recordsByType['股票'][0].id).toBe('test-2');
    });

    it('删除记录后应自动保存到localStorage', () => {
      const store = useInvestmentStore.getState();
      const record1 = createTestRecord({ id: 'test-1' });
      const record2 = createTestRecord({ id: 'test-2' });

      store.addRecord('股票', record1);
      store.addRecord('股票', record2);

      store.deleteRecord('股票', 'test-1');

      const savedData = localStorage.getItem('investmentRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['股票']).toHaveLength(1);
      expect(parsedData['股票'][0].id).toBe('test-2');
    });

    it('删除所有记录后类型应仍存在', () => {
      const store = useInvestmentStore.getState();
      const record = createTestRecord({ id: 'test-1' });

      store.addRecord('股票', record);
      store.deleteRecord('股票', 'test-1');

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toBeDefined();
      expect(state.recordsByType['股票']).toHaveLength(0);
    });
  });

  describe('loadRecords - 加载记录', () => {
    it('应从localStorage正确加载记录', () => {
      const testData = {
        '股票': [
          createTestRecord({ id: '1' }),
          createTestRecord({ id: '2' })
        ]
      };
      localStorage.setItem('investmentRecords', JSON.stringify(testData));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票']).toHaveLength(2);
      expect(state.recordsByType['股票'][0]).toEqual(testData['股票'][0]);
    });

    it('应正确加载筛选月份', () => {
      localStorage.setItem('investmentFilterMonth', '2024-01');

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.currentFilterMonth).toBe('2024-01');
    });

    it('localStorage无数据时应保持空状态', () => {
      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType).toEqual({});
    });

    it('应清理旧的initialAssets数据', () => {
      localStorage.setItem('initialAssets', JSON.stringify({ test: 'data' }));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      expect(localStorage.getItem('initialAssets')).toBeNull();
    });
  });

  describe('数据迁移 - assetType字段', () => {
    it('应为旧记录自动添加assetType字段', () => {
      // 模拟旧数据（无assetType字段）
      const oldData = {
        '股票': [
          {
            id: 'test-1',
            date: '2024-01',
            amount: 1000,
            currency: 'CNY',
            account: '测试账户'
            // 缺少assetType字段
          }
        ]
      };
      localStorage.setItem('investmentRecords', JSON.stringify(oldData));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票'][0]).toHaveProperty('assetType', '股票');

      // 验证保存回localStorage
      const savedData = localStorage.getItem('investmentRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['股票'][0].assetType).toBe('股票');
    });

    it('已存在assetType字段的记录不应被修改', () => {
      const newData = {
        '股票': [
          createTestRecord({ id: 'test-1', assetType: '股票' })
        ]
      };
      localStorage.setItem('investmentRecords', JSON.stringify(newData));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票'][0].assetType).toBe('股票');
    });
  });

  describe('数据迁移 - currency字段', () => {
    it('应为旧记录自动添加currency字段（默认CNY）', () => {
      // 模拟旧数据（无currency字段）
      const oldData = {
        '股票': [
          {
            id: 'test-1',
            date: '2024-01',
            amount: 1000,
            account: '测试账户',
            assetType: '股票'
            // 缺少currency字段
          }
        ]
      };
      localStorage.setItem('investmentRecords', JSON.stringify(oldData));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票'][0]).toHaveProperty('currency', 'CNY');

      // 验证保存回localStorage
      const savedData = localStorage.getItem('investmentRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['股票'][0].currency).toBe('CNY');
    });

    it('已存在currency字段的记录不应被修改', () => {
      const newData = {
        '股票': [
          createTestRecord({ id: 'test-1', currency: 'USD' })
        ]
      };
      localStorage.setItem('investmentRecords', JSON.stringify(newData));

      const store = useInvestmentStore.getState();
      store.loadRecords();

      const state = useInvestmentStore.getState();
      expect(state.recordsByType['股票'][0].currency).toBe('USD');
    });
  });

  describe('筛选功能', () => {
    it('应正确设置资产类型筛选', () => {
      const store = useInvestmentStore.getState();
      const filterSet = new Set(['股票', '基金']);

      store.setSelectedAssetTypes(filterSet);

      const state = useInvestmentStore.getState();
      expect(state.selectedAssetTypes).toEqual(filterSet);
    });

    it('应正确设置账户筛选', () => {
      const store = useInvestmentStore.getState();
      const accountSet = new Set(['招商银行', '支付宝']);

      store.setSelectedAccounts(accountSet);

      const state = useInvestmentStore.getState();
      expect(state.selectedAccounts).toEqual(accountSet);
    });

    it('设置筛选月份应保存到localStorage', () => {
      const store = useInvestmentStore.getState();
      store.setFilterMonth('2024-01');

      expect(localStorage.getItem('investmentFilterMonth')).toBe('2024-01');
    });

    it('清除筛选月份应从localStorage删除', () => {
      const store = useInvestmentStore.getState();
      store.setFilterMonth('2024-01');
      expect(localStorage.getItem('investmentFilterMonth')).toBe('2024-01');

      store.setFilterMonth(null);
      expect(localStorage.getItem('investmentFilterMonth')).toBeNull();
    });
  });

  describe('saveRecords - 保存记录', () => {
    it('应正确保存当前状态到localStorage', () => {
      const store = useInvestmentStore.getState();
      const record = createTestRecord();

      store.addRecord('股票', record);

      const savedData = localStorage.getItem('investmentRecords');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toEqual({
        '股票': [record]
      });
    });

    it('应正确保存空状态', () => {
      const store = useInvestmentStore.getState();
      store.saveRecords();

      const savedData = localStorage.getItem('investmentRecords');
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({});
    });
  });

  describe('完整CRUD流程', () => {
    it('应支持完整的创建-读取-更新-删除流程', () => {
      const store = useInvestmentStore.getState();

      // Create
      const record = createTestRecord({ id: 'test-1', amount: 1000 });
      store.addRecord('股票', record);
      expect(useInvestmentStore.getState().recordsByType['股票']).toHaveLength(1);

      // Read
      const loadedStore = useInvestmentStore.getState();
      expect(loadedStore.recordsByType['股票'][0].amount).toBe(1000);

      // Update
      const updatedRecord = createTestRecord({ id: 'test-1', amount: 2000 });
      store.updateRecord('股票', 'test-1', updatedRecord);
      expect(useInvestmentStore.getState().recordsByType['股票'][0].amount).toBe(2000);

      // Delete
      store.deleteRecord('股票', 'test-1');
      expect(useInvestmentStore.getState().recordsByType['股票']).toHaveLength(0);
    });

    it('localStorage应保持与Store状态一致', () => {
      const store = useInvestmentStore.getState();

      // 添加记录
      const record1 = createTestRecord({ id: 'test-1' });
      const record2 = createTestRecord({ id: 'test-2' });
      store.addRecord('股票', record1);
      store.addRecord('基金', record2);

      let savedData = JSON.parse(localStorage.getItem('investmentRecords')!);
      expect(savedData['股票']).toHaveLength(1);
      expect(savedData['基金']).toHaveLength(1);

      // 更新记录
      const updatedRecord = createTestRecord({ id: 'test-1', amount: 5000 });
      store.updateRecord('股票', 'test-1', updatedRecord);

      savedData = JSON.parse(localStorage.getItem('investmentRecords')!);
      expect(savedData['股票'][0].amount).toBe(5000);

      // 删除记录
      store.deleteRecord('基金', 'test-2');

      savedData = JSON.parse(localStorage.getItem('investmentRecords')!);
      expect(savedData['基金']).toHaveLength(0);
    });
  });
});
