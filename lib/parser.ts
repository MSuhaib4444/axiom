import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParsedFile, SheetData, Column, CellValue } from '@/types/data';
import { inferColumnType, computeColumnStats } from './columnInference';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

async function parseExcel(file: File): Promise<ParsedFile> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true, raw: false });

    const sheets: SheetData[] = [];
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;
      // Using `unknown[][]` cast because XLSX doesn't provide strict types for header: 1
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
      sheets.push(buildSheetData(sheetName, rawData));
    }

    if (sheets.length === 0) {
      throw new ParseError('Excel file contains no sheets or valid data.');
    }

    const firstSheetName = sheets[0]?.name || '';

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      sheets,
      activeSheet: firstSheetName,
      parsedAt: new Date()
    };
  } catch (error) {
    if (error instanceof ParseError) throw error;
    throw new ParseError(`Failed to parse Excel file: ${(error as Error).message}`);
  }
}

function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: false,
      complete: (results) => {
        try {
          if (results.errors.length > 0 && results.data.length === 0) {
             throw new ParseError(`CSV Parse Error: ${results.errors[0]?.message}`);
          }
          
          const fields = results.meta.fields || [];
          // Force string keys based on PapaParse typing for header: true
          const rows = results.data as Record<string, unknown>[];
          
          const columns = buildColumns(rows, fields);
          
          let title = file.name;
          const lastDotIdx = title.lastIndexOf('.');
          if (lastDotIdx > 0) {
            title = title.substring(0, lastDotIdx);
          }

          const sheet: SheetData = {
            name: title,
            columns,
            rows: rows as Record<string, CellValue>[],
            rowCount: rows.length,
            columnCount: columns.length,
            hasHeader: fields.length > 0
          };

          const parsedFile: ParsedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            sheets: [sheet],
            activeSheet: title,
            parsedAt: new Date()
          };

          resolve(parsedFile);
        } catch (error) {
          reject(error instanceof ParseError ? error : new ParseError(`Error processing CSV data: ${(error as Error).message}`));
        }
      },
      error: (error) => {
        reject(new ParseError(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const maxSizeStr = process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '50';
  const MAX_SIZE_MB = Number(maxSizeStr);
  
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new ParseError(`File size exceeds the maximum limit of ${MAX_SIZE_MB}MB.`);
  }

  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    return parseCSV(file);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb') || name.endsWith('.ods')) {
    return parseExcel(file);
  }

  throw new ParseError(`Unrecognized file extension for file: ${file.name}`);
}

function buildSheetData(name: string, raw: unknown[][]): SheetData {
  if (raw.length === 0) {
    return {
      name,
      columns: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      hasHeader: false
    };
  }

  const rawHeaderRow = raw[0];
  if (!rawHeaderRow) {
    return {
      name,
      columns: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      hasHeader: false
    };
  }

  const headers: string[] = [];
  for (let i = 0; i < rawHeaderRow.length; i++) {
    const val = rawHeaderRow[i];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      headers.push(String(val).trim());
    } else {
      headers.push(`Column_${i + 1}`);
    }
  }

  // Ensure unique headers
  const uniqueHeaders: string[] = [];
  const headerCounts: Record<string, number> = {};
  for (const header of headers) {
    if (headerCounts[header]) {
      const newHeader = `${header}_${headerCounts[header]}`;
      uniqueHeaders.push(newHeader);
      headerCounts[header]++;
      headerCounts[newHeader] = 1;
    } else {
      uniqueHeaders.push(header);
      headerCounts[header] = 1;
    }
  }

  const rawRows = raw.slice(1);
  const rows: Record<string, CellValue>[] = [];

  for (const r of rawRows) {
    if (!r || r.length === 0) continue;
    const isAllNull = r.every((val) => val === null || val === undefined || val === '');
    if (isAllNull) continue;

    const rowObj: Record<string, CellValue> = {};
    for (let i = 0; i < uniqueHeaders.length; i++) {
      const header = uniqueHeaders[i];
      if (!header) continue;
      
      const val = i < r.length ? r[i] : null;
      rowObj[header] = isValidCellValue(val) ? val as CellValue : String(val);
    }
    rows.push(rowObj);
  }

  const columns = buildColumns(rows, uniqueHeaders);

  return {
    name,
    columns,
    rows,
    rowCount: rows.length,
    columnCount: columns.length,
    hasHeader: true
  };
}

function isValidCellValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return true;
  if (val instanceof Date) return true;
  return false;
}

function buildColumns(rows: Record<string, unknown>[], headerOrder?: string[]): Column[] {
  const keysSet = new Set<string>();
  if (headerOrder && headerOrder.length > 0) {
    for (const h of headerOrder) keysSet.add(h);
  } else {
    for (const r of rows) {
      for (const k of Object.keys(r)) {
        keysSet.add(k);
      }
    }
  }

  const keys = Array.from(keysSet);
  const columns: Column[] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] || `Column_${i}`;

    const values = rows.map((r) => r[key] as CellValue);
    
    let nullCount = 0;
    const uniqueVals = new Set<string>();
    const sampleValues: CellValue[] = [];

    for (const v of values) {
      if (v === null || v === undefined || String(v).trim() === '') {
        nullCount++;
      } else {
        uniqueVals.add(String(v).trim());
      }
      if (sampleValues.length < 5 && v !== null && v !== undefined && String(v).trim() !== '') {
        sampleValues.push(v);
      }
    }

    const uniqueCount = uniqueVals.size;
    const type = inferColumnType(values);
    const stats = computeColumnStats(values, type);

    const validCount = rows.length - nullCount;
    const completeness = rows.length > 0 ? validCount / rows.length : 0;
    const diversityRatio = validCount > 0 ? uniqueCount / validCount : 0;
    
    const qualityScore = Math.round((completeness * 60) + (diversityRatio * 40));

    columns.push({
      key,
      name: key,
      type,
      index: i,
      nullCount,
      uniqueCount,
      sampleValues,
      qualityScore: Math.min(100, Math.max(0, qualityScore)),
      ...stats
    });
  }

  return columns;
}
