import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface PieChartProps {
  data: { label: string; value: number }[];
  height?: number;
  title?: string;
}

const COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b',
  '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 400,
  title,
}) => {
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
  }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

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
            label={({ name, percent, x, y, payload }) => (
              <text x={x} y={y} fill={COLORS[payload.index % COLORS.length]} fontSize="12" textAnchor="middle" dominantBaseline="middle">
                <tspan x={x} dy="-0.6em">{name}</tspan>
                <tspan x={x} dy="1.2em">{(percent * 100).toFixed(1)}%</tspan>
              </text>
            )}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
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
        <span className="text-gray-600">Total:</span>
        <span className="text-xl font-bold text-gray-900 ml-2">${totalValue.toFixed(2)}</span>
      </div>
    </div>
  );
};
