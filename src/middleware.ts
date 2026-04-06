
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isInMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (isInMaintenanceMode) {
    if (request.nextUrl.pathname !== '/maintenance') {
      
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!maintenance|api|_next/static|_next/image|favicon.ico).*)',
  ],
};