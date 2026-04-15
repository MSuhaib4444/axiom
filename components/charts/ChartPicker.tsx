'use client';

import React, { useState, useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { ChartType, ChartConfig } from '@/types/charts';
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
  Wand2
} from 'lucide-react';

interface ChartPickerProps {
  onConfigChange: (config: ChartConfig) => void;
}

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChart2 size={20} /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart size={20} /> },
  { type: 'area', label: 'Area Chart', icon: <AreaChartIcon size={20} /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieChartIcon size={20} /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChartIcon size={20} /> },
];

export const ChartPicker: React.FC<ChartPickerProps> = ({ onConfigChange }) => {
  const { getActiveSheetData, selectedColumns } = useDataStore();
  const sheet = getActiveSheetData();

  const [selectedType, setSelectedType] = useState<ChartType>('bar');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');

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

  const handleGenerate = () => {
    if (!xColumn || !yColumn) return;

    // Use selected columns from sidebar if available, otherwise use full columns
    const xColumnInfo = selectedColumns.length > 0 
      ? sheet?.columns.find(c => c.key === xColumn)
      : sheet?.columns.find(c => c.key === xColumn);
    const yColumnInfo = selectedColumns.length > 0 
      ? sheet?.columns.find(c => c.key === yColumn)
      : sheet?.columns.find(c => c.key === yColumn);

    const config: ChartConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      title: `${yColumnInfo?.name} by ${xColumnInfo?.name}`,
      xColumn,
      yColumn,
      groupBy: null,
      colorBy: null,
      aggregation: 'mean',
      filters: {},
      options: {}
    };

    onConfigChange(config);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">1. Select Chart Type</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {CHART_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => setSelectedType(item.type)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300",
                selectedType === item.type 
                  ? "bg-[var(--accent-violet)]/10 border-[var(--accent-violet)] text-[var(--accent-violet)] shadow-[0_0_20px_rgba(108,99,255,0.15)]" 
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                selectedType === item.type ? "bg-[var(--accent-violet)]/20" : "bg-white/5"
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Axis Configuration */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">2. Configure Axes</h4>
        <GlassCard padding="md" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassSelect
            label={selectedType === 'pie' ? "Category Column" : "X-Axis (Dimension)"}
            placeholder="Select a column..."
            value={xColumn}
            onValueChange={setXColumn}
            options={columns.map(c => ({ value: c.value, label: c.label }))}
          />
          <GlassSelect
            label={selectedType === 'pie' ? "Value Column" : "Y-Axis (Measure)"}
            placeholder="Select a numeric column..."
            value={yColumn}
            onValueChange={setYColumn}
            options={numericColumns.map(c => ({ value: c.value, label: c.label }))}
          />
        </GlassCard>
      </section>

      {/* Section 3: Actions */}
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
        <GlassButton
          variant="ghost"
          className="px-6 py-6 h-auto text-slate-400 hover:text-[var(--accent-cyan)]"
          title="AI Recommended Chart"
          onClick={() => {}} // Future AI integration
        >
          <Wand2 size={20} />
        </GlassButton>
      </div>
    </div>
  );
};
