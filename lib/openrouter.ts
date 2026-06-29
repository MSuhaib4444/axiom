import { SheetData } from '@/types/data';
import { 
  OpenRouterQueryResponse, 
  CleaningRecommendation,
  ChartRecommendation
} from '@/types/openrouter';

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

function parseOpenRouterQueryResponse(text: string): OpenRouterQueryResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as OpenRouterQueryResponse;
    } catch (e) {
      // JSON parse error
    }
  }

  return { answer: text, chartConfig: null };
}

function toOpenRouterChatHistory(history: unknown[]): Array<{
  role: 'user' | 'assistant';
  content: string;
}> {
  return history.map(item => {
    const roleValue = typeof item === 'object' && item !== null && 'role' in item
      ? (item as { role?: unknown }).role
      : null;
    const contentValue = typeof item === 'object' && item !== null && 'content' in item
      ? (item as { content?: unknown }).content
      : '';

    return {
      role: roleValue === 'user' ? 'user' : 'assistant',
      content: String(contentValue ?? '')
    };
  });
}

async function streamChatCompletion(
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'AXIOM',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      if (cleanLine === 'data: [DONE]') continue;
      if (cleanLine.startsWith('data: ')) {
        try {
          const json = JSON.parse(cleanLine.slice(6));
          const text = json.choices?.[0]?.delta?.content || '';
          if (text) {
            onChunk(text);
          }
        } catch (e) {
          // Ignore parsing errors for incomplete JSON lines
        }
      }
    }
  }
}

async function getChatCompletion(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'AXIOM',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Streams analysis from OpenRouter.
 */
export async function streamAnalysis(
  sheet: SheetData, 
  onChunk: (chunk: string) => void
): Promise<void> {
  const context = buildDataContext(sheet);
  
  const prompt = `
You are an expert data analyst. Analyze the following dataset context and provide a structured analysis.
Respond with ONLY valid JSON that matches the OpenRouterAnalysis type. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output the raw JSON.

{
  "summary": "string",
  "keyInsights": ["string"],
  "suggestedCharts": [{"type": "bar|line|scatter|pie|area|heatmap|treemap|sankey|radar|boxplot|waterfall", "xColumn": "string", "yColumn": "string", "title": "string", "reason": "string"}],
  "dataQualityIssues": [{"column": "string", "issue": "string", "severity": "low|medium|high", "suggestion": "string"}],
  "overallQualityScore": number (0-100),
  "suggestedNextSteps": ["string"]
}

Dataset Context:
${context}
`.trim();

  await streamChatCompletion([
    { role: 'user', content: prompt }
  ], onChunk);
}

/**
 * Queries the dataset using OpenRouter in a chat-like interface (non-streaming, for internal use).
 */
export async function queryDataset(
  sheet: SheetData, 
  question: string, 
  history: unknown[] = []
): Promise<OpenRouterQueryResponse> {
  const context = buildDataContext(sheet, 50); // reduce sample rows for faster response

  const systemPrompt = `
Dataset Context:
${context}

Instructions:
1. Answer the question accurately based on the data. Be concise.
2. If the user asks for a visualization or if one would be helpful, provide a chartConfig.
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

  const messages = [
    { role: 'system', content: systemPrompt },
    ...toOpenRouterChatHistory(history),
    { role: 'user', content: question }
  ];

  try {
    const text = await getChatCompletion(messages);
    return parseOpenRouterQueryResponse(text);
  } catch (error) {
    console.error('OpenRouter query error:', error);
    return { 
      answer: "OpenRouter is temporarily unavailable right now. Please try again in a moment.", 
      chartConfig: null 
    };
  }
}

/**
 * Streams a dataset query response from OpenRouter token-by-token.
 */
export async function streamQueryDataset(
  sheet: SheetData,
  question: string,
  history: unknown[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const context = buildDataContext(sheet, 50);

  const systemPrompt = `
Dataset Context:
${context}

Instructions:
1. Answer the question accurately based on the data. Be concise.
2. If the user asks for a visualization or if one would be helpful, include a chartConfig.
3. Respond with ONLY valid JSON (no markdown fences) in the format:
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

  const messages = [
    { role: 'system', content: systemPrompt },
    ...toOpenRouterChatHistory(history),
    { role: 'user', content: question }
  ];

  await streamChatCompletion(messages, onChunk);
}

/**
 * Generates a storytelling narrative report in Markdown.
 */
export async function generateStory(sheet: SheetData, tone: string = 'professional'): Promise<string> {
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

  return getChatCompletion([
    { role: 'user', content: prompt }
  ]);
}

/**
 * Streams storytelling narrative report in Markdown from OpenRouter.
 */
export async function streamStory(
  sheet: SheetData,
  tone: string = 'professional',
  onChunk: (chunk: string) => void
): Promise<void> {
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

  await streamChatCompletion([
    { role: 'user', content: prompt }
  ], onChunk);
}

export async function getChartRecommendations(sheet: SheetData): Promise<ChartRecommendation[]> {
  // Build a lightweight schema
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

Respond with ONLY a valid JSON array. Do not enclose the response in markdown code blocks. Just output the raw JSON:
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
    const text = await getChatCompletion([
      { role: 'user', content: prompt }
    ]);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as ChartRecommendation[];
    const validKeys = new Set(sheet.columns.map(c => c.key));
    return parsed.filter(r =>
      validKeys.has(r.xColumn) && validKeys.has(r.yColumn)
    );
  } catch (error) {
    console.error('OpenRouter chart recommendations error:', error);
    return [];
  }
}

/**
 * Gets data cleaning recommendations from OpenRouter.
 */
export async function getCleaningRecommendations(sheet: SheetData): Promise<CleaningRecommendation[]> {
  const context = buildDataContext(sheet);
  
  const prompt = `
Identify data cleaning opportunities for the following dataset.
Respond with ONLY a valid JSON array of CleaningRecommendation objects. Do not enclose the response in markdown code blocks. Just output the raw JSON:
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
    const text = await getChatCompletion([
      { role: 'user', content: prompt }
    ]);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CleaningRecommendation[];
    }
    
    return [];
  } catch (error) {
    console.error('OpenRouter cleaning recommendations error:', error);
    return [];
  }
}
