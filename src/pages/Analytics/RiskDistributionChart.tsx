import { RiskAnalysisData } from '@types/risk';
import { getRiskLevelConfig } from '@utils/constants/riskLevels';
import { formatCurrency } from '@utils/formatters';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RiskDistributionChartProps {
  data: RiskAnalysisData[];
  height?: number;
  title?: string;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  data,
  height = 400,
  title,
}) => {
  const chartData = data.map(item => {
    const config = getRiskLevelConfig(item.riskLevel);
    return {
      name: config.name,
      value: item.totalAssets,
      color: config.color,
      percentage: item.percentage,
    };
  });

  const totalAssets = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => {
              const { name, percentage, x, y, payload } = props;
              // 向外偏移 20 像素，避免被饼图遮挡
              const cx = 200; // 容器中心 X
              const cy = 200; // 容器中心 Y

              // 计算从中心到标签的方向
              const angle = Math.atan2(y - cy, x - cx);

              // 偏移距离
              const offset = 20;

              // 计算新位置
              const newX = x + Math.cos(angle) * offset;
              const newY = y + Math.sin(angle) * offset;

              return (
                <text
                  x={newX}
                  y={newY}
                  fill={payload.color}
                  fontSize="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <tspan x={newX} dy="-0.6em">{name}</tspan>
                  <tspan x={newX} dy="1.2em">{percentage.toFixed(1)}%</tspan>
                </text>
              );
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Asset Amount']}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Total amount display */}
      <div className="text-center mt-4">
        <span className="text-gray-600">Total Assets:</span>
        <span className="text-xl font-bold text-gray-900 ml-2">
          {formatCurrency(totalAssets)}
        </span>
      </div>
    </div>
  );
};
