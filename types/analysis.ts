import { Column, CellValue } from './data';

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode: number | number[];
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  cv: number; // Coefficient of Variation
}

export interface OutlierResult {
  rowIndex: number;
  value: number;
  zScore: number;
  method: 'zscore' | 'iqr';
  severity: 'low' | 'medium' | 'high';
}

export interface CorrelationEntry {
  colA: string;
  colB: string;
  r: number;
  pValue: number | null;
}

export interface ColumnProfile {
  column: Column;
  stats: DescriptiveStats | null;
  outliers: OutlierResult[];
  frequencyDistribution: Array<{ label: string; count: number; pct: number }>;
  topValues: Array<{ value: CellValue; count: number }>;
}

export interface ClusterResult {
  k: number;
  assignments: number[];
  centroids: number[][];
  inertia: number;
  silhouetteScore: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predictions: number[];
  residuals: number[];
  equation: string;
}
