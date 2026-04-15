export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'area' 
  | 'pie' 
  | 'scatter' 
  | 'heatmap' 
  | 'treemap' 
  | 'radar' 
  | 'waterfall' 
  | 'sankey' 
  | 'boxplot' 
  | 'candlestick' 
  | 'geo' 
  | 'network' 
  | 'gantt';

// Using Record<string, unknown> because filters and options can have arbitrary keys/values 
// depending on the specific chart implementation and user preferences.
export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xColumn: string | null;
  yColumn: string | null;
  groupBy: string | null;
  colorBy: string | null;
  aggregation: 'sum' | 'mean' | 'count' | 'min' | 'max';
  filters: Record<string, unknown>;
  options: Record<string, unknown>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  group?: string;
  color?: string;
}

export interface AxisConfig {
  column: string;
  label: string;
  type: 'linear' | 'log' | 'time' | 'category';
}
