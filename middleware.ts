import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith('/auth/') || pathname === '/') return NextResponse.next();

  // 🔒 Redirection si non connecté
  if (!token) return NextResponse.redirect(new URL('/auth/signin', request.url));

  // Exemple de contrôle de rôle
  if (pathname.startsWith('/admin/') && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/comptable/') && token.role !== 'comptable') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/client/') && token.role !== 'client') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
