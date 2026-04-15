export const CHART_TYPES = {
  bar: { label: 'Bar Chart', icon: 'BarChart3', requiresX: true, requiresY: true, bestFor: ['Comparisons', 'Categories'], minColumns: 2, requiresNumericY: true },
  line: { label: 'Line Chart', icon: 'LineChart', requiresX: true, requiresY: true, bestFor: ['Trends', 'Time series'], minColumns: 2, requiresNumericY: true },
  area: { label: 'Area Chart', icon: 'AreaChart', requiresX: true, requiresY: true, bestFor: ['Volume trends', 'Time series'], minColumns: 2, requiresNumericY: true },
  pie: { label: 'Pie Chart', icon: 'PieChart', requiresX: true, requiresY: true, bestFor: ['Proportions', 'Percentages'], minColumns: 2, requiresNumericY: true },
  scatter: { label: 'Scatter Plot', icon: 'ScatterChart', requiresX: true, requiresY: true, bestFor: ['Correlations', 'Distributions'], minColumns: 2, requiresNumericY: true },
  heatmap: { label: 'Heatmap', icon: 'Grid3X3', requiresX: true, requiresY: true, bestFor: ['Density', 'Correlations'], minColumns: 3, requiresNumericY: true },
  treemap: { label: 'Treemap', icon: 'LayoutGrid', requiresX: true, requiresY: true, bestFor: ['Hierarchies', 'Proportions'], minColumns: 2, requiresNumericY: true },
  radar: { label: 'Radar Chart', icon: 'Radar', requiresX: true, requiresY: true, bestFor: ['Multi-variable comparisons', 'Profiles'], minColumns: 2, requiresNumericY: true },
  waterfall: { label: 'Waterfall', icon: 'Activity', requiresX: true, requiresY: true, bestFor: ['Cumulative effects', 'Financials'], minColumns: 2, requiresNumericY: true },
  sankey: { label: 'Sankey Diagram', icon: 'GitMerge', requiresX: true, requiresY: true, bestFor: ['Flows', 'Transfers'], minColumns: 3, requiresNumericY: true },
  boxplot: { label: 'Box Plot', icon: 'BoxSelect', requiresX: true, requiresY: true, bestFor: ['Distributions', 'Outliers'], minColumns: 2, requiresNumericY: true },
  candlestick: { label: 'Candlestick', icon: 'CandlestickChart', requiresX: true, requiresY: true, bestFor: ['Financials', 'Stock ranges'], minColumns: 5, requiresNumericY: true },
  geo: { label: 'Geo Map', icon: 'Map', requiresX: true, requiresY: true, bestFor: ['Geographical data', 'Regions'], minColumns: 2, requiresNumericY: true },
  network: { label: 'Network Graph', icon: 'Network', requiresX: true, requiresY: true, bestFor: ['Relationships', 'Connections'], minColumns: 2, requiresNumericY: false },
  gantt: { label: 'Gantt Chart', icon: 'CalendarDays', requiresX: true, requiresY: true, bestFor: ['Project schedules', 'Timelines'], minColumns: 3, requiresNumericY: false }
} as const;

export type ChartType = keyof typeof CHART_TYPES;

export const AXIOM_COLORS = [
  '#6C63FF', 
  '#00D4FF', 
  '#39FF14', 
  '#FFB627', 
  '#FF4757', 
  '#A855F7', 
  '#F97316', 
  '#10B981'
];

export function getChartColor(index: number): string {
  return AXIOM_COLORS[index % AXIOM_COLORS.length]!;
}
