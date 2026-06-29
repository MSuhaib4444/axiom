'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AXIOM_COLORS } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';
import { formatChartLabel } from '@/lib/formatters';

interface RadarChartViewProps {
  data: Array<Record<string, number>>;
  keys: string[];
  seriesNames?: string[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="glass-card p-3 border border-white/10 shadow-xl">
      <p className="text-xs font-bold text-slate-200 mb-2">{formatChartLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-slate-400">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

const RadarChartView: React.FC<RadarChartViewProps> = ({ data, keys, seriesNames: names }) => {
  if (data.length === 0 || keys.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
        Select at least 2 numeric columns for radar chart.
      </div>
    );
  }

  const seriesNames = names ?? data.map((_, i) => `Series ${i + 1}`);

  const chartData = keys.map((key) => {
    const point: Record<string, string | number> = { axis: key };
    data.forEach((series, i) => {
      const seriesName = seriesNames[i] ?? `Series ${i + 1}`;
      point[seriesName] = series[key] ?? 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={({ x, y, payload }) => (
            <text
              x={x}
              y={y}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize={11}
              dy={4}
            >
              {payload?.value ? String(payload.value) : ''}
            </text>
          )}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 'auto']}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {seriesNames.length > 1 && (
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
          />
        )}
        {seriesNames.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={AXIOM_COLORS[i % AXIOM_COLORS.length]}
            fill={AXIOM_COLORS[i % AXIOM_COLORS.length]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChartView;
