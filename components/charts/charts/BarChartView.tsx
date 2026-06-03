'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { truncate } from '@/lib/utils';

interface BarChartViewProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string | undefined;
}

const AXIOM_COLORS = ['#6C63FF', '#00D4FF', '#39FF14', '#FFB627', '#FF4757'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-white/10 shadow-xl">
        <p className="text-xs font-bold text-slate-200 mb-1">{label}</p>
        <p className="text-sm font-medium text-[var(--accent-cyan)]">
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const BarChartView: React.FC<BarChartViewProps> = ({ data, xKey, yKey, color }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickFormatter={(value) => truncate(String(value), 15)}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Bar
          dataKey={yKey}
          fill={color || AXIOM_COLORS[0]}
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartView;