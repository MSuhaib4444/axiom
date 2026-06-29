import { ColumnType, CellValue } from '@/types/data';

export function formatDate(date: Date | string | number | boolean | null | undefined, style: 'short' | 'long' | 'iso' = 'short'): string {
  if (date === null || date === undefined || date === '') return '—';
  if (typeof date === 'boolean') return String(date);
  
  let d: Date;
  
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'number') {
    // Excel serial number (days since 1900-01-01 roughly)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    d = new Date(excelEpoch.getTime() + date * 86400000);
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return String(date);

  if (style === 'iso') {
    return d.toISOString();
  } else if (style === 'long') {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(d);
  } else {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(d);
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '—';
  return (value * 100).toFixed(decimals) + '%';
}

export function formatColumnType(type: ColumnType): string {
  const map: Record<ColumnType, string> = {
    number: 'Numeric',
    string: 'Text',
    date: 'Date',
    boolean: 'Boolean',
    currency: 'Currency',
    percentage: 'Percentage',
    email: 'Email',
    url: 'URL',
    phone: 'Phone',
    id: 'ID',
    category: 'Category',
    mixed: 'Mixed',
    empty: 'Empty'
  };
  return map[type] || type;
}

export function getColumnTypeIcon(type: ColumnType): string {
  const map: Record<ColumnType, string> = {
    number: '#',
    string: 'T',
    date: '📅',
    boolean: '☑',
    currency: '$',
    percentage: '%',
    email: '@',
    url: '🔗',
    phone: '📞',
    id: 'ID',
    category: '◈',
    mixed: '?',
    empty: '∅'
  };
  return map[type] || '?';
}

/** Converts a cell value to a chart-safe axis label (never returns a Date object). */
export function toChartAxisValue(
  value: CellValue,
  columnType?: ColumnType,
  options?: { sortable?: boolean }
): string | number {
  if (value === null || value === undefined) return '';

  const isDate = columnType === 'date' || value instanceof Date;
  if (isDate) {
    if (options?.sortable) {
      const iso = formatDate(value, 'iso');
      return iso.split('T')[0] ?? iso;
    }
    return formatDate(value, 'short');
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return String(value);
}

/** Converts a cell value to a numeric chart measure. */
export function toChartNumericValue(value: CellValue, columnType?: ColumnType): number {
  if (value === null || value === undefined) return NaN;

  if (columnType === 'date' || value instanceof Date) {
    const d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime()) ? NaN : d.getTime();
  }

  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Safely formats any Recharts tooltip / axis label for React rendering. */
export function formatChartLabel(label: unknown): string {
  if (label === null || label === undefined) return '';
  if (label instanceof Date) return formatDate(label, 'short');
  if (typeof label === 'object') return String(label);
  return String(label);
}

export function formatCellValue(value: CellValue, type: ColumnType): string {
  if (value === null || value === undefined || value === '') return '—';

  switch (type) {
    case 'number':
      if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
      const parsedNum = Number(value);
      return !isNaN(parsedNum) ? new Intl.NumberFormat('en-US').format(parsedNum) : String(value);
    case 'currency':
      if (typeof value === 'number') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
      const parsedCurr = Number(String(value).replace(/[^0-9.-]+/g, ''));
      return !isNaN(parsedCurr) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsedCurr) : String(value);
    case 'percentage':
      if (typeof value === 'number') return formatPercentage(value);
      const parsedPct = Number(String(value).replace(/[^0-9.-]+/g, ''));
      return !isNaN(parsedPct) ? formatPercentage(parsedPct) : String(value);
    case 'date':
      return typeof value === 'boolean' ? String(value) : formatDate(value);
    case 'boolean':
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      const strVal = String(value).toLowerCase().trim();
      if (['true', 'yes', '1', 'y', 't'].includes(strVal)) return 'Yes';
      if (['false', 'no', '0', 'n', 'f'].includes(strVal)) return 'No';
      return String(value);
    default:
      return String(value);
  }
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'low':
    case 'info':
      return 'var(--accent-cyan)';
    case 'medium':
    case 'warning':
      return 'var(--accent-amber)';
    case 'high':
    case 'critical':
      return 'var(--accent-red)';
    default:
      return 'var(--text-secondary)';
  }
}
