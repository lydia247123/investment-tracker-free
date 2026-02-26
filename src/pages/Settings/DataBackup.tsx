import React, { useState, useEffect } from 'react';
import { exportAllData, exportInvestmentData, exportMetalData } from '@utils/dataBackup';

export const DataBackup = () => {
  const [lastBackupDate, setLastBackupDate] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    // Read last backup date from localStorage
    const saved = localStorage.getItem('lastBackupDate');
    if (saved) {
      setLastBackupDate(new Date(saved).toLocaleString('en-US'));
    }
  }, []);

  const handleBackupAll = async () => {
    setIsBackingUp(true);
    try {
      const success = exportAllData();
      if (success) {
        const now = new Date().toISOString();
        localStorage.setItem('lastBackupDate', now);
        setLastBackupDate(new Date(now).toLocaleString('en-US'));
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleBackupInvestment = () => {
    exportInvestmentData();
  };

  const handleBackupMetal = () => {
    exportMetalData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Data Backup</h2>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        {/* Last backup time */}
        <div className="mb-6">
          <p className="text-gray-700">
            Last backup:
            {lastBackupDate ? (
              <span className="font-medium text-gray-900">{lastBackupDate}</span>
            ) : (
              <span className="text-orange-500 font-medium">Never backed up</span>
            )}
          </p>
        </div>

        {/* Backup buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleBackupAll}
            disabled={isBackingUp}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBackingUp ? (
              <span>Backing up...</span>
            ) : (
              <span>Backup All Data (JSON)</span>
            )}
          </button>

          <button
            onClick={handleBackupInvestment}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            Backup Investment Data (CSV)
          </button>

          <button
            onClick={handleBackupMetal}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            Backup Metal Data (CSV)
          </button>
        </div>

        {/* Tip message */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>Tip</strong>:
            Backup files will be downloaded to your Downloads folder.
            It is recommended to backup data regularly to prevent loss and keep backup files in a safe place.
          </p>
        </div>

        {/* Backup description */}
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-gray-900">Backup Description</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              <span>
                <strong className="text-gray-900">Backup All Data (JSON)</strong>:
                Contains all data including investment records, precious metal records, accounts, groups, etc., suitable for complete backup and restore.
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              <span>
                <strong className="text-gray-900">Backup Investment Data (CSV)</strong>:
                Contains only investment records, can be viewed and edited in Excel.
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              <span>
                <strong className="text-gray-900">Backup Metal Data (CSV)</strong>:
                Contains only precious metal records, can be viewed and edited in Excel.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
