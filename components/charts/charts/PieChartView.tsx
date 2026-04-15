'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PieChartViewProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  innerRadius?: number;
  color?: string | undefined;
}

const AXIOM_COLORS = ['#6C63FF', '#00D4FF', '#39FF14', '#FFB627', '#FF4757', '#FF00FF', '#00FFFF'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 border border-white/10 shadow-xl">
        <p className="text-xs font-bold text-slate-200 mb-1">{data.label || data.name}</p>
        <p className="text-sm font-medium text-[var(--accent-cyan)]">
          {payload[0].value.toLocaleString()} ({data.percent?.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const PieChartView: React.FC<PieChartViewProps> = ({ 
  data, 
  xKey, 
  yKey, 
  innerRadius = 0,
  color
}) => {
  // Transform data for PieChart if needed
  const chartData = data.map(item => ({
    name: String(item[xKey]),
    value: Number(item[yKey]),
    ...item
  })).filter(item => !isNaN(item.value) && item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // If a color is provided, use it as the base for the palette
  const palette = color ? [color, ...AXIOM_COLORS.filter(c => c !== color)] : AXIOM_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={({ percent, name }) => (percent && percent > 0.05) ? `${(percent * 100).toFixed(0)}%` : ''}
          innerRadius={innerRadius}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          animationDuration={1000}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={palette[index % palette.length] ?? '#6C63FF'} stroke="rgba(255,255,255,0.1)" />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartView;
