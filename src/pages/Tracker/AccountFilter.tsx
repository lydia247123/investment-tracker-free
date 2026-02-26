import { Account } from '@types/account';

interface AccountFilterProps {
  selectedAccounts: string[];
  onSelectAccounts: (accounts: string[]) => void;
  accounts: Account[];
}

export const AccountFilter: React.FC<AccountFilterProps> = ({
  selectedAccounts,
  onSelectAccounts,
  accounts,
}) => {
  // 处理账户点击
  const handleAccountClick = (accountName: string) => {
    if (selectedAccounts.includes(accountName)) {
      onSelectAccounts(selectedAccounts.filter(a => a !== accountName));
    } else {
      onSelectAccounts([...selectedAccounts, accountName]);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* All accounts */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-gray-800">All Accounts</span>
            <span className="text-sm text-gray-500">({accounts.length})</span>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {accounts.map((account) => {
            const isSelected = selectedAccounts.includes(account.name);
            return (
              <button
                key={account.name}
                onClick={() => handleAccountClick(account.name)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all border-2 text-left
                  ${isSelected
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }
                `}
              >
                {account.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-sm text-gray-600">
          Selected {selectedAccounts.length} / {accounts.length} accounts
        </span>
        <div className="space-x-2">
          <button
            onClick={() => onSelectAccounts([])}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Selection
          </button>
          <button
            onClick={() => onSelectAccounts(accounts.map(a => a.name))}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>
    </div>
  );
};
