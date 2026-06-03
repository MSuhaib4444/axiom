'use client';

import React, { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ChartConfig } from '@/types/charts';
import { useDataStore } from '@/store/dataStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Download, BarChart2, AlertCircle } from 'lucide-react';
import { computeCorrelation } from '@/lib/stats';
import { CellValue } from '@/types/data';

// Dynamic imports for chart components
const BarChartView = dynamic(() => import('./charts/BarChartView'), { ssr: false });
const LineChartView = dynamic(() => import('./charts/LineChartView'), { ssr: false });
const AreaChartView = dynamic(() => import('./charts/AreaChartView'), { ssr: false });
const PieChartView = dynamic(() => import('./charts/PieChartView'), { ssr: false });
const ScatterPlotView = dynamic(() => import('./charts/ScatterPlotView'), { ssr: false });

interface ChartCanvasProps {
  config: ChartConfig;
  height?: number;
  onExport?: () => void;
}

const ChartSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center animate-pulse bg-white/5 rounded-xl">
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="w-24 h-4 bg-white/10 rounded" />
    </div>
  </div>
);

export const ChartCanvas: React.FC<ChartCanvasProps> = ({ 
  config, 
  height = 400, 
  onExport 
}) => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();

  const data = useMemo(() => {
    if (!sheet || !config.xColumn || !config.yColumn) return [];
    
    const xCol = sheet.columns.find(c => c.key === config.xColumn);
    const yCol = sheet.columns.find(c => c.key === config.yColumn);
    
    if (!xCol || !yCol) return [];

    const rawData = sheet.rows
      .filter(row => row[config.xColumn!] !== null && row[config.yColumn!] !== null)
      .map(row => ({
        ...row,
        [config.xColumn!]: row[config.xColumn!],
        [config.yColumn!]: typeof row[config.yColumn!] === 'number' ? row[config.yColumn!] : Number(row[config.yColumn!])
      }));

    // Grouping/Aggregation for Bar and Pie charts
    if (config.type === 'bar' || config.type === 'pie') {
      const isCategorical = ['string', 'category', 'boolean'].includes(xCol.type);
      
      if (isCategorical) {
        const groups: Record<string, number> = {};
        rawData.forEach(row => {
          const key = String(row[config.xColumn!]);
          const val = Number(row[config.yColumn!]);
          groups[key] = (groups[key] || 0) + val;
        });

        return Object.entries(groups).map(([key, val]) => ({
          [config.xColumn!]: key,
          [config.yColumn!]: val
        }));
      }
    }

    // Default: use raw values (for scatter, line, area, etc.)
    return rawData;
  }, [sheet, config]);

  const correlation = useMemo(() => {
    if (config.type !== 'scatter' || !sheet || !config.xColumn || !config.yColumn) return null;
    const colA = sheet.rows.map(r => r[config.xColumn!]);
    const colB = sheet.rows.map(r => r[config.yColumn!]);
    return computeCorrelation(colA.filter((v): v is CellValue => v !== undefined), 
                            colB.filter((v): v is CellValue => v !== undefined));
  }, [sheet, config]);

  if (!sheet || data.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-4 text-slate-500" style={{ height }}>
        <BarChart2 className="w-12 h-12 opacity-20" />
        <p className="text-sm">No data available to visualize. Select columns to begin.</p>
      </GlassCard>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      xKey: config.xColumn!,
      yKey: config.yColumn!,
      color: (config.options?.color as string) || undefined,
    };

    switch (config.type) {
      case 'bar':
        return <BarChartView {...commonProps} />;
      case 'line':
        return <LineChartView {...commonProps} />;
      case 'area':
        return <AreaChartView {...commonProps} />;
      case 'pie':
        return <PieChartView {...commonProps} />;
      case 'scatter':
        return <ScatterPlotView {...commonProps} />;
      default:
        return (
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle size={20} />
            <span>Chart type "{config.type}" is not yet implemented.</span>
          </div>
        );
    }
  };

  return (
    <GlassCard padding="none" className="overflow-hidden flex flex-col group shadow-2xl">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">{config.title || 'Untitled Chart'}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
              {config.type.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">
              {data.length.toLocaleString()} rows
              {correlation !== null && ` • r = ${correlation.toFixed(3)}`}
            </span>
          </div>
        </div>
        {onExport && (
          <button 
            onClick={onExport}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/5 transition-all"
            title="Export Chart"
          >
            <Download size={18} />
          </button>
        )}
      </div>

      {/* Chart Body */}
      <div className="p-6 relative" style={{ height }}>
        <Suspense fallback={<ChartSkeleton />}>
          {renderChart()}
        </Suspense>
      </div>
    </GlassCard>
  );
};