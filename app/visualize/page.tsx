'use client';

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { useAIStore } from '@/store/aiStore';
import { ChartType, ChartConfig } from '@/types/charts';
import { ChartCanvas } from '@/components/charts/ChartCanvas';
import { useChartExporter } from '@/components/charts/ChartExporter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { cn } from '@/lib/utils';
import { 
  BarChart2, 
  LineChart, 
  AreaChart as AreaChartIcon, 
  PieChart as PieChartIcon, 
  ScatterChart as ScatterChartIcon,
  Sparkles,
  Download,
  Copy,
  ChevronLeft,
  ArrowRight,
  Loader2,
  FileImage,
  FileCode,
  Grid3X3,
  LayoutGrid,
  GitMerge,
  Radar,
  BoxSelect,
  Activity
} from 'lucide-react';

const AXIOM_COLORS = [
  '#00D4FF',
  '#FF00A8',
  '#FFD600',
  '#00FF88',
  '#FF3D71',
  '#6200FF',
  '#FF8A00',
  '#00FFEA',
  '#FF00E5',
  '#0AFF00'
];

const BASIC_CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChart2 size={20} /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart size={20} /> },
  { type: 'area', label: 'Area Chart', icon: <AreaChartIcon size={20} /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieChartIcon size={20} /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChartIcon size={20} /> },
];

const ADVANCED_CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode; d3Powered?: boolean }[] = [
  { type: 'heatmap', label: 'Heatmap', icon: <Grid3X3 size={20} />, d3Powered: true },
  { type: 'treemap', label: 'Treemap', icon: <LayoutGrid size={20} />, d3Powered: true },
  { type: 'sankey', label: 'Sankey', icon: <GitMerge size={20} />, d3Powered: true },
  { type: 'radar', label: 'Radar', icon: <Radar size={20} /> },
  { type: 'boxplot', label: 'Box Plot', icon: <BoxSelect size={20} /> },
  { type: 'waterfall', label: 'Waterfall', icon: <Activity size={20} /> },
];

function VisualizePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { file, getActiveSheetData, selectedColumns, isRestoring } = useDataStore();
  const { insights } = useAIStore();
  const sheet = getActiveSheetData();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  // Redirect if no file
  useEffect(() => {
    if (!isRestoring && !file) {
      router.replace('/');
    }
  }, [file, isRestoring, router]);

  const columns = useMemo(() => {
    if (!sheet) return [];
    // If user has selected columns in the sidebar, only show those
    const baseColumns = selectedColumns.length > 0 
      ? sheet.columns.filter(col => selectedColumns.includes(col.key))
      : sheet.columns;

    return baseColumns.map(col => ({
      value: col.key,
      label: col.name,
      type: col.type
    }));
  }, [sheet, selectedColumns]);

  const numericColumns = useMemo(() => {
    return columns.filter(col => 
      ['number', 'currency', 'percentage'].includes(col.type)
    );
  }, [columns]);

  const [config, setChartConfig] = useState<ChartConfig>({
    id: 'studio-chart',
    type: 'bar',
    title: 'New Visualization',
    xColumn: '',
    yColumn: '',
    groupBy: null,
    colorBy: null,
    aggregation: 'mean',
    filters: {},
    options: {}
  });

  // Sync state from query parameters if loaded
  useEffect(() => {
    const x = searchParams?.get('x');
    const y = searchParams?.get('y');
    const type = searchParams?.get('type') as ChartType | null;
    const title = searchParams?.get('title');
    const colorBy = searchParams?.get('colorBy');
    const groupBy = searchParams?.get('groupBy');

    if (x || y || type || title || colorBy || groupBy) {
      setChartConfig(prev => ({
        ...prev,
        xColumn: x || prev.xColumn,
        yColumn: y || prev.yColumn,
        type: type || prev.type,
        title: title || prev.title,
        colorBy: colorBy === 'none' ? null : (colorBy || prev.colorBy),
        groupBy: groupBy || prev.groupBy
      }));
    }
  }, [searchParams]);

  const handleTypeChange = (type: ChartType) => {
    const numericKeys = sheet?.columns
      .filter(c => ['number', 'currency', 'percentage'].includes(c.type))
      .map(c => c.key) ?? [];

    setChartConfig(prev => ({
      ...prev,
      type,
      yColumn: type === 'radar' ? (numericKeys[0] ?? '') : prev.yColumn,
      groupBy: ['heatmap', 'sankey'].includes(type) ? prev.groupBy || (numericColumns[0]?.value ?? null) : null,
      colorBy: type === 'treemap' ? prev.colorBy || null : null,
      options: type === 'radar' ? { radarKeys: numericKeys } : {}
    }));
  };

  const axisLabels = useMemo(() => {
    switch (config.type) {
      case 'heatmap':
        return { x: 'X Dimension', y: 'Y Dimension', value: 'Value (Numeric)' };
      case 'sankey':
        return { x: 'Source', y: 'Target', value: 'Flow Value' };
      case 'treemap':
        return { x: 'Label', y: 'Value (Numeric)', group: 'Group (Optional)' };
      case 'boxplot':
        return { x: 'Category (Groups)', y: 'Values (Numeric)' };
      case 'radar':
        return { x: 'Profile Label (Optional)', y: 'Numeric Axes (auto)' };
      case 'waterfall':
        return { x: 'Step / Category', y: 'Value (Numeric)' };
      case 'pie':
        return { x: 'Category Column', y: 'Value Column' };
      default:
        return { x: 'X-Axis (Dimension)', y: 'Y-Axis (Measure)' };
    }
  }, [config.type]);

  const isConfigValid = useMemo(() => {
    if (!config.xColumn) return false;
    if (config.type === 'radar') return true;
    if (['heatmap', 'sankey'].includes(config.type)) {
      return !!config.yColumn && !!config.groupBy;
    }
    return !!config.yColumn;
  }, [config]);

  const { exportPNG, exportSVG, copyToClipboard, exportingType, isExporting } = useChartExporter({
    chartContainerRef,
    chartTitle: config.title || 'Chart'
  });

  const aiSuggestion = useMemo(() => {
    // Look for a recommendation in AI insights
    return insights.find(i => i.type === 'recommendation')?.description || null;
  }, [insights]);

  if (isRestoring || !file || !sheet) {
    return (
      <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">Restoring session...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-space)] overflow-hidden">
      {/* Left Sidebar - 340px fixed */}
      <aside className="w-[340px] flex-shrink-0 glass-heavy border-r border-[var(--glass-border)] flex flex-col z-20 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--glass-border)] flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-display font-bold text-white">Chart Studio</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Chart Type Picker */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Basic Charts</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {BASIC_CHART_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleTypeChange(item.type)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2.5 p-3 rounded-xl border transition-all duration-300",
                    config.type === item.type 
                      ? "bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,212,255,0.15)]" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    config.type === item.type ? "bg-[var(--accent-cyan)]/20" : "bg-white/5"
                  )}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Advanced & D3</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {ADVANCED_CHART_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleTypeChange(item.type)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2.5 p-3 rounded-xl border transition-all duration-300",
                    config.type === item.type 
                      ? "bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,212,255,0.15)]" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  {item.d3Powered && (
                    <span className="absolute top-1.5 right-1.5 badge badge-violet text-[8px] px-1 py-0 scale-90">
                      D3
                    </span>
                  )}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    config.type === item.type ? "bg-[var(--accent-cyan)]/20" : "bg-white/5"
                  )}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Axis Configuration */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Data Configuration</h3>
            <div className="space-y-4">
              <GlassSelect
                label={axisLabels.x}
                value={config.xColumn || ''}
                onValueChange={(val) => setChartConfig(prev => ({ ...prev, xColumn: val }))}
                options={columns.map(c => ({ value: c.value, label: c.label }))}
                placeholder="Select dimension..."
              />
              
              {config.type !== 'radar' && (
                <GlassSelect
                  label={axisLabels.y}
                  value={config.yColumn || ''}
                  onValueChange={(val) => setChartConfig(prev => ({ ...prev, yColumn: val }))}
                  options={
                    ['boxplot', 'heatmap', 'sankey'].includes(config.type)
                      ? columns.map(c => ({ value: c.value, label: c.label }))
                      : numericColumns.map(c => ({ value: c.value, label: c.label }))
                  }
                  placeholder="Select measure..."
                />
              )}

              {['heatmap', 'sankey'].includes(config.type) && (
                <GlassSelect
                  label={axisLabels.value || 'Value'}
                  value={config.groupBy || ''}
                  onValueChange={(val) => setChartConfig(prev => ({ ...prev, groupBy: val }))}
                  options={numericColumns.map(c => ({ value: c.value, label: c.label }))}
                  placeholder="Select value..."
                />
              )}

              {config.type === 'treemap' && (
                <GlassSelect
                  label={axisLabels.group || 'Group'}
                  value={config.colorBy || 'none'}
                  onValueChange={(val) => setChartConfig(prev => ({ ...prev, colorBy: val === 'none' ? null : val }))}
                  options={[
                    { value: 'none', label: 'None' },
                    ...columns.map(c => ({ value: c.value, label: c.label }))
                  ]}
                  placeholder="Optional grouping..."
                />
              )}

              {config.type === 'radar' && (
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Radar chart uses all numeric columns as axes. Up to 5 data rows are plotted as separate series.
                </p>
              )}
            </div>
          </section>

          {/* Options */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Visual Options</h3>
            <div className="space-y-4">
              <GlassInput
                label="Chart Title"
                value={config.title || ''}
                onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter chart title..."
              />
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1">Color Palette</label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
                  {AXIOM_COLORS.map((color, i) => (
                    <button
                      key={i} 
                      onClick={() => setChartConfig(prev => ({
                        ...prev,
                        options: { ...prev.options, color }
                      }))}
                      className={cn(
                        "w-6 h-6 rounded-full border transition-all duration-200 hover:scale-110 active:scale-95",
                        config.options?.color === color 
                          ? "border-white ring-2 ring-white/20" 
                          : "border-white/20 hover:border-white/40"
                      )}
                      style={{ backgroundColor: color }}
                      title={`Color ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* AI Recommendation */}
          {aiSuggestion && (
            <GlassCard className="p-4 bg-[var(--accent-violet)]/10 border-[var(--accent-violet)]/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-violet)]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--accent-violet)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[var(--accent-violet)] uppercase tracking-wider">AI Suggestion</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiSuggestion}</p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-card)]/30">
        {/* Toolbar */}
        <header className="h-16 flex-shrink-0 border-b border-[var(--glass-border)] flex items-center justify-between px-8 bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Workspace</span>
            <ArrowRight size={12} className="text-slate-600" />
            <span className="text-xs text-white font-medium">{config.title || 'Untitled Visualization'}</span>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              disabled={isExporting || !isConfigValid}
              className="gap-2"
            >
              {exportingType === 'clipboard' ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
              <span className="hidden sm:inline">Copy Image</span>
            </GlassButton>
            
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={exportSVG}
              disabled={isExporting || !isConfigValid}
              className="gap-2"
            >
              {exportingType === 'svg' ? <Loader2 size={16} className="animate-spin" /> : <FileCode size={16} />}
              <span className="hidden sm:inline">Export SVG</span>
            </GlassButton>

            <GlassButton
              variant="primary"
              size="sm"
              onClick={exportPNG}
              disabled={isExporting || !isConfigValid}
              className="gap-2"
            >
              {exportingType === 'png' ? <Loader2 size={16} className="animate-spin" /> : <FileImage size={16} />}
              <span className="hidden sm:inline">Export PNG</span>
            </GlassButton>
          </div>
        </header>

        {/* Chart Canvas */}
        <div className="flex-1 p-8 overflow-auto flex flex-col items-center">
          <div className="w-full max-w-5xl my-auto" ref={chartContainerRef}>
            {isConfigValid ? (
              <ChartCanvas 
                config={config} 
                height={600}
              />
            ) : (
              <GlassCard className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                  <BarChart2 className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Select data to visualize</h2>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Choose the required columns from the left panel to generate your chart.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VisualizePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
          <span className="text-sm text-[var(--text-secondary)] font-medium">Loading Studio...</span>
        </div>
      }
    >
      <VisualizePageContent />
    </Suspense>
  );
}
