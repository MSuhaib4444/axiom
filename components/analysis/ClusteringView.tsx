'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, Play } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { kMeans, findOptimalK, normalizeCols } from '@/lib/clustering';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassSlider } from '@/components/ui/GlassSlider';
import { AXIOM_COLORS, getChartColor } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';
import type { ClusterResult } from '@/types/analysis';
import type { CellValue } from '@/types/data';

interface ClusteringOutput {
  result: ClusterResult;
  elbowData: Array<{ k: number; inertia: number }>;
  scatterData: Array<{ x: number; y: number; cluster: number; color: string }>;
  summaryRows: Array<{ cluster: number; size: number; centroidX: string; centroidY: string }>;
  xLabel: string;
  yLabel: string;
}

function toNumber(val: CellValue): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export const ClusteringView: React.FC = () => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();

  const numericColumns = useMemo(() => {
    if (!sheet) return [];
    return sheet.columns.filter((c) => c.type === 'number');
  }, [sheet]);

  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [kValue, setKValue] = useState([3]);
  const [runToken, setRunToken] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const columnOptions = useMemo(
    () => numericColumns.map((c) => ({ value: c.key, label: c.name })),
    [numericColumns]
  );

  const effectiveX = xCol || numericColumns[0]?.key || '';
  const effectiveY = yCol || numericColumns[1]?.key || effectiveX;

  const rawPairs = useMemo(() => {
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

  const output = useMemo((): ClusteringOutput | null => {
    if (runToken === 0 || rawPairs.length < 2) return null;

    const data = rawPairs.map((p) => [p.x, p.y]);
    const normalized = normalizeCols(data);
    const k = kValue[0] ?? 3;

    const result = kMeans(normalized, k, 100);
    const inertias = findOptimalK(normalized, 8);
    const elbowData = inertias.map((inertia, i) => ({ k: i + 2, inertia }));

    const xMeta = numericColumns.find((c) => c.key === effectiveX);
    const yMeta = numericColumns.find((c) => c.key === effectiveY);

    const scatterData = rawPairs.map((p, i) => {
      const cluster = result.assignments[i] ?? 0;
      return {
        x: p.x,
        y: p.y,
        cluster,
        color: AXIOM_COLORS[cluster % AXIOM_COLORS.length] ?? '#6C63FF',
      };
    });

    const summaryRows = Array.from({ length: k }, (_, ci) => {
      const members = scatterData.filter((d) => d.cluster === ci);
      const centroid = result.centroids[ci];
      const denormX =
        centroid && xMeta?.min !== undefined && xMeta?.max !== undefined
          ? centroid[0]! * ((xMeta.max - xMeta.min) || 1) + xMeta.min
          : (centroid?.[0] ?? 0);
      const denormY =
        centroid && yMeta?.min !== undefined && yMeta?.max !== undefined
          ? centroid[1]! * ((yMeta.max - yMeta.min) || 1) + yMeta.min
          : (centroid?.[1] ?? 0);
      return {
        cluster: ci + 1,
        size: members.length,
        centroidX: formatNumber(denormX, 2),
        centroidY: formatNumber(denormY, 2),
      };
    });

    return {
      result,
      elbowData,
      scatterData,
      summaryRows,
      xLabel: xMeta?.name ?? effectiveX,
      yLabel: yMeta?.name ?? effectiveY,
    };
  }, [runToken, rawPairs, kValue, effectiveX, effectiveY, numericColumns]);

  const handleRun = useCallback(() => {
    if (rawPairs.length < 2) return;
    setIsRunning(true);
    requestAnimationFrame(() => {
      setRunToken((t) => t + 1);
      setIsRunning(false);
    });
  }, [rawPairs.length]);

  if (!sheet) return null;

  if (numericColumns.length < 2) {
    return (
      <GlassCard>
        <div className="flex h-40 items-center justify-center text-slate-400 text-sm">
          Need at least 2 numeric columns for clustering analysis
        </div>
      </GlassCard>
    );
  }

  const k = kValue[0] ?? 3;

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassSelect
            label="X Column"
            value={effectiveX}
            onValueChange={setXCol}
            options={columnOptions}
            placeholder="Select X axis..."
          />
          <GlassSelect
            label="Y Column"
            value={effectiveY}
            onValueChange={setYCol}
            options={columnOptions}
            placeholder="Select Y axis..."
          />
          <div className="sm:col-span-2">
            <GlassSlider
              label="Clusters (k)"
              min={2}
              max={8}
              step={1}
              value={kValue}
              onValueChange={setKValue}
              formatValue={(v) => `${v} clusters`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GlassButton
            variant="primary"
            onClick={handleRun}
            disabled={isRunning || rawPairs.length < 2}
            leftIcon={isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          >
            Run Clustering
          </GlassButton>
          <span className="text-xs text-slate-400">
            {rawPairs.length} valid points · k = {k}
          </span>
        </div>
      </GlassCard>

      {isRunning && (
        <GlassCard>
          <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-violet)]" />
            Running k-means clustering…
          </div>
        </GlassCard>
      )}

      {!isRunning && output && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-1">Elbow Method</h3>
              <p className="text-xs text-slate-400 mb-4">
                Inertia vs k — look for the &quot;elbow&quot; where gains diminish
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={output.elbowData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="k"
                      label={{ value: 'k', position: 'insideBottom', offset: -5, fill: 'var(--text-secondary)' }}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(13,13,34,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                      formatter={(v) => [formatNumber(Number(v), 2), 'Inertia']}
                    />
                    <Line
                      type="monotone"
                      dataKey="inertia"
                      stroke={getChartColor(0)}
                      strokeWidth={2}
                      dot={{ fill: getChartColor(0), r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-1">Cluster Scatter Plot</h3>
              <p className="text-xs text-slate-400 mb-4">
                Silhouette ≈ {formatNumber(output.result.silhouetteScore, 3)} · Inertia{' '}
                {formatNumber(output.result.inertia, 2)}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={output.xLabel}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      label={{ value: output.xLabel, position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={output.yLabel}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        background: 'rgba(13,13,34,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    {Array.from({ length: k }, (_, ci) => (
                      <Scatter
                        key={ci}
                        name={`Cluster ${ci + 1}`}
                        data={output.scatterData.filter((d) => d.cluster === ci)}
                        fill={AXIOM_COLORS[ci % AXIOM_COLORS.length]}
                        fillOpacity={0.75}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Cluster Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4">Cluster</th>
                    <th className="pb-3 pr-4">Size</th>
                    <th className="pb-3 pr-4">Centroid ({output.xLabel})</th>
                    <th className="pb-3">Centroid ({output.yLabel})</th>
                  </tr>
                </thead>
                <tbody>
                  {output.summaryRows.map((row) => (
                    <tr key={row.cluster} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-2"
                          style={{ color: AXIOM_COLORS[(row.cluster - 1) % AXIOM_COLORS.length] }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                AXIOM_COLORS[(row.cluster - 1) % AXIOM_COLORS.length],
                            }}
                          />
                          {row.cluster}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{row.size}</td>
                      <td className="py-3 pr-4 font-mono text-slate-300">{row.centroidX}</td>
                      <td className="py-3 font-mono text-slate-300">{row.centroidY}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {!isRunning && runToken === 0 && (
        <GlassCard className="border-dashed border-white/10 bg-white/[0.02]">
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
            Select columns and click Run Clustering to view results
          </div>
        </GlassCard>
      )}
    </div>
  );
};
