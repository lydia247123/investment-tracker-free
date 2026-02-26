import { useState } from 'react';
import { useAccountStore } from '@store/accountStore';
import { useUIStore } from '@store/uiStore';
import type { Account } from '../types/account';

export const AccountManagement = () => {
  const { accounts, addAccount, deleteAccount, updateAccount } = useAccountStore();
  const { tutorialCompleted } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  // Edit account state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState('');

  const handleAddAccount = () => {
    if (!newAccountName.trim()) {
      alert('Please enter account name');
      return;
    }

    if (accounts.some(acc => acc.name === newAccountName.trim())) {
      alert('Account name already exists');
      return;
    }

    addAccount({
      name: newAccountName.trim(),
      icon: '',
    });

    setNewAccountName('');
    setShowModal(false);
  };

  const handleDeleteAccount = (accountName: string) => {
    if (accounts.length <= 1) {
      alert('At least one account is required');
      return;
    }

    if (confirm(`Are you sure you want to delete account "${accountName}"?`)) {
      const index = accounts.findIndex(acc => acc.name === accountName);
      deleteAccount(index);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setEditAccountName(account.name);
    setShowEditModal(true);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount || !editAccountName.trim()) {
      alert('Please enter account name');
      return;
    }

    // Check name conflict (exclude self)
    const nameConflict = accounts.some(
      acc => acc.name === editAccountName.trim() && acc.name !== editingAccount.name
    );
    if (nameConflict) {
      alert('Account name already exists');
      return;
    }

    const index = accounts.findIndex(acc => acc.name === editingAccount.name);
    if (index !== -1) {
      updateAccount(index, {
        name: editAccountName.trim(),
        icon: '',
      });
    }

    // Reset state
    setShowEditModal(false);
    setEditingAccount(null);
    setEditAccountName('');
  };

  return (
    <div className="space-y-6">
      {/* Tutorial replay section */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tutorial</h2>
        <p className="text-gray-600 mb-4">
          {tutorialCompleted
            ? 'You have completed the onboarding tutorial.'
            : 'You haven\'t completed the onboarding tutorial yet.'}
        </p>
        <button
          onClick={() => useUIStore.getState().resetTutorial()}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          {tutorialCompleted ? 'Replay Tutorial' : 'Start Tutorial'}
        </button>
      </div>

      {/* Account Management */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Account Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-medium text-gray-900">{account.name}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditAccount(account)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.name)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
        ))}
      </div>

      {/* Add account modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Account</h3>

            <div className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Alipay"
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddAccount}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewAccountName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit account modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Account</h3>

            <div className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateAccount}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccount(null);
                    setEditAccountName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
