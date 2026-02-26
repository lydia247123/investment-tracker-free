// Recharts Mock - 简化图表组件测试
import React from 'react';

const createMockComponent = (displayName: string) => {
  const MockComponent = ({ children }: { children?: React.ReactNode }) => {
    return React.createElement('div', { 'data-testid': `${displayName.toLowerCase()}` }, children);
  };
  MockComponent.displayName = displayName;
  return MockComponent;
};

export const ResponsiveContainer = createMockComponent('ResponsiveContainer');
export const LineChart = createMockComponent('LineChart');
export const BarChart = createMockComponent('BarChart');
export const AreaChart = createMockComponent('AreaChart');
export const PieChart = createMockComponent('PieChart');
export const Line = createMockComponent('Line');
export const Bar = createMockComponent('Bar');
export const Area = createMockComponent('Area');
export const Pie = createMockComponent('Pie');
export const Cell = createMockComponent('Cell');
export const XAxis = createMockComponent('XAxis');
export const YAxis = createMockComponent('YAxis');
export const ZAxis = createMockComponent('ZAxis');
export const CartesianGrid = createMockComponent('CartesianGrid');
export const Tooltip = createMockComponent('Tooltip');
export const Legend = createMockComponent('Legend');
export const ReferenceLine = createMockComponent('ReferenceLine');
export const Brush = createMockComponent('Brush');
