'use client';

import React, { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { 
  describeColumn, 
  computeFrequencyDistribution, 
  detectOutliers 
} from '@/lib/stats';
import { formatNumber, cn } from '@/lib/utils';
import { getColumnTypeIcon, formatColumnType } from '@/lib/formatters';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CellValue } from '@/types/data';

interface ColumnProfilerProps {
  columnKey: string | null;
}

const AXIOM_COLORS = ['#6C63FF', '#00D4FF', '#39FF14', '#FFB627', '#FF4757'];

export const ColumnProfiler: React.FC<ColumnProfilerProps> = ({ columnKey }) => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();

  const column = useMemo(() => {
    if (!sheet || !columnKey) return null;
    return sheet.columns.find(c => c.key === columnKey) || null;
  }, [sheet, columnKey]);

  const columnValues = useMemo(() => {
    if (!sheet || !columnKey) return [];
    return sheet.rows.map(row => row[columnKey]);
  }, [sheet, columnKey]);

  const stats = useMemo(() => {
    if (columnValues.length === 0 || !column) return null;
    if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
      return describeColumn(columnValues.filter((v): v is NonNullable<CellValue> => v !== undefined));
    }
    return null;
  }, [columnValues, column]);

  const frequencyDistribution = useMemo(() => {
    if (columnValues.length === 0) return [];
    return computeFrequencyDistribution(columnValues.filter((v): v is NonNullable<CellValue> => v !== undefined), 10);
  }, [columnValues]);

  const outliers = useMemo(() => {
    if (columnValues.length === 0 || !column) return [];
    if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
      return detectOutliers(columnValues.filter((v): v is NonNullable<CellValue> => v !== undefined), 'iqr');
    }
    return [];
  }, [columnValues, column]);

  const topValues = useMemo(() => {
    if (columnValues.length === 0 || (column && column.type === 'number')) return [];
    
    const counts = new Map<any, number>();
    columnValues.forEach(v => {
      if (v !== null && v !== undefined) {
        counts.set(v, (counts.get(v) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ 
        value: String(value), 
        count,
        pct: (count / columnValues.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [columnValues, column]);

  if (!columnKey || !column) {
    return (
      <GlassCard padding="lg" className="flex items-center justify-center h-64 text-slate-400">
        Select a column from the summary table to view detailed profiling.
      </GlassCard>
    );
  }

  const chartData: Record<string, string | number>[] = frequencyDistribution.map(item => ({
    label: item.label,
    count: item.count
  }));

  const getQualityVariant = (score: number) => {
    if (score > 80) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  };

  return (
    <GlassCard padding="lg" variant="heavy" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
            {getColumnTypeIcon(column.type)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{column.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400">{formatColumnType(column.type)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400">{formatNumber(columnValues.length)} values</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Quality Score</div>
            <GlassBadge variant={getQualityVariant(column.qualityScore)} size="md" dot>
              {Math.round(column.qualityScore)}%
            </GlassBadge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Stats & Distribution */}
        <div className="space-y-8">
          {/* Numeric Stats Grid */}
          {stats && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Descriptive Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Mean', value: stats.mean },
                  { label: 'Median', value: stats.median },
                  { label: 'Std Dev', value: stats.stdDev },
                  { label: 'Min', value: stats.min },
                  { label: 'Max', value: stats.max },
                  { label: 'Range', value: stats.range },
                  { label: 'Q1', value: stats.q1 },
                  { label: 'Q3', value: stats.q3 },
                  { label: 'IQR', value: stats.iqr },
                  { label: 'Skewness', value: stats.skewness },
                  { label: 'Kurtosis', value: stats.kurtosis },
                  { label: 'CV (%)', value: stats.cv },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-[10px] font-medium text-slate-500 uppercase mb-1">{stat.label}</div>
                    <div className="text-sm font-bold text-slate-200 tabular-nums">
                      {formatNumber(stat.value, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Chart */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Frequency Distribution</h3>
            <div className="h-[160px] w-full bg-white/5 rounded-xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#00D4FF' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={AXIOM_COLORS[0] ?? '#6C63FF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Outliers & Top Values */}
        <div className="space-y-8">
          {/* Outliers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Outliers</h3>
              <GlassBadge variant={outliers.length > 0 ? 'amber' : 'green'}>
                {outliers.length} detected
              </GlassBadge>
            </div>
            
            {outliers.length > 0 ? (
              <div className="max-height-[240px] overflow-y-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
                    <tr>
                      <th className="p-2.5 font-semibold text-slate-400">Row</th>
                      <th className="p-2.5 font-semibold text-slate-400">Value</th>
                      <th className="p-2.5 font-semibold text-slate-400 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {outliers.slice(0, 50).map((outlier, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 text-slate-400 tabular-nums">{outlier.rowIndex + 1}</td>
                        <td className="p-2.5 text-slate-200 font-medium tabular-nums">{formatNumber(outlier.value, 2)}</td>
                        <td className="p-2.5 text-center">
                          <GlassBadge 
                            variant={outlier.severity === 'high' ? 'red' : outlier.severity === 'medium' ? 'amber' : 'cyan'} 
                            size="sm"
                          >
                            {outlier.severity}
                          </GlassBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {outliers.length > 50 && (
                  <div className="p-2 text-center text-[10px] text-slate-500 border-t border-white/5">
                    Showing first 50 of {outliers.length} outliers
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 text-slate-500 text-sm">
                No significant outliers detected
              </div>
            )}
          </div>

          {/* Top Values Section (Categorical) */}
          {topValues.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Top Values</h3>
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
                {topValues.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium truncate max-w-[70%]">{item.value}</span>
                      <span className="text-slate-400 tabular-nums">{formatNumber(item.count)} ({item.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00D4FF] rounded-full opacity-60"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
