import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SheetData } from '@/types/data';
import { 
  GeminiAnalysis, 
  GeminiQueryResponse, 
  CleaningRecommendation 
} from '@/types/gemini';

/**
 * Returns a Gemini GenerativeModel instance.
 * Throws if GEMINI_API_KEY is missing.
 */
export function getClient(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-exp';
  
  return genAI.getGenerativeModel({ model: modelName });
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
  history: any[] = []
): Promise<GeminiQueryResponse> {
  const model = getClient();
  const context = buildDataContext(sheet);
  
  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
  });

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

  try {
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();
    
    // Attempt to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GeminiQueryResponse;
    }
    
    return { answer: text, chartConfig: null };
  } catch (error) {
    console.error('Gemini query error:', error);
    return { 
      answer: "I encountered an error while processing your request. Please try again.", 
      chartConfig: null 
    };
  }
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
