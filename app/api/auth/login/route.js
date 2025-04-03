import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const result = await authenticateUser(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    // Set token in cookie
    const cookieStore = cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      sameSite: 'lax'
    });
    
    // Return success response with user info and token
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}