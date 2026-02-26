import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useMemo } from 'react';

/**
 * 图表系列配置接口（用于多系列图表）
 */
export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface BarChartProps {
  data: { label: string; value: number }[] | { [key: string]: any }[];
  height?: number;
  title?: string | React.ReactNode;
  yLabel?: string;
  xLabel?: string;
  series?: ChartSeries[];  // 新增：多系列配置
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 400,
  title,
  yLabel = 'Amount ($)',
  xLabel = 'Month',
  series
}) => {
  // Data format conversion: backward compatible with old format { label, value }
  const chartData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0 && 'label' in data[0]) {
      // Old format: { label, value }
      return (data as { label: string; value: number }[]).map(item => ({
        name: item.label,
        value: item.value,
      }));
    }
    // New format: already in correct structure
    return data as { [key: string]: any }[];
  }, [data]);

  // Determine if multi-series mode
  const isMultiSeries = series && series.length > 0;
  const defaultSeries = [{ dataKey: 'value', name: 'Value', color: '#10b981' }];
  const seriesToRender = isMultiSeries ? series : defaultSeries;

  // 计算Y轴范围（收集所有系列的值）
  const domain = useMemo(() => {
    const allValues: number[] = [];

    if (isMultiSeries) {
      // 多系列：收集所有系列的所有值
      chartData.forEach(dataPoint => {
        series.forEach(s => {
          const value = dataPoint[s.dataKey];
          if (typeof value === 'number') {
            allValues.push(value);
          }
        });
      });
    } else {
      // 单系列：只收集 value 字段
      chartData.forEach(d => {
        if (typeof d.value === 'number') {
          allValues.push(d.value);
        }
      });
    }

    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);
    const minDomainSize = 100;
    const hasNegativeValues = minValue < 0;

    if (hasNegativeValues) {
      const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 1.2;
      const finalMaxAbs = Math.max(maxAbsValue, minDomainSize);
      return [-finalMaxAbs, finalMaxAbs];
    } else {
      if (maxValue === 0) {
        return [0, minDomainSize];
      } else if (maxValue < minDomainSize) {
        return [0, minDomainSize];
      } else {
        return [0, maxValue * 1.2];
      }
    }
  }, [chartData, isMultiSeries, series]);

  // 单系列模式的颜色函数
  const getBarColor = (value: number) => {
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis
            domain={domain}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={{ stroke: '#374151' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number, name?: string) => [
              `$${value.toFixed(2)}`,
              isMultiSeries ? name : 'Amount'
            ]}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
          {isMultiSeries && <Legend />}
          {isMultiSeries ? (
            // 多系列模式：每个账户使用固定颜色
            seriesToRender.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            // 单系列模式：根据正负值显示颜色
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
