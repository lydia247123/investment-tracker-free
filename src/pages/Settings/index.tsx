import { AccountManagement } from './AccountManagement';

export const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Account Management */}
      <div data-tutorial="account-management">
        <AccountManagement />
      </div>
    </div>
  );
};

