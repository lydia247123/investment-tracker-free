import { create } from 'zustand';
import { Account } from '../types/account';

interface AccountState {
  accounts: Account[];

  loadAccounts: () => void;
  saveAccounts: () => void;
  addAccount: (account: Account) => void;
  updateAccount: (index: number, account: Account) => void;
  deleteAccount: (index: number) => void;
  updateAccountsGroup: (oldGroupId: string, newGroupId?: string) => void; // 新增：批量更新账户分组
  isLoaded: boolean;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoaded: false,

  loadAccounts: () => {
    if (get().isLoaded) {
      return;
    }
    const accounts = localStorage.getItem('accounts');

    if (accounts) {
      try {
        let parsedAccounts: Account[] = JSON.parse(accounts);

        // 数据迁移：为旧数据添加默认分组
        const hasMigration = localStorage.getItem('accountGroupMigration');
        if (!hasMigration) {
          parsedAccounts = parsedAccounts.map(acc => ({
            ...acc,
            group: acc.group || undefined, // 保持现有分组，如果没有则为undefined
          }));
          localStorage.setItem('accountGroupMigration', 'true');
        }

        set({ accounts: parsedAccounts });
      } catch (e) {
        console.error('Failed to parse accounts:', e);
      }
    }
    set({ isLoaded: true });
  },

  saveAccounts: () => {
    const { accounts } = get();
    localStorage.setItem('accounts', JSON.stringify(accounts));
  },

  addAccount: (account) => {
    const { accounts } = get();
    set({ accounts: [...accounts, account] });
    get().saveAccounts();
  },

  updateAccount: (index, account) => {
    const { accounts } = get();
    const newAccounts = [...accounts];
    newAccounts[index] = account;
    set({ accounts: newAccounts });
    get().saveAccounts();
  },

  deleteAccount: (index) => {
    const { accounts } = get();
    set({ accounts: accounts.filter((_, i) => i !== index) });
    get().saveAccounts();
  },

  updateAccountsGroup: (oldGroupId, newGroupId) => {
    const { accounts } = get();
    const newAccounts = accounts.map(acc => {
      if (acc.group === oldGroupId) {
        return {
          ...acc,
          group: newGroupId, // 如果newGroupId为undefined，则移除分组
        };
      }
      return acc;
    });
    set({ accounts: newAccounts });
    get().saveAccounts();
  },
}));
