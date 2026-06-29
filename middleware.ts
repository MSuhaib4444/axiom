import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/openrouter/')) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 30;

    let record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    if (record.count >= limit) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        }
      );
    }

    record.count++;
    rateLimitMap.set(ip, record);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
