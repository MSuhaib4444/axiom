import { NextRequest, NextResponse } from 'next/server';
import { getChartRecommendations } from '@/lib/gemini';
import { SheetData } from '@/types/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sheet } = await req.json() as { sheet: SheetData };

    if (!sheet) {
      return NextResponse.json({ error: 'Missing sheet data' }, { status: 400 });
    }

    const recommendations = await getChartRecommendations(sheet);
    return NextResponse.json({ recommendations });

  } catch (error: unknown) {
    console.error('Chart recommend API error:', error);

    const isRateLimit =
      error instanceof Error &&
      (('status' in error && (error as unknown as { status: number }).status === 429) ||
        error.message.includes('429'));

    if (isRateLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'rate_limit' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
