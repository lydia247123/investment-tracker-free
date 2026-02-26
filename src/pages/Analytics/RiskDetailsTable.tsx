import { RiskAnalysisData } from '@types/risk';
import { getRiskLevelConfig } from '@utils/constants/riskLevels';
import { formatCurrency } from '@utils/formatters';

interface RiskDetailsTableProps {
  data: RiskAnalysisData[];
}

export const RiskDetailsTable: React.FC<RiskDetailsTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Level Details</h3>
        <div className="text-center py-12 text-gray-500">
          No asset data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Level Details</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Risk Level
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">
                Asset Amount
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Asset Types
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">
                Asset Count
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                Volatility
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const config = getRiskLevelConfig(item.riskLevel);
              return (
                <tr key={item.riskLevel} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
                      {config.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.totalAssets)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`font-medium ${
                      item.percentage >= 30 ? 'text-red-600' :
                      item.percentage >= 15 ? 'text-orange-600' :
                      item.percentage >= 5 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {item.percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {item.assetTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {item.assetCount} items
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {config.volatility}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
