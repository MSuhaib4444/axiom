'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Customized,
} from 'recharts';
import { truncate, formatNumber } from '@/lib/utils';

interface WaterfallViewProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
}

interface WaterfallDatum {
  name: string;
  value: number;
  start: number;
  end: number;
  type: 'positive' | 'negative' | 'total';
  displayValue: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WaterfallDatum }>;
}

const COLOR_POSITIVE = '#6C63FF';
const COLOR_NEGATIVE = '#FF4757';
const COLOR_TOTAL = '#00D4FF';

function buildWaterfallData(
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string
): WaterfallDatum[] {
  let cumulative = 0;

  return data.map((row, index) => {
    const name = String(row[xKey] ?? `Step ${index + 1}`);
    const raw = row[yKey];
    const value = typeof raw === 'number' ? raw : Number(raw);
    const safeValue = Number.isFinite(value) ? value : 0;

    const isTotal =
      name.toLowerCase().includes('total') ||
      name.toLowerCase().includes('sum') ||
      index === data.length - 1;

    let type: WaterfallDatum['type'];
    if (isTotal) {
      type = 'total';
    } else if (safeValue >= 0) {
      type = 'positive';
    } else {
      type = 'negative';
    }

    const start = type === 'total' ? 0 : cumulative;
    const end = type === 'total' ? cumulative + safeValue : cumulative + safeValue;

    if (type !== 'total') {
      cumulative += safeValue;
    } else {
      cumulative = safeValue;
    }

    return {
      name,
      value: safeValue,
      start,
      end,
      type,
      displayValue: Math.abs(safeValue),
    };
  });
}

interface ConnectorLinesProps {
  formattedGraphicalItems?: Array<{
    props?: {
      data?: Array<{
        payload?: WaterfallDatum & { invisible: number; visible: number };
        x?: number;
        width?: number;
      }>;
    };
  }>;
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
}

const WaterfallConnectors: React.FC<ConnectorLinesProps> = ({
  formattedGraphicalItems,
  yAxisMap,
}) => {
  const yAxis = yAxisMap ? Object.values(yAxisMap)[0] : undefined;
  const barData = formattedGraphicalItems?.[1]?.props?.data;
  if (!yAxis || !barData || barData.length < 2) return null;

  const lines: React.ReactNode[] = [];
  for (let i = 0; i < barData.length - 1; i++) {
    const current = barData[i];
    const next = barData[i + 1];
    if (!current?.payload || !next?.x || current.x === undefined || current.width === undefined) continue;

    const connectorY = current.payload.end;
    const x1 = current.x + current.width;
    const x2 = next.x;
    const y = yAxis.scale(connectorY);

    lines.push(
      <line
        key={`connector-${i}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
    );
  }

  return <g className="waterfall-connectors">{lines}</g>;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="glass-card p-3 border border-white/10 shadow-xl">
      <p className="text-xs font-bold text-slate-200 mb-1">{item.name}</p>
      <p className="text-sm font-medium text-[var(--accent-cyan)]">
        {formatNumber(item.value)}
      </p>
      <p className="text-[10px] text-slate-500 mt-1">
        Running: {formatNumber(item.end)}
      </p>
    </div>
  );
};

const WaterfallView: React.FC<WaterfallViewProps> = ({ data, xKey, yKey }) => {
  const waterfallData = useMemo(
    () => buildWaterfallData(data, xKey, yKey),
    [data, xKey, yKey]
  );

  const chartData = useMemo(() => {
    return waterfallData.map((d) => ({
      ...d,
      invisible: d.type === 'total' ? 0 : Math.min(d.start, d.end),
      visible: d.displayValue,
    }));
  }, [waterfallData]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
        No data available for waterfall chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          tickFormatter={(value) => truncate(String(value), 12)}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          tickFormatter={(value) => formatNumber(Number(value))}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />

        <Bar dataKey="invisible" stackId="waterfall" fill="transparent" isAnimationActive={false} />
        <Bar
          dataKey="visible"
          stackId="waterfall"
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.type === 'total'
                  ? COLOR_TOTAL
                  : entry.type === 'positive'
                    ? COLOR_POSITIVE
                    : COLOR_NEGATIVE
              }
            />
          ))}
        </Bar>

        <Customized component={WaterfallConnectors} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WaterfallView;
