import { CellValue, ColumnType, Column } from '@/types/data';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const PHONE_REGEX = /^\+?[\d\s\-\(\).]{7,20}$/;

export function inferColumnType(values: CellValue[]): ColumnType {
  if (values.length === 0) return 'empty';
  
  let validCount = 0;
  let numberCount = 0;
  let currencyCount = 0;
  let percentageCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  let emailCount = 0;
  let urlCount = 0;
  let phoneCount = 0;

  const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
  validCount = validValues.length;

  if (validCount === 0) return 'empty';

  const uniqueValues = new Set(validValues.map(v => String(v).trim().toLowerCase()));

  for (const v of validValues) {
    const s = String(v).trim();
    const sl = s.toLowerCase();

    if (typeof v === 'boolean' || ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'].includes(sl)) {
      booleanCount++;
      continue;
    }

    if (typeof v === 'number' || (s !== '' && !isNaN(Number(s)))) {
      numberCount++;
      continue;
    }

    if (/^[$€£¥]\s?-?[\d,.]+|-?[\d,.]+\s?[$€£¥]$/.test(s) && !isNaN(Number(s.replace(/[^0-9.-]+/g, '')))) {
      currencyCount++;
      continue;
    }

    if (/^-?[\d,.]+%$/.test(s) && !isNaN(Number(s.replace(/[^0-9.-]+/g, '')))) {
      percentageCount++;
      continue;
    }

    if (v instanceof Date && !isNaN(v.getTime())) {
      dateCount++;
      continue;
    }
    
    if ((s.includes('/') || s.includes('-')) && s.length >= 6) {
      const parsedDate = new Date(s);
      if (!isNaN(parsedDate.getTime())) {
        dateCount++;
        continue;
      }
    }

    if (EMAIL_REGEX.test(s)) {
      emailCount++;
      continue;
    }

    if (URL_REGEX.test(s)) {
      urlCount++;
      continue;
    }

    if (PHONE_REGEX.test(s) && (s.includes('-') || s.includes('(') || s.includes('+') || s.length >= 10)) {
      phoneCount++;
      continue;
    }
  }

  const threshold = 0.8;
  if (numberCount / validCount > threshold) return 'number';
  if (currencyCount / validCount > threshold) return 'currency';
  if (percentageCount / validCount > threshold) return 'percentage';
  if (dateCount / validCount > threshold) return 'date';
  if (booleanCount / validCount > threshold) return 'boolean';
  if (emailCount / validCount > threshold) return 'email';
  if (urlCount / validCount > threshold) return 'url';
  if (phoneCount / validCount > threshold) return 'phone';

  const uniqueRatio = uniqueValues.size / validCount;
  if (uniqueRatio < 0.15 && uniqueValues.size < 30) return 'category';

  if ((numberCount + currencyCount + percentageCount + booleanCount + dateCount) / validCount > 0.8) {
    return 'mixed';
  }

  return 'string';
}

export function computeColumnStats(values: CellValue[], type: ColumnType): Partial<Column> {
  const stats: Partial<Column> = {};
  
  if (isNumericType(type)) {
    const nums: number[] = [];
    for (const v of values) {
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'number') {
        nums.push(v);
      } else {
        const parsed = Number(String(v).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(parsed)) nums.push(parsed);
      }
    }

    if (nums.length > 0) {
      nums.sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const min = nums[0]!;
      const max = nums[nums.length - 1]!;
      const mean = sum / nums.length;
      
      const mid = Math.floor(nums.length / 2);
      const median = nums.length % 2 !== 0 ? nums[mid]! : (nums[mid - 1]! + nums[mid]!) / 2;
      
      const squaredDiffs = nums.map(n => Math.pow(n - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / nums.length;
      const stdDev = Math.sqrt(variance);

      stats.min = min;
      stats.max = max;
      stats.mean = mean; // Corrected typo in thought
      stats.median = median;
      stats.stdDev = stdDev;
    }
  }

  return stats;
}

export function isNumericType(type: string): boolean {
  return type === 'number' || type === 'currency' || type === 'percentage';
}
