import * as ss from 'simple-statistics';
import { CellValue } from '@/types/data';
import { DescriptiveStats, OutlierResult } from '@/types/analysis';

/**
 * Extracts finite numbers from an array of CellValues.
 */
export function extractNumbers(values: CellValue[]): number[] {
  return values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

/**
 * Computes descriptive statistics for a column of values.
 * Returns null if fewer than 2 numeric values are present.
 */
export function describeColumn(values: CellValue[]): DescriptiveStats | null {
  const numbers = extractNumbers(values);
  if (numbers.length < 2) return null;

  const count = numbers.length;
  const mean = ss.mean(numbers);
  const median = ss.median(numbers);
  const mode = ss.mode(numbers);
  const stdDev = ss.sampleStandardDeviation(numbers);
  const variance = ss.sampleVariance(numbers);
  const min = ss.min(numbers);
  const max = ss.max(numbers);
  const range = max - min;
  const q1 = ss.quantile(numbers, 0.25);
  const q3 = ss.quantile(numbers, 0.75);
  const iqr = q3 - q1;
  const skewness = numbers.length >= 3 ? ss.sampleSkewness(numbers) : 0;
  const kurtosis = numbers.length >= 4 ? ss.sampleKurtosis(numbers) : 0;
  
  // Coefficient of Variation: (stdDev / |mean|) * 100
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  return {
    count,
    mean,
    median,
    mode,
    stdDev,
    variance,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
    skewness,
    kurtosis,
    cv
  };
}

/**
 * Computes the Pearson correlation coefficient between two columns.
 * Returns null if fewer than 3 valid pairs are found.
 */
export function computeCorrelation(colA: CellValue[], colB: CellValue[]): number | null {
  const pairs: [number, number][] = [];
  const minLen = Math.min(colA.length, colB.length);

  for (let i = 0; i < minLen; i++) {
    const valA = colA[i];
    const valB = colB[i];
    if (
      typeof valA === 'number' && Number.isFinite(valA) &&
      typeof valB === 'number' && Number.isFinite(valB)
    ) {
      pairs.push([valA, valB]);
    }
  }

  if (pairs.length < 3) return null;

  try {
    const x = pairs.map(p => p[0]);
    const y = pairs.map(p => p[1]);
    return ss.sampleCorrelation(x, y);
  } catch (e) {
    return null;
  }
}

/**
 * Classifies outlier severity based on Z-Score.
 */
export function classifyOutlierSeverity(zScore: number): 'low' | 'medium' | 'high' {
  const absZ = Math.abs(zScore);
  if (absZ > 4) return 'high';
  if (absZ > 3) return 'medium';
  return 'low';
}

/**
 * Detects outliers in a numeric column using Z-Score or IQR methods.
 */
export function detectOutliers(values: CellValue[], method: 'zscore' | 'iqr'): OutlierResult[] {
  const numbers = extractNumbers(values);
  if (numbers.length === 0) return [];

  const results: OutlierResult[] = [];
  
  if (method === 'zscore') {
    if (numbers.length < 2) return [];
    const mean = ss.mean(numbers);
    const stdDev = ss.sampleStandardDeviation(numbers);
    
    if (stdDev === 0) return [];

    values.forEach((val, rowIndex) => {
      if (typeof val === 'number' && Number.isFinite(val)) {
        const zScore = (val - mean) / stdDev;
        const absZ = Math.abs(zScore);
        
        if (absZ > 3) {
          results.push({
            rowIndex,
            value: val,
            zScore,
            method: 'zscore',
            severity: classifyOutlierSeverity(zScore)
          });
        }
      }
    });
  } else {
    // IQR method
    if (numbers.length < 4) return [];
    const q1 = ss.quantile(numbers, 0.25);
    const q3 = ss.quantile(numbers, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // For z-score severity in IQR method, we still need mean/stdDev
    const mean = ss.mean(numbers);
    const stdDev = ss.sampleStandardDeviation(numbers);

    values.forEach((val, rowIndex) => {
      if (typeof val === 'number' && Number.isFinite(val)) {
        if (val < lowerBound || val > upperBound) {
          const zScore = stdDev !== 0 ? (val - mean) / stdDev : 0;
          
          results.push({
            rowIndex,
            value: val,
            zScore,
            method: 'iqr',
            severity: classifyOutlierSeverity(zScore)
          });
        }
      }
    });
  }

  return results;
}

/**
 * Computes frequency distribution for categorical or numeric values.
 */
export function computeFrequencyDistribution(
  values: CellValue[], 
  maxBins?: number
): Array<{ label: string; count: number; pct: number }> {
  // Filter out null/undefined
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length === 0) return [];

  const isNumeric = validValues.every(v => typeof v === 'number');

  if (isNumeric) {
    const numbers = validValues as number[];
    const min = ss.min(numbers);
    const max = ss.max(numbers);
    
    if (min === max) {
      return [{ label: min.toString(), count: numbers.length, pct: 100 }];
    }

    // Use Sturges' rule to determine number of bins if not specified
    // Sturges' rule: k = ceil(log2(n) + 1)
    const sturgesBins = Math.ceil(Math.log2(numbers.length) + 1);
    const numBins = maxBins || Math.min(10, sturgesBins);
    
    const binSize = (max - min) / numBins;
    const bins = Array.from({ length: numBins }, (_, i) => ({
      min: min + i * binSize,
      max: min + (i + 1) * binSize,
      count: 0
    }));

    numbers.forEach(n => {
      let binIndex = Math.floor((n - min) / binSize);
      if (binIndex >= numBins) binIndex = numBins - 1;
      const bin = bins[binIndex];
      if (bin) {
        bin.count++;
      }
    });

    return bins.map(b => ({
      label: `${b.min.toFixed(2)} - ${b.max.toFixed(2)}`,
      count: b.count,
      pct: (b.count / numbers.length) * 100
    }));
  } else {
    // Categorical
    const counts = new Map<string, number>();
    validValues.forEach(v => {
      const label = String(v);
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    const limit = maxBins || 20;
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([label, count]) => ({
      label,
      count,
      pct: (count / validValues.length) * 100
    }));
  }
}

/**
 * Builds a correlation matrix for the given columns.
 */
export function buildCorrelationMatrix(
  columns: Array<{ key: string; values: CellValue[] }>
): Array<{ colA: string; colB: string; r: number | null }> {
  const matrix: Array<{ colA: string; colB: string; r: number | null }> = [];

  for (let i = 0; i < columns.length; i++) {
    for (let j = 0; j < columns.length; j++) {
      const colA = columns[i];
      const colB = columns[j];
      
      const r = computeCorrelation(colA?.values ?? [], colB?.values ?? []);
      matrix.push({
        colA: colA?.key ?? '',
        colB: colB?.key ?? '',
        r
      });
    }
  }

  return matrix;
}
