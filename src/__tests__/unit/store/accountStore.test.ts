/**
 * AccountStore 单元测试
 * 测试账户管理的CRUD操作、默认账户和分组功能
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAccountStore } from '@store/accountStore';
import { Account } from '@types/account';

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

// 辅助函数：创建测试账户
const createTestAccount = (overrides?: Partial<Account>): Account => ({
  name: '测试账户',
  type: '银行账户',
  balance: 10000,
  ...overrides
});

describe('accountStore - 账户管理', () => {
  beforeEach(() => {
    localStorage.clear();
    // 重置store状态
    useAccountStore.setState({
      accounts: []
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应正确初始化默认状态', () => {
      const state = useAccountStore.getState();

      expect(state.accounts).toEqual([]);
    });
  });

  describe('addAccount - 添加账户', () => {
    it('应正确添加单个账户', () => {
      const store = useAccountStore.getState();
      const account = createTestAccount({ name: '招商银行' });

      store.addAccount(account);

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0]).toEqual(account);
    });

    it('应正确添加多个账户', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行' });
      const account2 = createTestAccount({ name: '支付宝' });

      store.addAccount(account1);
      store.addAccount(account2);

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(2);
      expect(state.accounts[0].name).toBe('招商银行');
      expect(state.accounts[1].name).toBe('支付宝');
    });

    it('添加账户后应自动保存到localStorage', () => {
      const store = useAccountStore.getState();
      const account = createTestAccount({ name: '测试账户' });

      store.addAccount(account);

      const savedData = localStorage.getItem('accounts');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0]).toEqual(account);
    });
  });

  describe('updateAccount - 更新账户', () => {
    it('应正确更新指定索引的账户', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行', balance: 1000 });
      const account2 = createTestAccount({ name: '支付宝', balance: 2000 });

      store.addAccount(account1);
      store.addAccount(account2);

      const updatedAccount = createTestAccount({ name: '招商银行', balance: 5000 });
      store.updateAccount(0, updatedAccount);

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(2);
      expect(state.accounts[0].balance).toBe(5000);
      expect(state.accounts[1].balance).toBe(2000); // 其他账户不变
    });

    it('更新账户后应自动保存到localStorage', () => {
      const store = useAccountStore.getState();
      const account = createTestAccount({ name: '测试账户', balance: 1000 });

      store.addAccount(account);

      const updatedAccount = createTestAccount({ name: '测试账户', balance: 3000 });
      store.updateAccount(0, updatedAccount);

      const savedData = localStorage.getItem('accounts');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData[0].balance).toBe(3000);
    });

    it('更新账户应保持数组长度不变', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '账户1' });
      const account2 = createTestAccount({ name: '账户2' });

      store.addAccount(account1);
      store.addAccount(account2);

      const originalLength = useAccountStore.getState().accounts.length;
      store.updateAccount(0, account1);

      expect(useAccountStore.getState().accounts.length).toBe(originalLength);
    });
  });

  describe('deleteAccount - 删除账户', () => {
    it('应正确删除指定索引的账户', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行' });
      const account2 = createTestAccount({ name: '支付宝' });
      const account3 = createTestAccount({ name: '微信' });

      store.addAccount(account1);
      store.addAccount(account2);
      store.addAccount(account3);

      expect(useAccountStore.getState().accounts).toHaveLength(3);

      store.deleteAccount(1); // 删除支付宝

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(2);
      expect(state.accounts[0].name).toBe('招商银行');
      expect(state.accounts[1].name).toBe('微信');
    });

    it('删除账户后应自动保存到localStorage', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '账户1' });
      const account2 = createTestAccount({ name: '账户2' });

      store.addAccount(account1);
      store.addAccount(account2);

      store.deleteAccount(0);

      const savedData = localStorage.getItem('accounts');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].name).toBe('账户2');
    });

    it('删除所有账户后数组应为空', () => {
      const store = useAccountStore.getState();
      const account = createTestAccount({ name: '测试账户' });

      store.addAccount(account);
      store.deleteAccount(0);

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(0);
    });
  });

  describe('updateAccountsGroup - 批量更新账户分组', () => {
    it('应正确批量更新账户分组', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行', group: 'group1' });
      const account2 = createTestAccount({ name: '支付宝', group: 'group1' });
      const account3 = createTestAccount({ name: '微信', group: 'group2' });

      store.addAccount(account1);
      store.addAccount(account2);
      store.addAccount(account3);

      store.updateAccountsGroup('group1', 'group3');

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBe('group3');
      expect(state.accounts[1].group).toBe('group3');
      expect(state.accounts[2].group).toBe('group2'); // 不在group1的不变
    });

    it('应支持将账户从分组移除', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行', group: 'group1' });

      store.addAccount(account1);

      store.updateAccountsGroup('group1', undefined);

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBeUndefined();
    });

    it('批量更新后应自动保存到localStorage', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行', group: 'group1' });
      const account2 = createTestAccount({ name: '支付宝', group: 'group1' });

      store.addAccount(account1);
      store.addAccount(account2);

      store.updateAccountsGroup('group1', 'group2');

      const savedData = localStorage.getItem('accounts');
      const parsedData = JSON.parse(savedData!);
      expect(parsedData[0].group).toBe('group2');
      expect(parsedData[1].group).toBe('group2');
    });

    it('更新不存在的分组不应影响账户', () => {
      const store = useAccountStore.getState();
      const account = createTestAccount({ name: '招商银行', group: 'group1' });

      store.addAccount(account);

      store.updateAccountsGroup('non-existent', 'group2');

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBe('group1');
    });
  });

  describe('loadAccounts - 加载账户', () => {
    it('应从localStorage正确加载账户', () => {
      const testData = [
        createTestAccount({ name: '招商银行' }),
        createTestAccount({ name: '支付宝' })
      ];
      localStorage.setItem('accounts', JSON.stringify(testData));

      const store = useAccountStore.getState();
      store.loadAccounts();

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(2);
      expect(state.accounts[0].name).toBe('招商银行');
      expect(state.accounts[1].name).toBe('支付宝');
    });

    it('localStorage无数据时应保持空状态', () => {
      const store = useAccountStore.getState();
      store.loadAccounts();

      const state = useAccountStore.getState();
      expect(state.accounts).toEqual([]);
    });
  });

  describe('数据迁移 - 分组字段', () => {
    it('应为旧账户数据添加默认分组', () => {
      // 模拟旧数据（无group字段）
      const oldAccounts: Account[] = [
        createTestAccount({ name: '招商银行' }),
        createTestAccount({ name: '支付宝' })
      ];
      // 移除group字段
      oldAccounts.forEach(acc => delete (acc as any).group);

      localStorage.setItem('accounts', JSON.stringify(oldAccounts));

      const store = useAccountStore.getState();
      store.loadAccounts();

      // 验证迁移标记已设置
      expect(localStorage.getItem('accountGroupMigration')).toBe('true');

      // 账户应被加载
      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(2);
    });

    it('已存在分组字段的账户不应被修改', () => {
      const newAccounts = [
        createTestAccount({ name: '招商银行', group: 'group1' })
      ];
      localStorage.setItem('accounts', JSON.stringify(newAccounts));
      localStorage.setItem('accountGroupMigration', 'true');

      const store = useAccountStore.getState();
      store.loadAccounts();

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBe('group1');
    });

    it('应保留已有的分组，不为undefined分组设置默认值', () => {
      const accounts = [
        createTestAccount({ name: '招商银行', group: 'group1' }),
        createTestAccount({ name: '支付宝', group: undefined })
      ];
      localStorage.setItem('accounts', JSON.stringify(accounts));
      localStorage.setItem('accountGroupMigration', 'true');

      const store = useAccountStore.getState();
      store.loadAccounts();

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBe('group1');
      expect(state.accounts[1].group).toBeUndefined();
    });
  });

  describe('saveAccounts - 保存账户', () => {
    it('应正确保存账户到localStorage', () => {
      const store = useAccountStore.getState();
      const account1 = createTestAccount({ name: '招商银行' });
      const account2 = createTestAccount({ name: '支付宝' });

      store.addAccount(account1);
      store.addAccount(account2);

      const savedData = localStorage.getItem('accounts');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveLength(2);
      expect(parsedData[0]).toEqual(account1);
      expect(parsedData[1]).toEqual(account2);
    });

    it('应正确保存空状态', () => {
      const store = useAccountStore.getState();
      store.saveAccounts();

      const savedData = localStorage.getItem('accounts');
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual([]);
    });
  });

  describe('完整CRUD流程', () => {
    it('应支持完整的创建-读取-更新-删除流程', () => {
      const store = useAccountStore.getState();

      // Create
      const account = createTestAccount({ name: '招商银行', balance: 1000 });
      store.addAccount(account);
      expect(useAccountStore.getState().accounts).toHaveLength(1);

      // Read
      const loadedStore = useAccountStore.getState();
      expect(loadedStore.accounts[0].balance).toBe(1000);

      // Update
      const updatedAccount = createTestAccount({ name: '招商银行', balance: 5000 });
      store.updateAccount(0, updatedAccount);
      expect(useAccountStore.getState().accounts[0].balance).toBe(5000);

      // Delete
      store.deleteAccount(0);
      expect(useAccountStore.getState().accounts).toHaveLength(0);
    });

    it('localStorage应保持与Store状态一致', () => {
      const store = useAccountStore.getState();

      // 添加账户
      const account1 = createTestAccount({ name: '招商银行', balance: 1000 });
      const account2 = createTestAccount({ name: '支付宝', balance: 2000 });
      store.addAccount(account1);
      store.addAccount(account2);

      let savedData = JSON.parse(localStorage.getItem('accounts')!);
      expect(savedData).toHaveLength(2);

      // 更新账户
      const updatedAccount = createTestAccount({ name: '招商银行', balance: 3000 });
      store.updateAccount(0, updatedAccount);

      savedData = JSON.parse(localStorage.getItem('accounts')!);
      expect(savedData[0].balance).toBe(3000);

      // 删除账户
      store.deleteAccount(0);

      savedData = JSON.parse(localStorage.getItem('accounts')!);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('支付宝');
    });

    it('应支持账户分组管理的完整流程', () => {
      const store = useAccountStore.getState();

      // 添加带分组的账户
      const account1 = createTestAccount({ name: '招商银行', group: 'group1' });
      const account2 = createTestAccount({ name: '支付宝', group: 'group1' });
      const account3 = createTestAccount({ name: '微信', group: 'group2' });

      store.addAccount(account1);
      store.addAccount(account2);
      store.addAccount(account3);

      // 批量更新分组
      store.updateAccountsGroup('group1', 'group3');

      const state = useAccountStore.getState();
      expect(state.accounts[0].group).toBe('group3');
      expect(state.accounts[1].group).toBe('group3');
      expect(state.accounts[2].group).toBe('group2');

      // 移除分组
      store.updateAccountsGroup('group3', undefined);

      expect(useAccountStore.getState().accounts[0].group).toBeUndefined();
      expect(useAccountStore.getState().accounts[1].group).toBeUndefined();
    });
  });
});
