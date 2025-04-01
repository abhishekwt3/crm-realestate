import { loginUser } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    console.log('Login API endpoint hit');
    
    let email, password;
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Parse JSON request body
      const data = await request.json();
      email = data.email;
      password = data.password;
      console.log('Received JSON login request for:', email);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const formData = await request.formData();
      email = formData.get('email');
      password = formData.get('password');
      console.log('Received form login request for:', email);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { 
          status: 415,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Attempting to authenticate user: ${email}`);
    
    // Authenticate user
    const result = await loginUser(email, password);
    
    console.log('Authentication result:', result.success ? 'Success' : 'Failed');
    
    if (result.success && result.user && result.token) {
      // Don't send the password back
      const { password: _, ...userWithoutPassword } = result.user;
      
      // Calculate expiry date for cookie
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
      
      // Create response with token
      const response = new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          user: userWithoutPassword,
          token: result.token,
          tokenLength: result.token.length,
          redirectTo: '/dashboard'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
      
      // Set the cookie in the response
      response.headers.append('Set-Cookie', 
        `token=${result.token}; Path=/; Expires=${expiryDate.toUTCString()}; HttpOnly; SameSite=Lax`
      );
      
      console.log('Login successful, cookie set, returning response');
      return response;
    } else {
      return new Response(
        JSON.stringify({ error: result.error || 'Invalid credentials' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Authentication failed: ' + error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}