import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

/**
 * 图表系列配置接口（用于多线条图表）
 */
export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface LineChartProps {
  data: { label: string; value: number }[] | { [key: string]: any }[];
  height?: number;
  title?: string | React.ReactNode;
  yLabel?: string;
  xLabel?: string;
  color?: string;
  series?: ChartSeries[];  // 多系列配置（可选）
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number | undefined, name?: string) => string | string[];
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 400,
  title,
  yLabel = 'Amount ($)',
  xLabel = 'Month',
  color = '#667eea',
  series,
  yAxisFormatter,
  tooltipFormatter,
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
  const defaultSeries = [{ dataKey: 'value', name: 'Value', color }];
  const seriesToRender = isMultiSeries ? series : defaultSeries;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={{ stroke: '#374151' }}
            tickFormatter={yAxisFormatter || ((value) => `$${value.toFixed(0)}`)}
          />
          <Tooltip
            formatter={
              tooltipFormatter ||
              ((value: number | undefined, name?: string) => [
                `$${(value || 0).toFixed(2)}`,
                isMultiSeries ? name : 'Amount'
              ])
            }
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
          />
          {isMultiSeries && <Legend />}
          {seriesToRender.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ fill: s.color, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={true}  // 连接数据中的空缺
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
