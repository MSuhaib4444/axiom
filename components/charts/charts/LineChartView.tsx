'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { truncate } from '@/lib/utils';

interface LineChartViewProps {
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

const LineChartView: React.FC<LineChartViewProps> = ({ data, xKey, yKey, color }) => {
  const isLargeDataset = data.length > 100;
  const primaryColor = color || AXIOM_COLORS[0];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={primaryColor!}
          strokeWidth={2}
          dot={!isLargeDataset}
          activeDot={{ r: 6, strokeWidth: 0 }}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartView;