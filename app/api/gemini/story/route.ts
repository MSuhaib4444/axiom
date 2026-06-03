import { NextRequest, NextResponse } from 'next/server';
import { streamStory } from '@/lib/gemini';
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamStory(sheet, tone || 'executive', (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        } catch (error: unknown) {
          console.error('Streaming error in story route:', error);
          
          if (error instanceof Error && (error as any).status === 429 || error instanceof Error && error.message.includes('429')) {
            const errorPayload = JSON.stringify({ 
              error: 'Rate limit exceeded', 
              code: 'rate_limit',
              retryAfter: 60 
            });
            controller.enqueue(encoder.encode(errorPayload));
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
