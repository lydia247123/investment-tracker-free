import React, { useMemo } from 'react';
import { RecordsByMetalType } from '@types/preciousMetal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PRECIOUS_METAL_TYPES, METAL_COLORS } from '@utils/constants';
import { calculateMonthlyMetalValues } from '@utils/metalCalculations';
import { filterRecordsByDateRange } from '@utils/dataFilters';
import { BaseDashboardData } from '@services/DashboardDataManager';

// 中英文贵金属类型映射
const METAL_TYPE_MAP: Record<string, string> = {
  'Gold': '黄金',
  'Silver': '白银',
  'Platinum': '铂金',
  'Palladium': '钯金'
};

const REVERSE_METAL_TYPE_MAP: Record<string, string> = {
  '黄金': 'Gold',
  '白银': 'Silver',
  '铂金': 'Platinum',
  '钯金': 'Palladium'
};

interface MetalAssetsChartProps {
  filterType?: 'all' | 'investment' | 'metal';
  recordsByType: any; // 未使用，但为了保持接口一致
  recordsByMetalType: RecordsByMetalType;
  baseData?: BaseDashboardData; // 可选的共享基础数据
}

const MetalAssetsChart = React.memo(({
  filterType = 'all',
  recordsByMetalType,
  baseData
}: MetalAssetsChartProps) => {
  // 免费版始终显示全部数据，dateRange 始终为 null
  const dateRange = useMemo(() => ({
    startMonth: null as string | null,
    endMonth: null as string | null
  }), []);

  // 获取有数据的贵金属类型
  // 注意：recordsByMetalType 的键是中文（黄金、白银、铂金、钯金）
  const activeTypes = useMemo(() => {
    if (!recordsByMetalType || typeof recordsByMetalType !== 'object') return [];

    // 获取 recordsByMetalType 中所有有数据的键（中文）
    const typesWithData = Object.keys(recordsByMetalType).filter(
      key => {
        const records = recordsByMetalType[key];
        return records && Array.isArray(records) && records.length > 0;
      }
    );

    // 直接使用中文键（用于显示和颜色映射）
    return typesWithData;
  }, [recordsByMetalType]);

  // 计算资产视图数据
  const assetsChartData = useMemo(() => {
    try {
      if (!recordsByMetalType || typeof recordsByMetalType !== 'object') return [];

      // ========== 性能优化：优先使用共享数据 ==========
      if (baseData) {
        if (filterType === 'investment') return [];

        if (!baseData.allMetalRecords || !Array.isArray(baseData.allMetalRecords) || baseData.allMetalRecords.length === 0) return [];

        const allMonths = (baseData.allMonths || [])
          .filter(month => {
            if (!month) return false;
            if (dateRange?.startMonth && month < dateRange.startMonth) return false;
            if (dateRange?.endMonth && month > dateRange.endMonth) return false;
            return true;
          })
          .sort();

        return allMonths.map(month => {
          const monthlyValues = (baseData.monthlyMetalValues && typeof baseData.monthlyMetalValues.get === 'function' && baseData.monthlyMetalValues.get(month)) || {};
          return {
            month,
            ...monthlyValues
          };
        });
      }

      // ========== 回退：原始计算逻辑 ==========
      if (filterType === 'investment') return [];

      const allMetalRecords = Object.values(recordsByMetalType).flat().filter(Boolean);
      const allRecords = filterRecordsByDateRange(
        allMetalRecords,
        dateRange || { startMonth: null, endMonth: null }
      );

      if (!allRecords || !Array.isArray(allRecords) || allRecords.length === 0) return [];

      const allMonths = [...new Set(allRecords.map(r => r?.date).filter(Boolean))]
        .filter(month => {
          if (dateRange?.startMonth && month < dateRange.startMonth) return false;
          if (dateRange?.endMonth && month > dateRange.endMonth) return false;
          return true;
        })
        .sort();

      return allMonths.map(month => {
        const monthlyValues = calculateMonthlyMetalValues(recordsByMetalType, month);
        return {
          month,
          ...monthlyValues
        };
      });
    } catch (e) {
      console.error('Error in assetsChartData:', e);
      return [];
    }
  }, [baseData, recordsByMetalType, filterType]);

  // 如果没有数据或不是贵金属模式，返回空
  if (assetsChartData.length === 0) {
    if (filterType !== 'metal') {
      return null;
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Metal Current Value
          </h3>
        </div>
        <div className="text-center py-12 text-gray-500">
          No precious metal data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Metal Current Value
        </h3>
      </div>

      {/* Chart area */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={assetsChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, '']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
          />
          {activeTypes.map(type => {
            // Use Chinese types as data keys directly (to match data structure)
            return (
              <Area
                key={type}
                type="monotone"
                dataKey={type}
                name={type}
                stackId="1"
                stroke={METAL_COLORS[type]}
                fill={METAL_COLORS[type]}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

MetalAssetsChart.displayName = 'MetalAssetsChart';
export default MetalAssetsChart;
