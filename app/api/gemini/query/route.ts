import { NextRequest, NextResponse } from 'next/server';
import { queryDataset } from '@/lib/gemini';
import { SheetData } from '@/types/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sheet, question, history } = await req.json() as { 
      sheet: SheetData; 
      question: string; 
      history: unknown[];
    };

    if (!sheet || !question) {
      return NextResponse.json({ error: 'Missing sheet or question' }, { status: 400 });
    }

    // Timeout: 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request Timeout')), 30000);
    });

    const response = await Promise.race([
      queryDataset(sheet, question, history as unknown[]),
      timeoutPromise
    ]) as unknown;

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Gemini Query API Error:', error);
    
    if (error instanceof Error && error.message === 'Request Timeout') {
      return NextResponse.json({ error: 'Gemini request timed out', code: 'timeout' }, { status: 504 });
    }

    if (error instanceof Error && (error as any).status === 429 || error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'rate_limit' }, 
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    );
  }
}
