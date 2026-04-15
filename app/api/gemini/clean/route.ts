import { NextRequest, NextResponse } from 'next/server';
import { getCleaningRecommendations } from '@/lib/gemini';
import { SheetData } from '@/types/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sheet } = await req.json() as { sheet: SheetData };

    if (!sheet) {
      return NextResponse.json({ error: 'Missing sheet data' }, { status: 400 });
    }

    const recommendations = await getCleaningRecommendations(sheet);

    return NextResponse.json(recommendations);

  } catch (error: unknown) {
    console.error('Gemini Clean API Error:', error);
    
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
