'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { truncate } from '@/lib/utils';

interface ScatterPlotViewProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string | undefined;
}

const AXIOM_COLORS = ['#6C63FF', '#00D4FF', '#39FF14', '#FFB627', '#FF4757'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length >= 2) {
    return (
      <div className="glass-card p-3 border border-white/10 shadow-xl">
        <p className="text-xs font-bold text-slate-200 mb-1">{payload[0].name}</p>
        <p className="text-sm font-medium text-[var(--accent-cyan)]">
          X: {Number(payload[0].value).toLocaleString()}
        </p>
        <p className="text-sm font-medium text-[var(--accent-cyan)]">
          Y: {Number(payload[1].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const ScatterPlotView: React.FC<ScatterPlotViewProps> = ({ data, xKey, yKey, color }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickFormatter={(value) => truncate(String(value), 15)}
          dy={10}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Scatter
          name={`${xKey} vs ${yKey}`}
          data={data}
          fill={color || AXIOM_COLORS[0]}
          fillOpacity={0.6}
          animationDuration={1000}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default ScatterPlotView;