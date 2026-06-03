import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SheetData } from '@/types/data';
import { 
  GeminiQueryResponse, 
  CleaningRecommendation 
} from '@/types/gemini';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_GEMINI_FALLBACKS = ['gemini-2.5-flash'];

/**
 * Returns a Gemini GenerativeModel instance.
 * Throws if GEMINI_API_KEY is missing.
 */
export function getClient(modelName?: string): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const resolvedModelName = modelName
    || process.env.GEMINI_MODEL
    || process.env.NEXT_PUBLIC_GEMINI_MODEL
    || DEFAULT_GEMINI_MODEL;
  
  return genAI.getGenerativeModel({ model: resolvedModelName });
}

/**
 * Builds a compact context string describing the dataset.
 */
export function buildDataContext(sheet: SheetData, maxRows: number = 100): string {
  const colSummary = sheet.columns.map(col => 
    `- ${col.name} (${col.type}): ${col.nullCount} nulls, ${col.uniqueCount} unique values`
  ).join('\n');

  const sampleRows = sheet.rows.slice(0, maxRows);
  
  return `
Dataset Name: ${sheet.name}
Dimensions: ${sheet.rowCount} rows x ${sheet.columnCount} columns

Column Summaries:
${colSummary}

Sample Data (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}
`.trim();
}

function getQueryModelCandidates(): string[] {
  const primaryModel = process.env.GEMINI_MODEL
    || process.env.NEXT_PUBLIC_GEMINI_MODEL
    || DEFAULT_GEMINI_MODEL;

  const configuredFallbacks = process.env.GEMINI_MODEL_FALLBACKS
    ?.split(',')
    .map(model => model.trim())
    .filter(Boolean);
  const fallbackModels = configuredFallbacks?.length
    ? configuredFallbacks
    : DEFAULT_GEMINI_FALLBACKS;

  return Array.from(new Set([primaryModel, ...fallbackModels]));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === 'number' ? status : null;
  }

  return null;
}

function isRetryableGeminiError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 429 || status === 503) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('503')
    || message.includes('429')
    || message.includes('service unavailable')
    || message.includes('high demand')
    || message.includes('resource exhausted')
    || message.includes('temporarily unavailable')
  );
}

function parseGeminiQueryResponse(text: string): GeminiQueryResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as GeminiQueryResponse;
  }

  return { answer: text, chartConfig: null };
}

function toGeminiChatHistory(history: unknown[]): Array<{
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}> {
  return history.map(item => {
    const roleValue = typeof item === 'object' && item !== null && 'role' in item
      ? (item as { role?: unknown }).role
      : null;
    const contentValue = typeof item === 'object' && item !== null && 'content' in item
      ? (item as { content?: unknown }).content
      : '';

    return {
      role: roleValue === 'user' ? 'user' : 'model',
      parts: [{ text: String(contentValue ?? '') }]
    };
  });
}

/**
 * Streams analysis from Gemini.
 */
export async function streamAnalysis(
  sheet: SheetData, 
  onChunk: (chunk: string) => void
): Promise<void> {
  const model = getClient();
  const context = buildDataContext(sheet);
  
  const prompt = `
You are an expert data analyst. Analyze the following dataset context and provide a structured analysis.
Respond with ONLY valid JSON that matches the GeminiAnalysis type:
{
  "summary": "string",
  "keyInsights": ["string"],
  "suggestedCharts": [{"type": "bar|line|scatter|pie|area", "xColumn": "string", "yColumn": "string", "title": "string", "reason": "string"}],
  "dataQualityIssues": [{"column": "string", "issue": "string", "severity": "low|medium|high", "suggestion": "string"}],
  "overallQualityScore": number (0-100),
  "suggestedNextSteps": ["string"]
}

Dataset Context:
${context}
`.trim();

  const result = await model.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      onChunk(chunkText);
    }
  }
}

/**
 * Queries the dataset using Gemini in a chat-like interface.
 */
export async function queryDataset(
  sheet: SheetData, 
  question: string, 
  history: unknown[] = []
): Promise<GeminiQueryResponse> {
  const context = buildDataContext(sheet);
  const modelCandidates = getQueryModelCandidates();

  const prompt = `
Dataset Context:
${context}

User Question: ${question}

Instructions:
1. Answer the question accurately based on the data.
2. If the user asks for a visualization or if one would be helpful, provide a chartConfig in the JSON response.
3. Respond with ONLY valid JSON in the format:
{
  "answer": "Markdown formatted string answering the question",
  "chartConfig": {
    "type": "bar|line|scatter|pie|area",
    "xKey": "string",
    "yKey": "string",
    "title": "string",
    "colors": ["string"]
  } | null
}
`.trim();
  let lastError: unknown = null;

  for (let i = 0; i < modelCandidates.length; i++) {
    const modelName = modelCandidates[i];

    try {
      const model = getClient(modelName);
      const chat = model.startChat({
        history: toGeminiChatHistory(history),
      });

      const result = await chat.sendMessage(prompt);
      const text = result.response.text();
      return parseGeminiQueryResponse(text);
    } catch (error) {
      lastError = error;
      const hasNextModel = i < modelCandidates.length - 1;

      if (hasNextModel && isRetryableGeminiError(error)) {
        console.warn(
          `Gemini query model "${modelName}" failed with a retryable error, trying fallback model.`,
          error
        );
        continue;
      }

      console.error(`Gemini query error with model "${modelName}":`, error);
      break;
    }
  }

  console.error('Gemini query failed across all candidate models:', modelCandidates, lastError);
  return { 
    answer: "Gemini is temporarily unavailable right now. Please try again in a moment.", 
    chartConfig: null 
  };
}

/**
 * Generates a storytelling narrative report in Markdown.
 */
export async function generateStory(sheet: SheetData, tone: string = 'professional'): Promise<string> {
  const model = getClient();
  const context = buildDataContext(sheet);
  
  const prompt = `
You are a data storyteller. Create a narrative report for the following dataset using a ${tone} tone.
The report should be in Markdown and include:
- Executive Summary
- Key Findings
- Data Quality Assessment
- Recommendations
- Conclusion

Dataset Context:
${context}
`.trim();

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Streams storytelling narrative report in Markdown from Gemini.
 */
export async function streamStory(
  sheet: SheetData,
  tone: string = 'professional',
  onChunk: (chunk: string) => void
): Promise<void> {
  const model = getClient();
  const context = buildDataContext(sheet);
  
  const prompt = `
You are a data storyteller. Create a narrative report for the following dataset using a ${tone} tone.
The report should be in Markdown and include:
- Executive Summary
- Key Findings
- Data Quality Assessment
- Recommendations
- Conclusion

Dataset Context:
${context}
`.trim();

  const result = await model.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      onChunk(chunkText);
    }
  }
}

/**
 * AI-recommended chart configurations based on the dataset's column schema.
 */
export interface ChartRecommendation {
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
  xColumn: string;
  yColumn: string;
  title: string;
  reason: string;
}

export async function getChartRecommendations(sheet: SheetData): Promise<ChartRecommendation[]> {
  const model = getClient();

  // Build a lightweight schema — no sample rows needed, just column metadata
  const columnSchema = sheet.columns.map(col =>
    `key="${col.key}" name="${col.name}" type="${col.type}" unique=${col.uniqueCount} nulls=${col.nullCount}`
  ).join('\n');

  const prompt = `
You are an expert data visualization consultant. Given the following dataset column schema, recommend the best 4–6 charts a user could create.

IMPORTANT RULES:
- xColumn and yColumn MUST be exact key values from the schema (the key= values).
- Only suggest charts where both columns actually exist in the schema.
- For pie charts, xColumn = category column, yColumn = numeric column.
- For scatter, both columns must be numeric.
- Prefer columns with high cardinality for axes, numeric columns for values.
- Vary the chart types across recommendations.

Dataset: ${sheet.name}
Columns:
${columnSchema}

Respond with ONLY a valid JSON array. No markdown fences. No explanation text. Just the raw JSON array:
[
  {
    "type": "bar|line|area|pie|scatter",
    "xColumn": "<exact column key>",
    "yColumn": "<exact column key>",
    "title": "<short descriptive title>",
    "reason": "<one sentence explaining why this chart is insightful>"
  }
]
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as ChartRecommendation[];
    // Filter out any bad recommendations where columns don't exist in the sheet
    const validKeys = new Set(sheet.columns.map(c => c.key));
    return parsed.filter(r =>
      validKeys.has(r.xColumn) && validKeys.has(r.yColumn)
    );
  } catch (error) {
    console.error('Gemini chart recommendations error:', error);
    return [];
  }
}

/**
 * Gets data cleaning recommendations from Gemini.
 */
export async function getCleaningRecommendations(sheet: SheetData): Promise<CleaningRecommendation[]> {
  const model = getClient();
  const context = buildDataContext(sheet);
  
  const prompt = `
Identify data cleaning opportunities for the following dataset.
Respond with ONLY a valid JSON array of CleaningRecommendation objects:
[{
  "column": "string",
  "action": "fill_mean|fill_median|fill_mode|drop_column|normalize|flag_review",
  "reason": "string",
  "affectedRows": number
}]

Dataset Context:
${context}
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CleaningRecommendation[];
    }
    
    return [];
  } catch (error) {
    console.error('Gemini cleaning recommendations error:', error);
    return [];
  }
}
