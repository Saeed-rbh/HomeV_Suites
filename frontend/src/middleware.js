import { NextResponse } from 'next/server';

/**
 * Protect all admin dashboard routes.
 * The login page (/login) is public.
 * All other /admin/* routes require the adminToken cookie.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Only protect admin routes
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('adminToken');
        // If there's no auth token, redirect to /login
        if (!token || !token.value) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
