// Route protection: /dashboard* needs buyer OR admin session;
// /admin* needs admin session (except /admin/login, /admin/setup).
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from './lib/auth';
import { jwtVerify } from 'jose';

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '');
}

async function sessionFrom(req: NextRequest): Promise<{ role: string } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role === 'admin' || payload.role === 'buyer') {
      return { role: String(payload.role) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/setup') {
      return NextResponse.next();
    }
    const s = await sessionFrom(req);
    if (!s || s.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const s = await sessionFrom(req);
    if (!s) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
