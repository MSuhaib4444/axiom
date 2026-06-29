'use client';

import React, { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ChartConfig } from '@/types/charts';
import { useDataStore } from '@/store/dataStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Download, BarChart2, AlertCircle } from 'lucide-react';
import { computeCorrelation } from '@/lib/stats';
import { toChartAxisValue, toChartNumericValue } from '@/lib/formatters';
import { CellValue, ColumnType } from '@/types/data';

const BarChartView = dynamic(() => import('./charts/BarChartView'), { ssr: false });
const LineChartView = dynamic(() => import('./charts/LineChartView'), { ssr: false });
const AreaChartView = dynamic(() => import('./charts/AreaChartView'), { ssr: false });
const PieChartView = dynamic(() => import('./charts/PieChartView'), { ssr: false });
const ScatterPlotView = dynamic(() => import('./charts/ScatterPlotView'), { ssr: false });
const HeatmapView = dynamic(() => import('./charts/HeatmapView'), { ssr: false });
const TreemapView = dynamic(() => import('./charts/TreemapView'), { ssr: false });
const SankeyView = dynamic(() => import('./charts/SankeyView'), { ssr: false });
const RadarChartView = dynamic(() => import('./charts/RadarChartView'), { ssr: false });
const BoxPlotView = dynamic(() => import('./charts/BoxPlotView'), { ssr: false });
const WaterfallView = dynamic(() => import('./charts/WaterfallView'), { ssr: false });

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

const ADVANCED_TYPES = new Set([
  'heatmap',
  'treemap',
  'sankey',
  'radar',
  'boxplot',
  'waterfall',
]);

function requiresValueColumn(type: ChartConfig['type']): boolean {
  return type === 'heatmap' || type === 'sankey';
}

function isNumericColumnType(type?: ColumnType): boolean {
  return !!type && ['number', 'currency', 'percentage'].includes(type);
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  config,
  height = 400,
  onExport,
}) => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();

  const valueColumn = config.groupBy ?? (config.options?.valueColumn as string | undefined) ?? null;

  const data = useMemo(() => {
    if (!sheet || !config.xColumn) return [];

    if (config.type === 'radar') {
      return sheet.rows.filter((row) =>
        sheet.columns
          .filter((c) => ['number', 'currency', 'percentage'].includes(c.type))
          .some((c) => row[c.key] !== null && row[c.key] !== undefined)
      );
    }

    if (config.type === 'boxplot') {
      return sheet.rows;
    }

    if (!config.yColumn) return [];

    const xCol = sheet.columns.find((c) => c.key === config.xColumn);
    const yCol = sheet.columns.find((c) => c.key === config.yColumn);
    const valueColMeta = valueColumn
      ? sheet.columns.find((c) => c.key === valueColumn)
      : undefined;

    const xUsesNumericScale =
      config.type === 'scatter' || isNumericColumnType(xCol?.type);
    const xSortableDates =
      (config.type === 'line' || config.type === 'area') && xCol?.type === 'date';

    const rawData = sheet.rows
      .filter(
        (row) =>
          row[config.xColumn!] !== null &&
          row[config.xColumn!] !== undefined &&
          row[config.yColumn!] !== null &&
          row[config.yColumn!] !== undefined &&
          (requiresValueColumn(config.type)
            ? valueColumn
              ? row[valueColumn] !== null && row[valueColumn] !== undefined
              : true
            : true)
      )
      .map((row) => {
        const rawX = row[config.xColumn!] ?? null;
        const rawY = row[config.yColumn!] ?? null;
        const point: Record<string, string | number> = {
          [config.xColumn!]: xUsesNumericScale
            ? toChartNumericValue(rawX, xCol?.type)
            : toChartAxisValue(rawX, xCol?.type, {
                sortable: xSortableDates,
              }),
          [config.yColumn!]: toChartNumericValue(rawY, yCol?.type),
        };

        if (valueColumn) {
          point[valueColumn] = toChartNumericValue(row[valueColumn] ?? null, valueColMeta?.type);
        }

        return point;
      })
      .filter((row) => {
        const xVal = row[config.xColumn!];
        const yVal = row[config.yColumn!];
        const valueVal = valueColumn ? row[valueColumn] : 0;

        if (xVal === '' || xVal === null || xVal === undefined) return false;
        if (typeof yVal !== 'number' || !Number.isFinite(yVal)) return false;
        if (requiresValueColumn(config.type) && valueColumn) {
          if (typeof valueVal !== 'number' || !Number.isFinite(valueVal)) return false;
        }
        if (xUsesNumericScale && typeof xVal === 'number' && !Number.isFinite(xVal)) {
          return false;
        }
        return true;
      });

    if (config.type === 'bar' || config.type === 'pie') {
      const isCategorical =
        xCol &&
        (['string', 'category', 'boolean', 'date'].includes(xCol.type) ||
          !isNumericColumnType(xCol.type));

      if (isCategorical) {
        const groups: Record<string, number> = {};
        rawData.forEach((row) => {
          const key = String(row[config.xColumn!]);
          const val = Number(row[config.yColumn!]);
          if (Number.isFinite(val)) {
            groups[key] = (groups[key] ?? 0) + val;
          }
        });

        return Object.entries(groups).map(([key, val]) => ({
          [config.xColumn!]: key,
          [config.yColumn!]: val,
        }));
      }
    }

    if (xSortableDates) {
      rawData.sort((a, b) =>
        String(a[config.xColumn!]).localeCompare(String(b[config.xColumn!]))
      );
    }

    return rawData;
  }, [sheet, config, valueColumn]);

  const radarData = useMemo(() => {
    if (!sheet || config.type !== 'radar') {
      return { series: [] as Array<Record<string, number>>, keys: [] as string[], seriesNames: [] as string[] };
    }

    const numericCols = sheet.columns.filter((c) =>
      ['number', 'currency', 'percentage'].includes(c.type)
    );

    const keys =
      (config.options?.radarKeys as string[] | undefined)?.filter((k) =>
        numericCols.some((c) => c.key === k)
      ) ?? numericCols.map((c) => c.key);

    if (keys.length < 2) return { series: [], keys: [], seriesNames: [] };

    const maxSeries = 5;
    const seriesNames: string[] = [];
    const series = data.slice(0, maxSeries).map((row, i) => {
      const seriesName =
        config.xColumn && row[config.xColumn] != null
          ? String(row[config.xColumn])
          : `Series ${i + 1}`;
      seriesNames.push(seriesName);
      const point: Record<string, number> = {};
      keys.forEach((key) => {
        const raw = row[key];
        const val = typeof raw === 'number' ? raw : Number(raw);
        point[key] = Number.isFinite(val) ? val : 0;
      });
      return point;
    });

    if (series.length === 0) {
      const meanPoint: Record<string, number> = {};
      keys.forEach((key) => {
        const vals = sheet.rows
          .map((r) => r[key])
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        meanPoint[key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      return { series: [meanPoint], keys, seriesNames: ['Dataset Mean'] };
    }

    return { series, keys, seriesNames };
  }, [sheet, config, data]);

  const boxPlotData = useMemo(() => {
    if (!sheet || config.type !== 'boxplot' || !config.xColumn || !config.yColumn) {
      return { values: [] as CellValue[][], labels: [] as string[] };
    }

    const groups = new Map<string, CellValue[]>();
    sheet.rows.forEach((row) => {
      const label = String(row[config.xColumn!] ?? '');
      const val = row[config.yColumn!];
      if (!label || val === null || val === undefined) return;
      const existing = groups.get(label) ?? [];
      existing.push(val);
      groups.set(label, existing);
    });

    const labels = Array.from(groups.keys()).sort();
    const values = labels.map((label) => groups.get(label) ?? []);

    return { values, labels };
  }, [sheet, config]);

  const correlation = useMemo(() => {
    if (config.type !== 'scatter' || !sheet || !config.xColumn || !config.yColumn) return null;
    const colA = sheet.rows.map((r) => r[config.xColumn!]);
    const colB = sheet.rows.map((r) => r[config.yColumn!]);
    return computeCorrelation(
      colA.filter((v): v is CellValue => v !== undefined),
      colB.filter((v): v is CellValue => v !== undefined)
    );
  }, [sheet, config]);

  const hasData = useMemo(() => {
    if (!sheet) return false;
    switch (config.type) {
      case 'radar':
        return radarData.keys.length >= 2 && radarData.series.length > 0;
      case 'boxplot':
        return boxPlotData.values.length > 0;
      case 'heatmap':
      case 'sankey':
        return data.length > 0 && !!valueColumn;
      default:
        return data.length > 0 && !!config.yColumn;
    }
  }, [sheet, config, data, radarData, boxPlotData, valueColumn]);

  if (!sheet || !hasData) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-4 text-slate-500" style={{ height }}>
        <BarChart2 className="w-12 h-12 opacity-20" />
        <p className="text-sm text-center px-6">
          {requiresValueColumn(config.type) && !valueColumn
            ? 'Select a value column for this chart type.'
            : 'No data available to visualize. Select columns to begin.'}
        </p>
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
      case 'heatmap':
        return (
          <HeatmapView
            data={data}
            xKey={config.xColumn!}
            yKey={config.yColumn!}
            valueKey={valueColumn!}
          />
        );
      case 'treemap':
        return (
          <TreemapView
            data={data}
            labelKey={config.xColumn!}
            valueKey={config.yColumn!}
            {...(config.colorBy ? { groupKey: config.colorBy } : {})}
          />
        );
      case 'sankey':
        return (
          <SankeyView
            data={data}
            sourceKey={config.xColumn!}
            targetKey={config.yColumn!}
            valueKey={valueColumn!}
          />
        );
      case 'radar':
        return (
          <RadarChartView
            data={radarData.series}
            keys={radarData.keys}
            seriesNames={radarData.seriesNames}
          />
        );
      case 'boxplot':
        return (
          <BoxPlotView
            data={boxPlotData.values}
            labels={boxPlotData.labels}
          />
        );
      case 'waterfall':
        return (
          <WaterfallView
            data={data}
            xKey={config.xColumn!}
            yKey={config.yColumn!}
          />
        );
      default:
        return (
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle size={20} />
            <span>Chart type &quot;{config.type}&quot; is not yet implemented.</span>
          </div>
        );
    }
  };

  return (
    <GlassCard padding="none" className="overflow-hidden flex flex-col group shadow-2xl">
      <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {config.title || 'Untitled Chart'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
              {config.type.toUpperCase()}
            </span>
            {ADVANCED_TYPES.has(config.type) && (
              <span className="text-xs font-medium px-2 py-0.5 rounded badge-violet">
                {['heatmap', 'treemap', 'sankey'].includes(config.type) ? 'D3 POWERED' : 'ADVANCED'}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {config.type === 'radar'
                ? `${radarData.keys.length} axes`
                : config.type === 'boxplot'
                  ? `${boxPlotData.labels.length} groups`
                  : `${data.length.toLocaleString()} rows`}
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

      <div className="p-6 relative" style={{ height }}>
        <Suspense fallback={<ChartSkeleton />}>
          {renderChart()}
        </Suspense>
      </div>
    </GlassCard>
  );
};