import { SheetData } from '@/types/data';
import { OutlierResult } from '@/types/analysis';
import { detectOutliers, classifyOutlierSeverity } from './stats';

export { classifyOutlierSeverity };

/**
 * Detects anomalies in a sheet by checking for outliers in all numeric columns.
 */
export function detectSheetAnomalies(sheet: SheetData): OutlierResult[] {
  const numericColumns = sheet.columns.filter(col => col.type === 'number');
  const allOutliers: OutlierResult[] = [];

  numericColumns.forEach(col => {
    const values = sheet.rows.map(row => row[col.key]);
    const outliers = detectOutliers(values.filter((v): v is NonNullable<typeof v> => v !== undefined), 'iqr');
    
    outliers.forEach(outlier => {
      allOutliers.push({
        ...outlier,
        columnKey: col.key
      });
    });
  });

  // Deduplicate by rowIndex, keeping the one with the highest severity
  const severityMap: Record<OutlierResult['severity'], number> = { high: 3, medium: 2, low: 1 };
  const uniqueOutliers = new Map<number, OutlierResult>();

  allOutliers.forEach(outlier => {
    const existing = uniqueOutliers.get(outlier.rowIndex);
    if (!existing || severityMap[outlier.severity] > severityMap[existing.severity]) {
      uniqueOutliers.set(outlier.rowIndex, outlier);
    }
  });

  // Convert to array and sort
  return Array.from(uniqueOutliers.values()).sort((a, b) => {
    // Sort by severity desc (high > medium > low)
    const severityDiff = severityMap[b.severity] - severityMap[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by rowIndex asc
    return a.rowIndex - b.rowIndex;
  });
}
