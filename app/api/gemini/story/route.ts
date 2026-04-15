import { NextRequest, NextResponse } from 'next/server';
import { generateStory } from '@/lib/gemini';
import { SheetData } from '@/types/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sheet, tone } = await req.json() as { 
      sheet: SheetData; 
      tone?: string;
    };

    if (!sheet) {
      return NextResponse.json({ error: 'Missing sheet data' }, { status: 400 });
    }

    const story = await generateStory(sheet, tone || 'professional');

    return new Response(story, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });

  } catch (error: unknown) {
    console.error('Gemini Story API Error:', error);
    
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
