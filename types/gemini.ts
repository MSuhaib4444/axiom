import { ChartConfig, ChartType } from './charts';

export interface GeminiAnalysis {
  summary: string;
  keyInsights: string[];
  suggestedCharts: Array<{
    type: ChartType;
    xColumn: string;
    yColumn: string;
    title: string;
    reason: string;
  }>;
  dataQualityIssues: Array<{
    column: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  overallQualityScore: number;
  suggestedNextSteps: string[];
}

export interface GeminiQueryResponse {
  answer: string;
  chartConfig: ChartConfig | null;
}

export interface CleaningRecommendation {
  column: string;
  action: 'fill_mean' | 'fill_median' | 'fill_mode' | 'drop_column' | 'normalize' | 'flag_review';
  reason: string;
  affectedRows: number;
}

export interface GeminiError {
  code: 'rate_limit' | 'timeout' | 'unavailable' | 'parse_error';
  message: string;
  retryAfter: number | null;
}
