import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // jose is Edge-compatible

// Convert string to Uint8Array for jose
function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

// Verify token using jose (Edge-compatible)
async function verifyJWT(token) {
  try {
    if (!token) return null;
    
    // Get the secret from env
    const secret = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    const secretKey = stringToUint8Array(secret);
    
    // Verify the token
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export async function middleware(request) {
  // Skip API routes - they'll handle their own authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/simple-login',
    '/server-login',
    '/direct-login',
    '/test-login'
  ];
  
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname) || 
                        request.nextUrl.pathname.startsWith('/_next/') ||
                        request.nextUrl.pathname.includes('favicon.ico');
  
  // If it's a public path, allow access without token
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // For protected routes, check for token
  console.log(`Middleware checking protected path: ${request.nextUrl.pathname}`);
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  console.log('Token found in cookies:', !!token);
  
  if (!token) {
    console.log('No token found, redirecting to login');
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token with Edge-compatible jose library
  const decoded = await verifyJWT(token);
  console.log('Token verification result:', !!decoded);
  
  if (!decoded) {
    console.log('Invalid token, redirecting to login');
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
  
  // Token is valid, allow access to protected route
  console.log('Valid token, proceeding to', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};