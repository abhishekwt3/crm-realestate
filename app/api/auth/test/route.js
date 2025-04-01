import { verifyToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get token from cookies using Next.js API
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    // Also get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader && authHeader.split(' ')[1];
    
    // Debug info about request headers
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Debug info about cookies
    const allCookies = {};
    cookieStore.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });
    
    if (!token && !headerToken) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          error: 'No token found',
          debug: {
            cookiesFound: Object.keys(allCookies).length > 0,
            cookieNames: Object.keys(allCookies),
            requestHeaders: headers
          }
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Try to verify the token
    const activeToken = token || headerToken;
    const decoded = verifyToken(activeToken);
    
    if (!decoded) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          error: 'Invalid token',
          tokenSource: token ? 'Cookie' : 'Header',
          debug: {
            tokenLength: activeToken?.length,
            tokenPrefix: activeToken?.substring(0, 10) + '...',
            cookiesFound: Object.keys(allCookies).length > 0,
            cookieNames: Object.keys(allCookies)
          }
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Token is valid
    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          organisation_id: decoded.organisation_id
        },
        tokenSource: token ? 'Cookie' : 'Header',
        tokenExpiry: new Date(decoded.exp * 1000).toISOString(),
        debug: {
          tokenLength: activeToken?.length,
          issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
          cookieNames: Object.keys(allCookies)
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Auth test error:', error);
    
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: 'Auth test failed: ' + error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}