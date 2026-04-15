'use client';

import React, { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { describeColumn } from '@/lib/stats';
import { formatNumber, cn } from '@/lib/utils';
import { getColumnTypeIcon, formatColumnType } from '@/lib/formatters';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { ColumnProfiler } from './ColumnProfiler';
import { DescriptiveStats } from '@/types/analysis';
import { CellValue } from '@/types/data';

interface ColumnStatsSummary {
  key: string;
  name: string;
  type: string;
  typeIcon: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  qualityScore: number;
  stats: DescriptiveStats | null;
}

export const StatSummaryPanel: React.FC = () => {
  const { getActiveSheetData, isLoading: storeLoading } = useDataStore();
  const sheet = getActiveSheetData();
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const columnSummaries = useMemo(() => {
    if (!sheet) return [];

    return sheet.columns.map((col) => {
      const values = sheet.rows.map((row) => row[col.key]);
      const stats = col.type === 'number' || col.type === 'currency' || col.type === 'percentage' 
        ? describeColumn(values.filter((v): v is CellValue => v !== undefined))
        : null;

      return {
        key: col.key,
        name: col.name,
        type: formatColumnType(col.type),
        typeIcon: getColumnTypeIcon(col.type),
        count: sheet.rowCount,
        nullCount: col.nullCount,
        uniqueCount: col.uniqueCount,
        qualityScore: col.qualityScore,
        stats,
      } as ColumnStatsSummary;
    });
  }, [sheet]);

  const overallStats = useMemo(() => {
    if (!sheet || columnSummaries.length === 0) return null;

    const totalRows = sheet.rowCount;
    const totalColumns = sheet.columnCount;
    const totalNulls = columnSummaries.reduce((sum, col) => sum + col.nullCount, 0);
    const avgQuality = columnSummaries.reduce((sum, col) => sum + col.qualityScore, 0) / totalColumns;

    return {
      totalRows,
      totalColumns,
      totalNulls,
      avgQuality,
    };
  }, [sheet, columnSummaries]);

  const getQualityVariant = (score: number) => {
    if (score > 80) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  };

  if (storeLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <GlassCard className="h-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <GlassCard className="flex items-center justify-center h-64 text-slate-400">
        No active sheet selected. Please upload or select a data sheet.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Column Summary Table */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Column Name</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Type</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Count</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Nulls</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Unique</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Min</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Max</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Mean</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Median</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">StdDev</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {columnSummaries.map((col) => (
                <tr 
                  key={col.key} 
                  onClick={() => setSelectedColumn(col.key)}
                  className={cn(
                    "hover:bg-white/5 transition-colors cursor-pointer",
                    selectedColumn === col.key && "bg-white/10 shadow-inner"
                  )}
                >
                  <td className="p-4">
                    <div className="font-medium text-slate-200">{col.name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-lg opacity-60" title={col.type}>{col.typeIcon}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{formatNumber(col.count)}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{formatNumber(col.nullCount)}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{formatNumber(col.uniqueCount)}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{col.stats ? formatNumber(col.stats.min, 2) : '—'}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{col.stats ? formatNumber(col.stats.max, 2) : '—'}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{col.stats ? formatNumber(col.stats.mean, 2) : '—'}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{col.stats ? formatNumber(col.stats.median, 2) : '—'}</td>
                  <td className="p-4 text-right text-slate-300 tabular-nums">{col.stats ? formatNumber(col.stats.stdDev, 2) : '—'}</td>
                  <td className="p-4 text-center">
                    <GlassBadge variant={getQualityVariant(col.qualityScore)} dot>
                      {Math.round(col.qualityScore)}%
                    </GlassBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Dataset Score Card */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard padding="md" className="flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Rows</span>
            <span className="text-2xl font-bold text-slate-100 tabular-nums">{formatNumber(overallStats.totalRows)}</span>
          </GlassCard>
          <GlassCard padding="md" className="flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Columns</span>
            <span className="text-2xl font-bold text-slate-100 tabular-nums">{formatNumber(overallStats.totalColumns)}</span>
          </GlassCard>
          <GlassCard padding="md" className="flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Nulls</span>
            <span className="text-2xl font-bold text-slate-100 tabular-nums">{formatNumber(overallStats.totalNulls)}</span>
          </GlassCard>
          <GlassCard padding="md" className="flex flex-col justify-center overflow-hidden relative">
            <div className={cn(
              "absolute inset-0 opacity-10",
              overallStats.avgQuality > 80 ? "bg-green-500" : overallStats.avgQuality >= 50 ? "bg-amber-500" : "bg-red-500"
            )} />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider relative z-10">Overall Quality</span>
            <span className={cn(
              "text-2xl font-bold relative z-10",
              overallStats.avgQuality > 80 ? "text-green-400" : overallStats.avgQuality >= 50 ? "text-amber-400" : "text-red-400"
            )}>
              {Math.round(overallStats.avgQuality)}%
            </span>
          </GlassCard>
        </div>
      )}

      {/* Column Profiler */}
      {selectedColumn && (
        <ColumnProfiler columnKey={selectedColumn} />
      )}
    </div>
  );
};
