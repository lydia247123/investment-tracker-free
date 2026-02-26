import { useState } from 'react';
import { PreciousMetalRecord, PreciousMetalType } from '@types/preciousMetal';
import { formatMonth, formatCurrency } from '@utils/formatters';
import { usePreciousMetalStore } from '@store/preciousMetalStore';
import { useAccountStore } from '@store/accountStore';
import { EditMetalRecordDialog } from './EditMetalRecordDialog';

interface MetalRecordsTableProps {
  selectedTypes: PreciousMetalType[];
  records: PreciousMetalRecord[];
}

export const MetalRecordsTable: React.FC<MetalRecordsTableProps> = ({
  selectedTypes,
  records
}) => {
  const { deleteRecord, updateRecord } = usePreciousMetalStore();
  const { accounts } = useAccountStore();
  const [editingRecord, setEditingRecord] = useState<PreciousMetalRecord | null>(null);

  const handleEdit = (record: PreciousMetalRecord) => {
    setEditingRecord(record);
  };

  const handleUpdate = (metalType: PreciousMetalType, recordId: string, updatedRecord: PreciousMetalRecord) => {
    updateRecord(metalType, recordId, updatedRecord);
    setEditingRecord(null);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-12">
          <div className="text-6xl mb-4"></div>
          <p className="text-gray-500">
            {selectedTypes.length === 0 ? 'No precious metal records' : `No ${selectedTypes.join(' / ')} records`}
          </p>
          <p className="text-sm text-gray-400 mt-2">Add your first record to start tracking precious metals</p>
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
          {selectedTypes.length === 0 ? 'All Precious Metal' : selectedTypes.join(' / ')} Records
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
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grams
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price per Gram
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Avg Price
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
            {sortedRecords.map((record) => {
              const totalAmount = record.grams * record.pricePerGram;

              return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                      {record.metalType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMonth(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {(() => {
                      const account = accounts.find(acc => acc.name === record.account);
                      return account ? account.name : record.account;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {record.grams.toFixed(2)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="text-amber-600 font-medium">
                      {formatCurrency(record.pricePerGram)}/g
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(record.averagePrice)}/g
                    </span>
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
                          if (confirm(`Are you sure you want to delete this record?\n${formatMonth(record.date)} - ${record.metalType} ${record.grams}g`)) {
                            deleteRecord(record.metalType, record.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Grams:</span>
            <span className="font-bold text-gray-900">
              {records.reduce((sum, r) => sum + r.grams, 0).toFixed(2)}g
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(records.reduce((sum, r) => sum + (r.grams * r.pricePerGram), 0))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Records:</span>
            <span className="font-bold text-gray-900">{records.length} records</span>
          </div>
        </div>
      </div>

      {/* Edit record modal */}
      {editingRecord && (
        <EditMetalRecordDialog
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
