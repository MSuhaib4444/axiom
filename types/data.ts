export type CellValue = string | number | boolean | Date | null;

export type ColumnType = 
  | 'string' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'currency' 
  | 'percentage' 
  | 'email' 
  | 'url' 
  | 'phone' 
  | 'id' 
  | 'category' 
  | 'mixed' 
  | 'empty';

export interface Column {
  key: string;
  name: string;
  type: ColumnType;
  index: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: CellValue[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  qualityScore: number; // 0-100
}

export interface SheetData {
  name: string;
  columns: Column[];
  rows: Record<string, CellValue>[];
  rowCount: number;
  columnCount: number;
  hasHeader: boolean;
}

export interface ParsedFile {
  name: string;
  size: number;
  type: string;
  sheets: SheetData[];
  activeSheet: string;
  parsedAt: Date;
}

export interface DataStats {
  totalRows: number;
  totalColumns: number;
  totalNulls: number;
  totalDuplicates: number;
  memoryUsageMB: number;
  qualityScore: number;
}
