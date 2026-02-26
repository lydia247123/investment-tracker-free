/**
 * PreciousMetalStore 单元测试
 * 测试贵金属记录的CRUD操作、localStorage同步和4种贵金属类型
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { PreciousMetalRecord, PreciousMetalType } from '@types/preciousMetal';

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
const createTestRecord = (overrides?: Partial<PreciousMetalRecord>): PreciousMetalRecord => ({
  id: `test-${Date.now()}-${Math.random()}`,
  date: '2024-01',
  metalType: '黄金',
  grams: 100,
  pricePerGram: 500,
  averagePrice: 500,
  ...overrides
});

describe('preciousMetalStore - 贵金属记录管理', () => {
  beforeEach(() => {
    localStorage.clear();
    // 重置store状态
    usePreciousMetalStore.setState({
      recordsByMetalType: {
        '黄金': [],
        '白银': [],
        '铂金': [],
        '钯金': [],
      },
      selectedMetalTypes: new Set(),
      currentFilterMonth: null
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应正确初始化4种贵金属类型', () => {
      const state = usePreciousMetalStore.getState();

      expect(state.recordsByMetalType).toHaveProperty('黄金');
      expect(state.recordsByMetalType).toHaveProperty('白银');
      expect(state.recordsByMetalType).toHaveProperty('铂金');
      expect(state.recordsByMetalType).toHaveProperty('钯金');
    });

    it('所有贵金属类型的初始记录应为空数组', () => {
      const state = usePreciousMetalStore.getState();

      expect(state.recordsByMetalType['黄金']).toEqual([]);
      expect(state.recordsByMetalType['白银']).toEqual([]);
      expect(state.recordsByMetalType['铂金']).toEqual([]);
      expect(state.recordsByMetalType['钯金']).toEqual([]);
    });

    it('应正确初始化筛选和月份状态', () => {
      const state = usePreciousMetalStore.getState();

      expect(state.selectedMetalTypes).toEqual(new Set());
      expect(state.currentFilterMonth).toBeNull();
    });
  });

  describe('addRecord - 添加记录', () => {
    it('应正确添加黄金记录', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({ metalType: '黄金' });

      store.addRecord('黄金', record);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(1);
      expect(state.recordsByMetalType['黄金'][0]).toEqual(record);
    });

    it('应正确添加白银记录', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({
        metalType: '白银',
        grams: 1000,
        pricePerGram: 5,
        averagePrice: 5
      });

      store.addRecord('白银', record);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['白银']).toHaveLength(1);
      expect(state.recordsByMetalType['白银'][0].grams).toBe(1000);
    });

    it('应正确添加铂金记录', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({
        metalType: '铂金',
        grams: 50,
        pricePerGram: 200,
        averagePrice: 200
      });

      store.addRecord('铂金', record);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['铂金']).toHaveLength(1);
      expect(state.recordsByMetalType['铂金'][0].grams).toBe(50);
    });

    it('应正确添加钯金记录', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({
        metalType: '钯金',
        grams: 30,
        pricePerGram: 500,
        averagePrice: 500
      });

      store.addRecord('钯金', record);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['钯金']).toHaveLength(1);
      expect(state.recordsByMetalType['钯金'][0].grams).toBe(30);
    });

    it('应支持同种类型添加多条记录', () => {
      const store = usePreciousMetalStore.getState();
      const record1 = createTestRecord({ id: '1', metalType: '黄金' });
      const record2 = createTestRecord({ id: '2', metalType: '黄金' });

      store.addRecord('黄金', record1);
      store.addRecord('黄金', record2);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(2);
    });

    it('添加记录后应自动保存到localStorage', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({ metalType: '黄金' });

      store.addRecord('黄金', record);

      const savedData = localStorage.getItem('preciousMetalRecords');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData['黄金']).toHaveLength(1);
      expect(parsedData['黄金'][0]).toEqual(record);
    });
  });

  describe('updateRecord - 更新记录', () => {
    it('应正确更新黄金记录', () => {
      const store = usePreciousMetalStore.getState();
      const originalRecord = createTestRecord({
        id: 'test-1',
        metalType: '黄金',
        grams: 100,
        pricePerGram: 500
      });

      store.addRecord('黄金', originalRecord);

      const updatedRecord = createTestRecord({
        id: 'test-1',
        metalType: '黄金',
        grams: 150,
        pricePerGram: 520
      });
      store.updateRecord('黄金', 'test-1', updatedRecord);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(1);
      expect(state.recordsByMetalType['黄金'][0].grams).toBe(150);
      expect(state.recordsByMetalType['黄金'][0].pricePerGram).toBe(520);
      expect(state.recordsByMetalType['黄金'][0].id).toBe('test-1'); // ID保持不变
    });

    it('更新记录后应保持metalType字段正确', () => {
      const store = usePreciousMetalStore.getState();
      const originalRecord = createTestRecord({ id: 'test-1', metalType: '黄金' });

      store.addRecord('黄金', originalRecord);

      const updatedRecord = createTestRecord({
        id: 'test-1',
        metalType: '白银' // 错误的metalType
      });
      store.updateRecord('黄金', 'test-1', updatedRecord);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金'][0].metalType).toBe('黄金'); // 应被修正
    });

    it('更新不存在的记录不应改变状态', () => {
      const store = usePreciousMetalStore.getState();
      const record1 = createTestRecord({ id: 'test-1', metalType: '黄金' });

      store.addRecord('黄金', record1);

      const originalLength = usePreciousMetalStore.getState().recordsByMetalType['黄金'].length;
      store.updateRecord('黄金', 'non-existent', record1);

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(originalLength);
    });

    it('更新记录后应自动保存到localStorage', () => {
      const store = usePreciousMetalStore.getState();
      const originalRecord = createTestRecord({
        id: 'test-1',
        metalType: '黄金',
        grams: 100
      });

      store.addRecord('黄金', originalRecord);

      const updatedRecord = createTestRecord({
        id: 'test-1',
        metalType: '黄金',
        grams: 200
      });
      store.updateRecord('黄金', 'test-1', updatedRecord);

      const savedData = localStorage.getItem('preciousMetalRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['黄金'][0].grams).toBe(200);
    });
  });

  describe('deleteRecord - 删除记录', () => {
    it('应正确删除黄金记录', () => {
      const store = usePreciousMetalStore.getState();
      const record1 = createTestRecord({ id: 'test-1', metalType: '黄金' });
      const record2 = createTestRecord({ id: 'test-2', metalType: '黄金' });

      store.addRecord('黄金', record1);
      store.addRecord('黄金', record2);

      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金']).toHaveLength(2);

      store.deleteRecord('黄金', 'test-1');

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(1);
      expect(state.recordsByMetalType['黄金'][0].id).toBe('test-2');
    });

    it('应正确删除白银记录', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({ id: 'test-1', metalType: '白银' });

      store.addRecord('白银', record);
      store.deleteRecord('白银', 'test-1');

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['白银']).toHaveLength(0);
    });

    it('删除记录后应自动保存到localStorage', () => {
      const store = usePreciousMetalStore.getState();
      const record1 = createTestRecord({ id: 'test-1', metalType: '黄金' });
      const record2 = createTestRecord({ id: 'test-2', metalType: '黄金' });

      store.addRecord('黄金', record1);
      store.addRecord('黄金', record2);

      store.deleteRecord('黄金', 'test-1');

      const savedData = localStorage.getItem('preciousMetalRecords');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData['黄金']).toHaveLength(1);
      expect(parsedData['黄金'][0].id).toBe('test-2');
    });

    it('删除所有记录后类型应仍存在', () => {
      const store = usePreciousMetalStore.getState();
      const record = createTestRecord({ id: 'test-1', metalType: '黄金' });

      store.addRecord('黄金', record);
      store.deleteRecord('黄金', 'test-1');

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toBeDefined();
      expect(state.recordsByMetalType['黄金']).toHaveLength(0);
    });
  });

  describe('loadRecords - 加载记录', () => {
    it('应从localStorage正确加载黄金记录', () => {
      const testData = {
        '黄金': [
          createTestRecord({ id: '1', metalType: '黄金' }),
          createTestRecord({ id: '2', metalType: '黄金' })
        ],
        '白银': []
      };
      localStorage.setItem('preciousMetalRecords', JSON.stringify(testData));

      const store = usePreciousMetalStore.getState();
      store.loadRecords();

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(2);
      expect(state.recordsByMetalType['黄金'][0]).toEqual(testData['黄金'][0]);
    });

    it('应从localStorage正确加载多种贵金属记录', () => {
      const testData = {
        '黄金': [createTestRecord({ id: '1', metalType: '黄金' })],
        '白银': [createTestRecord({ id: '2', metalType: '白银', grams: 1000 })],
        '铂金': [createTestRecord({ id: '3', metalType: '铂金', grams: 50 })],
        '钯金': []
      };
      localStorage.setItem('preciousMetalRecords', JSON.stringify(testData));

      const store = usePreciousMetalStore.getState();
      store.loadRecords();

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toHaveLength(1);
      expect(state.recordsByMetalType['白银']).toHaveLength(1);
      expect(state.recordsByMetalType['铂金']).toHaveLength(1);
      expect(state.recordsByMetalType['钯金']).toHaveLength(0);
    });

    it('应正确加载筛选月份', () => {
      localStorage.setItem('metalFilterMonth', '2024-01');

      const store = usePreciousMetalStore.getState();
      store.loadRecords();

      const state = usePreciousMetalStore.getState();
      expect(state.currentFilterMonth).toBe('2024-01');
    });

    it('localStorage无数据时应保持初始状态', () => {
      const store = usePreciousMetalStore.getState();
      store.loadRecords();

      const state = usePreciousMetalStore.getState();
      expect(state.recordsByMetalType['黄金']).toEqual([]);
      expect(state.recordsByMetalType['白银']).toEqual([]);
      expect(state.recordsByMetalType['铂金']).toEqual([]);
      expect(state.recordsByMetalType['钯金']).toEqual([]);
    });
  });

  describe('筛选功能', () => {
    it('应正确设置贵金属类型筛选', () => {
      const store = usePreciousMetalStore.getState();
      const filterSet = new Set<PreciousMetalType>(['黄金', '白银']);

      store.setSelectedMetalTypes(filterSet);

      const state = usePreciousMetalStore.getState();
      expect(state.selectedMetalTypes).toEqual(filterSet);
    });

    it('应正确筛选单种贵金属', () => {
      const store = usePreciousMetalStore.getState();
      const filterSet = new Set<PreciousMetalType>(['黄金']);

      store.setSelectedMetalTypes(filterSet);

      const state = usePreciousMetalStore.getState();
      expect(state.selectedMetalTypes).toEqual(filterSet);
      expect(state.selectedMetalTypes.has('黄金')).toBe(true);
      expect(state.selectedMetalTypes.has('白银')).toBe(false);
    });

    it('设置筛选月份应保存到localStorage', () => {
      const store = usePreciousMetalStore.getState();
      store.setFilterMonth('2024-01');

      expect(localStorage.getItem('metalFilterMonth')).toBe('2024-01');
    });

    it('清除筛选月份应从localStorage删除', () => {
      const store = usePreciousMetalStore.getState();
      store.setFilterMonth('2024-01');
      expect(localStorage.getItem('metalFilterMonth')).toBe('2024-01');

      store.setFilterMonth(null);
      expect(localStorage.getItem('metalFilterMonth')).toBeNull();
    });
  });

  describe('saveRecords - 保存记录', () => {
    it('应正确保存所有贵金属类型到localStorage', () => {
      const store = usePreciousMetalStore.getState();
      const goldRecord = createTestRecord({ id: '1', metalType: '黄金' });
      const silverRecord = createTestRecord({ id: '2', metalType: '白银', grams: 1000 });

      store.addRecord('黄金', goldRecord);
      store.addRecord('白银', silverRecord);

      const savedData = localStorage.getItem('preciousMetalRecords');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData['黄金']).toHaveLength(1);
      expect(parsedData['白银']).toHaveLength(1);
      expect(parsedData['黄金'][0]).toEqual(goldRecord);
      expect(parsedData['白银'][0]).toEqual(silverRecord);
    });

    it('应正确保存空状态', () => {
      const store = usePreciousMetalStore.getState();
      store.saveRecords();

      const savedData = localStorage.getItem('preciousMetalRecords');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData['黄金']).toEqual([]);
      expect(parsedData['白银']).toEqual([]);
      expect(parsedData['铂金']).toEqual([]);
      expect(parsedData['钯金']).toEqual([]);
    });
  });

  describe('完整CRUD流程', () => {
    it('黄金应支持完整的创建-读取-更新-删除流程', () => {
      const store = usePreciousMetalStore.getState();

      // Create
      const record = createTestRecord({ id: 'test-1', metalType: '黄金', grams: 100 });
      store.addRecord('黄金', record);
      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金']).toHaveLength(1);

      // Read
      const loadedStore = usePreciousMetalStore.getState();
      expect(loadedStore.recordsByMetalType['黄金'][0].grams).toBe(100);

      // Update
      const updatedRecord = createTestRecord({ id: 'test-1', metalType: '黄金', grams: 200 });
      store.updateRecord('黄金', 'test-1', updatedRecord);
      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金'][0].grams).toBe(200);

      // Delete
      store.deleteRecord('黄金', 'test-1');
      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金']).toHaveLength(0);
    });

    it('应支持多种贵金属的混合操作', () => {
      const store = usePreciousMetalStore.getState();

      // 添加不同贵金属
      const goldRecord = createTestRecord({ id: '1', metalType: '黄金' });
      const silverRecord = createTestRecord({ id: '2', metalType: '白银', grams: 1000 });
      const platinumRecord = createTestRecord({ id: '3', metalType: '铂金', grams: 50 });

      store.addRecord('黄金', goldRecord);
      store.addRecord('白银', silverRecord);
      store.addRecord('铂金', platinumRecord);

      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金']).toHaveLength(1);
      expect(usePreciousMetalStore.getState().recordsByMetalType['白银']).toHaveLength(1);
      expect(usePreciousMetalStore.getState().recordsByMetalType['铂金']).toHaveLength(1);

      // 更新白银记录
      const updatedSilver = createTestRecord({ id: '2', metalType: '白银', grams: 2000 });
      store.updateRecord('白银', '2', updatedSilver);
      expect(usePreciousMetalStore.getState().recordsByMetalType['白银'][0].grams).toBe(2000);

      // 删除黄金记录
      store.deleteRecord('黄金', '1');
      expect(usePreciousMetalStore.getState().recordsByMetalType['黄金']).toHaveLength(0);

      // 铂金记录应保持不变
      expect(usePreciousMetalStore.getState().recordsByMetalType['铂金']).toHaveLength(1);
    });

    it('localStorage应保持与Store状态一致', () => {
      const store = usePreciousMetalStore.getState();

      // 添加记录
      const goldRecord = createTestRecord({ id: '1', metalType: '黄金' });
      const silverRecord = createTestRecord({ id: '2', metalType: '白银', grams: 1000 });
      store.addRecord('黄金', goldRecord);
      store.addRecord('白银', silverRecord);

      let savedData = JSON.parse(localStorage.getItem('preciousMetalRecords')!);
      expect(savedData['黄金']).toHaveLength(1);
      expect(savedData['白银']).toHaveLength(1);

      // 更新记录
      const updatedGold = createTestRecord({ id: '1', metalType: '黄金', grams: 500 });
      store.updateRecord('黄金', '1', updatedGold);

      savedData = JSON.parse(localStorage.getItem('preciousMetalRecords')!);
      expect(savedData['黄金'][0].grams).toBe(500);

      // 删除记录
      store.deleteRecord('白银', '2');

      savedData = JSON.parse(localStorage.getItem('preciousMetalRecords')!);
      expect(savedData['白银']).toHaveLength(0);
    });
  });
});
