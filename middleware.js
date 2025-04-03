import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/login-test'
];

// List of routes for initial setup that require authentication but not a complete profile
const SETUP_ROUTES = [
  '/onboarding/create-organization',
  '/onboarding/add-team-member',
  '/api/organizations',
  '/api/team'
];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // Always allow public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // If no token exists, redirect to login for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  try {
    const decoded = await verifyToken(token);

    // Token is invalid
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow setup routes for newly registered users
    if (SETUP_ROUTES.some(route => path.startsWith(route))) {
      return NextResponse.next();
    }

    // Check if user needs to complete onboarding
    // This assumes the decoded token doesn't have org or team info
    if (!decoded.organisation_id) {
      return NextResponse.redirect(new URL('/onboarding/create-organization', request.url));
    }

    // All checks passed
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    
    // Application routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
    
    // Exclude some static files and images
    '/((?!.*\\..*|_next).*)',
  ]
};