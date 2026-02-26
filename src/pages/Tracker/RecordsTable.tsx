import { useState } from 'react';
import { InvestmentRecord } from '@types/investment';
import { formatMonth, formatCurrency } from '@utils/formatters';
import { useInvestmentStore } from '@store/investmentStore';
import { useAccountStore } from '@store/accountStore';
import { EditRecordDialog } from './EditRecordDialog';
import { isTimeDepositMatured, calculateTimeDepositTotalProfit } from '@utils/timeDepositCalculations';
import { InfoTooltip } from '@components/ui/InfoTooltip';

interface RecordsTableProps {
  selectedTypes: string[];
  records: InvestmentRecord[];
}

export const RecordsTable: React.FC<RecordsTableProps> = ({ selectedTypes, records }) => {
  const { deleteRecord, updateRecord } = useInvestmentStore();
  const { accounts } = useAccountStore();
  const [editingRecord, setEditingRecord] = useState<InvestmentRecord | null>(null);

  const handleEdit = (record: InvestmentRecord) => {
    setEditingRecord(record);
  };

  const handleUpdate = (assetType: string, recordId: string, updatedRecord: InvestmentRecord) => {
    updateRecord(assetType, recordId, updatedRecord);
    setEditingRecord(null);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-12">
          <div className="text-6xl mb-4"></div>
          <p className="text-gray-500">
            {selectedTypes.length === 0 ? 'No investment records' : `No ${selectedTypes.join(' / ')} records`}
          </p>
          <p className="text-sm text-gray-400 mt-2">Add your first record to start tracking investments</p>
        </div>
      </div>
    );
  }

  // 按日期降序排序
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {selectedTypes.length === 0 ? 'All Investment' : selectedTypes.join(' / ')} Records
          <span className="ml-2 text-sm font-normal text-gray-500">({records.length} records)</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Investment Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Snapshot Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deposit Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                    {record.assetType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    record.currency === 'USD'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {record.currency === 'USD' ? 'USD' : 'CNY'}
                  </span>
                  {record.currency === 'USD' && record.amountUSD && (
                    <div className="text-xs text-gray-500 mt-1">
                      ${record.amountUSD.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatMonth(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-semibold ${record.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(record.amount)}
                    </span>
                    {record.currency === 'USD' && record.exchangeRate && (
                      <span className="text-xs text-gray-500">
                        Exchange Rate: {record.exchangeRate.toFixed(4)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {record.snapshot !== undefined ? (
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(record.snapshot)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {record.isTimeDeposit ? (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Term: {record.depositTermMonths} months · Rate: {record.annualInterestRate}%
                      </div>
                      {record.maturityDate && (
                        <div className="text-xs">
                          Maturity: {record.maturityDate}
                          {(() => {
                            const currentMonth = new Date().toISOString().slice(0, 7);
                            const isMatured = isTimeDepositMatured(record.date, record.depositTermMonths!, currentMonth);
                            return (
                              <span className={`ml-2 ${isMatured ? 'text-red-600' : 'text-green-600'}`}>
                                {isMatured ? 'Matured' : 'In Progress'}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {record.account}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {record.note || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete this record?\n${formatMonth(record.date)} - ${formatCurrency(record.amount)}`)) {
                          // Use record ID instead of index
                          deleteRecord(record.assetType, record.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Investment:</span>
          <span className="font-bold text-gray-900">
            {formatCurrency(records.reduce((sum, r) => sum + r.amount, 0))}
          </span>
        </div>
      </div>

      {/* Edit record modal */}
      {editingRecord && (
        <EditRecordDialog
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
