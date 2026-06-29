'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  ComposedChart,
  Scatter,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, Play, AlertTriangle } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { linearRegression, polynomialRegression, forecast } from '@/lib/regression';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassInput } from '@/components/ui/GlassInput';
import { AXIOM_COLORS, getChartColor } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';
import type { RegressionResult } from '@/types/analysis';
import type { CellValue } from '@/types/data';

type RegressionMode = 'linear' | 'poly2' | 'poly3';

const MODE_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'poly2', label: 'Polynomial (degree 2)' },
  { value: 'poly3', label: 'Polynomial (degree 3)' },
];

function toNumber(val: CellValue): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function buildRegressionLine(
  result: RegressionResult,
  xMin: number,
  xMax: number,
  points = 100
): Array<{ x: number; y: number }> {
  const step = (xMax - xMin) / (points - 1);
  return Array.from({ length: points }, (_, i) => {
    const x = xMin + step * i;
    const y = forecast(result, [x])[0] ?? 0;
    return { x, y, _line: true };
  });
}

export const RegressionView: React.FC = () => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();

  const numericColumns = useMemo(() => {
    if (!sheet) return [];
    return sheet.columns.filter((c) => c.type === 'number');
  }, [sheet]);

  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [mode, setMode] = useState<RegressionMode>('linear');
  const [runToken, setRunToken] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [forecastInput, setForecastInput] = useState('');

  const columnOptions = useMemo(
    () => numericColumns.map((c) => ({ value: c.key, label: c.name })),
    [numericColumns]
  );

  const effectiveX = xCol || numericColumns[0]?.key || '';
  const effectiveY = yCol || numericColumns[1]?.key || effectiveX;

  const pairs = useMemo(() => {
    if (!sheet || !effectiveX || !effectiveY) return [];
    return sheet.rows
      .map((row) => {
        const x = toNumber(row[effectiveX] ?? null);
        const y = toNumber(row[effectiveY] ?? null);
        if (x === null || y === null) return null;
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);
  }, [sheet, effectiveX, effectiveY]);

  const result = useMemo((): RegressionResult | null => {
    if (runToken === 0 || pairs.length < 2) return null;

    const xs = pairs.map((p) => p.x);
    const ys = pairs.map((p) => p.y);

    if (mode === 'linear') return linearRegression(xs, ys);
    if (mode === 'poly2') return polynomialRegression(xs, ys, 2);
    return polynomialRegression(xs, ys, 3);
  }, [runToken, pairs, mode]);

  const chartData = useMemo(() => {
    if (!result) return { scatter: [], line: [], residuals: [] };

    const scatter = pairs.map((p, i) => ({
      x: p.x,
      y: p.y,
      predicted: result.predictions[i] ?? 0,
    }));

    const xMin = Math.min(...pairs.map((p) => p.x));
    const xMax = Math.max(...pairs.map((p) => p.x));
    const line = buildRegressionLine(result, xMin, xMax);

    const residuals = result.residuals.map((r, i) => ({
      index: i + 1,
      residual: r,
      x: pairs[i]?.x ?? i,
    }));

    return { scatter, line, residuals };
  }, [result, pairs]);

  const forecastValues = useMemo(() => {
    if (!result || !forecastInput.trim()) return null;
    const xs = forecastInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (xs.length === 0) return null;
    const ys = forecast(result, xs);
    return xs.map((x, i) => ({ x, y: ys[i] ?? 0 }));
  }, [result, forecastInput]);

  const showPolyWarning =
    result !== null &&
    (mode === 'poly2' || mode === 'poly3') &&
    Math.abs(result.r2) < 0.1;

  const xLabel = numericColumns.find((c) => c.key === effectiveX)?.name ?? effectiveX;
  const yLabel = numericColumns.find((c) => c.key === effectiveY)?.name ?? effectiveY;

  const handleRun = useCallback(() => {
    if (pairs.length < 2) return;
    setIsRunning(true);
    requestAnimationFrame(() => {
      setRunToken((t) => t + 1);
      setIsRunning(false);
    });
  }, [pairs.length]);

  if (!sheet) return null;

  if (numericColumns.length < 2) {
    return (
      <GlassCard>
        <div className="flex h-40 items-center justify-center text-slate-400 text-sm">
          Need at least 2 numeric columns for regression analysis
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassSelect
            label="X Column (independent)"
            value={effectiveX}
            onValueChange={setXCol}
            options={columnOptions}
            placeholder="Select X..."
          />
          <GlassSelect
            label="Y Column (dependent)"
            value={effectiveY}
            onValueChange={setYCol}
            options={columnOptions}
            placeholder="Select Y..."
          />
          <GlassSelect
            label="Regression Type"
            value={mode}
            onValueChange={(v) => setMode(v as RegressionMode)}
            options={MODE_OPTIONS}
          />
          <div className="flex items-end">
            <GlassButton
              variant="primary"
              className="w-full"
              onClick={handleRun}
              disabled={isRunning || pairs.length < 2}
              leftIcon={
                isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )
              }
            >
              Fit Model
            </GlassButton>
          </div>
        </div>
        <p className="text-xs text-slate-400">{pairs.length} valid paired observations</p>
      </GlassCard>

      {isRunning && (
        <GlassCard>
          <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-violet)]" />
            Fitting regression model…
          </div>
        </GlassCard>
      )}

      {!isRunning && result && (
        <>
          {showPolyWarning && (
            <GlassCard className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3 text-amber-400 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Low R² warning</p>
                  <p className="text-amber-400/80 text-xs mt-1">
                    Polynomial fit (degree &gt; 1) has R² = {formatNumber(result.r2, 4)}. The model
                    may be numerically unstable or a poor fit for this data. Consider linear
                    regression or different columns.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'R²', value: formatNumber(result.r2, 4) },
              { label: 'Slope', value: formatNumber(result.slope, 4) },
              { label: 'Intercept', value: formatNumber(result.intercept, 4) },
              { label: 'Equation', value: result.equation, mono: true },
            ].map((stat) => (
              <GlassCard key={stat.label} padding="sm" className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  {stat.label}
                </p>
                <p
                  className={`text-sm font-semibold text-white ${stat.mono ? 'font-mono text-xs break-all' : ''}`}
                >
                  {stat.value}
                </p>
              </GlassCard>
            ))}
          </div>

          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Regression Plot</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={xLabel}
                    domain={['auto', 'auto']}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    label={{
                      value: xLabel,
                      position: 'insideBottom',
                      offset: -10,
                      fill: 'var(--text-secondary)',
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={yLabel}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,13,34,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Scatter
                    name="Observed"
                    data={chartData.scatter}
                    fill={getChartColor(0)}
                    fillOpacity={0.65}
                  />
                  <Line
                    name="Fit"
                    data={chartData.line}
                    type="monotone"
                    dataKey="y"
                    stroke={getChartColor(1)}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-1">Residuals</h3>
            <p className="text-xs text-slate-400 mb-4">Prediction error per observation</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.residuals} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="index"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,13,34,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                    }}
                    formatter={(v) => [formatNumber(Number(v), 4), 'Residual']}
                  />
                  <Bar
                    dataKey="residual"
                    fill={getChartColor(4)}
                    fillOpacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Forecast</h3>
            <p className="text-xs text-slate-400">
              Enter future {xLabel} values (comma-separated) to predict {yLabel}
            </p>
            <GlassInput
              placeholder="e.g. 10, 20, 30, 40"
              value={forecastInput}
              onChange={(e) => setForecastInput(e.target.value)}
            />
            {forecastValues && forecastValues.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-2 pr-4">{xLabel}</th>
                      <th className="pb-2">Predicted {yLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastValues.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 pr-4 font-mono text-slate-300">
                          {formatNumber(row.x, 4)}
                        </td>
                        <td className="py-2 font-mono text-[var(--accent-cyan)]">
                          {formatNumber(row.y, 4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {!isRunning && runToken === 0 && (
        <GlassCard className="border-dashed border-white/10 bg-white/[0.02]">
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
            Select columns, choose a model, and click Fit Model
          </div>
        </GlassCard>
      )}
    </div>
  );
};
