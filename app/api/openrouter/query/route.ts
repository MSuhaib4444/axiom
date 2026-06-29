import { NextRequest, NextResponse } from 'next/server';
import { streamQueryDataset } from '@/lib/openrouter';
import { SheetData } from '@/types/data';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamQueryDataset(sheet, question, history ?? [], (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        } catch (error: unknown) {
          console.error('OpenRouter Query streaming error:', error);
          const isRateLimit =
            error instanceof Error && (error.message.includes('429') || error.message.includes('rate'));
          if (isRateLimit) {
            const payload = JSON.stringify({ error: 'Rate limit exceeded', code: 'rate_limit', retryAfter: 60 });
            controller.enqueue(encoder.encode(payload));
          } else {
            controller.error(error);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: unknown) {
    console.error('OpenRouter Query API Error:', error);

    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'rate_limit' }, 
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
