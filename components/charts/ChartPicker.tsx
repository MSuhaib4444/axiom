'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useDataStore } from '@/store/dataStore';
import { ChartType, ChartConfig } from '@/types/charts';
import { ChartRecommendation } from '@/lib/gemini';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import {
  BarChart2,
  LineChart,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  ScatterChart as ScatterChartIcon,
  Wand2,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface ChartPickerProps {
  onConfigChange: (config: ChartConfig) => void;
}

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar',     label: 'Bar Chart',    icon: <BarChart2 size={20} /> },
  { type: 'line',    label: 'Line Chart',   icon: <LineChart size={20} /> },
  { type: 'area',    label: 'Area Chart',   icon: <AreaChartIcon size={20} /> },
  { type: 'pie',     label: 'Pie Chart',    icon: <PieChartIcon size={20} /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChartIcon size={20} /> },
];

const CHART_TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  bar:     <BarChart2 size={16} />,
  line:    <LineChart size={16} />,
  area:    <AreaChartIcon size={16} />,
  pie:     <PieChartIcon size={16} />,
  scatter: <ScatterChartIcon size={16} />,
};

const CHART_TYPE_COLOR_MAP: Record<string, string> = {
  bar:     'var(--accent-violet)',
  line:    'var(--accent-cyan)',
  area:    'var(--accent-green)',
  pie:     'var(--accent-amber)',
  scatter: 'var(--accent-red)',
};

type AiPanelState = 'idle' | 'loading' | 'success' | 'error';

export const ChartPicker: React.FC<ChartPickerProps> = ({ onConfigChange }) => {
  const { getActiveSheetData, selectedColumns } = useDataStore();
  const sheet = getActiveSheetData();

  const [selectedType, setSelectedType] = useState<ChartType>('bar');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');

  // AI recommendations state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiState, setAiState] = useState<AiPanelState>('idle');
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [aiError, setAiError] = useState<string>('');
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const columns = useMemo(() => {
    if (!sheet) return [];
    const baseColumns = selectedColumns.length > 0
      ? sheet.columns.filter(col => selectedColumns.includes(col.key))
      : sheet.columns;
    return baseColumns.map(col => ({ value: col.key, label: col.name, type: col.type }));
  }, [sheet, selectedColumns]);

  const numericColumns = useMemo(() =>
    columns.filter(col => ['number', 'currency', 'percentage'].includes(col.type)),
    [columns]
  );

  // Helper: map a column key → display name
  const colName = useCallback(
    (key: string) => sheet?.columns.find(c => c.key === key)?.name ?? key,
    [sheet]
  );

  const handleGenerate = () => {
    if (!xColumn || !yColumn) return;
    const xInfo = sheet?.columns.find(c => c.key === xColumn);
    const yInfo = sheet?.columns.find(c => c.key === yColumn);
    onConfigChange({
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      title: `${yInfo?.name ?? yColumn} by ${xInfo?.name ?? xColumn}`,
      xColumn,
      yColumn,
      groupBy: null,
      colorBy: null,
      aggregation: 'mean',
      filters: {},
      options: {},
    });
  };

  // ─── AI Recommendations ───────────────────────────────────────────────────

  const fetchRecommendations = async () => {
    if (!sheet) return;
    setAiPanelOpen(true);
    setAiState('loading');
    setRecommendations([]);
    setAiError('');
    setAppliedIndex(null);

    try {
      const res = await fetch('/api/gemini/chart-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.status === 429) {
        setAiError('Rate limit reached. Please wait a moment and try again.');
        setAiState('error');
        return;
      }
      if (!res.ok) {
        setAiError(`Server error (${res.status}). Please try again.`);
        setAiState('error');
        return;
      }

      const data = await res.json() as { recommendations: ChartRecommendation[] };
      if (!data.recommendations || data.recommendations.length === 0) {
        setAiError('Gemini could not generate recommendations for this dataset. Try selecting specific columns in the sidebar first.');
        setAiState('error');
        return;
      }

      setRecommendations(data.recommendations);
      setAiState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAiError(msg.includes('timeout') ? 'Request timed out after 30s. Please try again.' : 'Failed to reach the AI service.');
      setAiState('error');
    }
  };

  const applyRecommendation = (rec: ChartRecommendation, idx: number) => {
    setAppliedIndex(idx);
    // Sync manual pickers to match the applied recommendation
    setSelectedType(rec.type);
    setXColumn(rec.xColumn);
    setYColumn(rec.yColumn);

    onConfigChange({
      id: Math.random().toString(36).substr(2, 9),
      type: rec.type,
      title: rec.title,
      xColumn: rec.xColumn,
      yColumn: rec.yColumn,
      groupBy: null,
      colorBy: null,
      aggregation: 'mean',
      filters: {},
      options: {},
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Section 1: Chart Type ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
          1. Select Chart Type
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {CHART_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => setSelectedType(item.type)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300',
                selectedType === item.type
                  ? 'bg-[var(--accent-violet)]/10 border-[var(--accent-violet)] text-[var(--accent-violet)] shadow-[0_0_20px_rgba(108,99,255,0.15)]'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                selectedType === item.type ? 'bg-[var(--accent-violet)]/20' : 'bg-white/5'
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Section 2: Axis Config ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
          2. Configure Axes
        </h4>
        <GlassCard padding="md" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassSelect
            label={selectedType === 'pie' ? 'Category Column' : 'X-Axis (Dimension)'}
            placeholder="Select a column..."
            value={xColumn}
            onValueChange={setXColumn}
            options={columns.map(c => ({ value: c.value, label: c.label }))}
          />
          <GlassSelect
            label={selectedType === 'pie' ? 'Value Column' : 'Y-Axis (Measure)'}
            placeholder="Select a numeric column..."
            value={yColumn}
            onValueChange={setYColumn}
            options={numericColumns.map(c => ({ value: c.value, label: c.label }))}
          />
        </GlassCard>
      </section>

      {/* ── Section 3: Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        <GlassButton
          variant="primary"
          className="flex-1 py-6 h-auto text-base font-bold gap-2"
          onClick={handleGenerate}
          disabled={!xColumn || !yColumn}
        >
          <BarChart2 size={20} />
          Visualize Data
        </GlassButton>

        {/* AI Recommendations trigger */}
        <GlassButton
          variant="ghost"
          className={cn(
            'px-4 py-6 h-auto transition-all duration-300',
            aiPanelOpen
              ? 'text-[var(--accent-cyan)] border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10'
              : 'text-slate-400 hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/30'
          )}
          title="AI Chart Recommendations"
          onClick={aiPanelOpen ? () => setAiPanelOpen(false) : fetchRecommendations}
          disabled={!sheet}
        >
          {aiState === 'loading' ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Wand2 size={20} />
          )}
        </GlassButton>
      </div>

      {/* ── AI Recommendations Panel ── */}
      {aiPanelOpen && (
        <section className="space-y-3 pt-2 border-t border-white/8">

          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent-cyan)]" />
              <span className="text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider">
                AI Recommendations
              </span>
            </div>
            <button
              onClick={() => setAiPanelOpen(false)}
              className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Loading state */}
          {aiState === 'loading' && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl skeleton"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
              <p className="text-[10px] text-slate-500 text-center pt-1">
                Gemini is analysing your columns…
              </p>
            </div>
          )}

          {/* Error state */}
          {aiState === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/15 flex items-center justify-center border border-[var(--accent-red)]/25">
                <AlertTriangle size={18} className="text-[var(--accent-red)]" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">{aiError}</p>
              <GlassButton variant="ghost" size="sm" onClick={fetchRecommendations}>
                Retry
              </GlassButton>
            </div>
          )}

          {/* Success: list of recommendations */}
          {aiState === 'success' && (
            <div className="space-y-2">
              {recommendations.map((rec, idx) => {
                const accent = CHART_TYPE_COLOR_MAP[rec.type] ?? 'var(--accent-violet)';
                const isApplied = appliedIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => applyRecommendation(rec, idx)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all duration-200 group',
                      isApplied
                        ? 'border-[var(--accent-cyan)]/60 bg-[var(--accent-cyan)]/8 shadow-[0_0_16px_rgba(0,212,255,0.12)]'
                        : 'border-white/6 bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/12'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Chart type icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                        style={{
                          background: `${accent}18`,
                          border: `1px solid ${accent}30`,
                          color: accent,
                        }}
                      >
                        {CHART_TYPE_ICON_MAP[rec.type] ?? <BarChart2 size={16} />}
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {rec.title}
                          </span>
                          {isApplied && (
                            <CheckCircle2 size={12} className="flex-shrink-0 text-[var(--accent-cyan)]" />
                          )}
                        </div>
                        {/* Column pill row */}
                        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-md border"
                            style={{ color: accent, background: `${accent}15`, borderColor: `${accent}25` }}
                          >
                            {rec.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {colName(rec.xColumn)}
                          </span>
                          <ChevronRight size={10} className="text-slate-600" />
                          <span className="text-[10px] text-slate-500 font-mono">
                            {colName(rec.yColumn)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                          {rec.reason}
                        </p>
                      </div>

                      {/* Apply arrow */}
                      <ChevronRight
                        size={14}
                        className={cn(
                          'flex-shrink-0 mt-2 transition-all duration-150',
                          isApplied
                            ? 'text-[var(--accent-cyan)]'
                            : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </button>
                );
              })}

              {/* Refresh link */}
              <button
                onClick={fetchRecommendations}
                className="w-full text-center text-[10px] text-slate-600 hover:text-slate-400 transition-colors pt-1 pb-0.5"
              >
                ↻ Regenerate suggestions
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
