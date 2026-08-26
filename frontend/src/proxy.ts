import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login');

  if (!token) {
    if (!isAuthPage && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const role = decoded.role;

    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(`/dashboard/${role.toLowerCase()}`, request.url),
      );
    }

    if (pathname.startsWith('/dashboard')) {
      if (pathname.startsWith('/dashboard/student') && role !== 'STUDENT') {
        return NextResponse.redirect(
          new URL(`/dashboard/${role.toLowerCase()}`, request.url),
        );
      }
      if (
        pathname.startsWith('/dashboard/instructor') &&
        role !== 'INSTRUCTOR'
      ) {
        return NextResponse.redirect(
          new URL(`/dashboard/${role.toLowerCase()}`, request.url),
        );
      }
      if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL(`/dashboard/${role.toLowerCase()}`, request.url),
        );
      }
    }
  } catch {
    if (!isAuthPage && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
