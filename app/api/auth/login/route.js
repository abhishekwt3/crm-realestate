import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Detailed debugging information
    console.log('Login attempt:', { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true
      }
    });

    // Log user found status
    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          debug: {
            emailExists: false
          }
        },
        { status: 401 }
      );
    }

    // Log password check
    console.log('User found, checking password');
    console.log('Stored password hash:', user.password);
    console.log('Provided password:', password);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          debug: {
            emailExists: true,
            passwordMatch: false
          }
        },
        { status: 401 }
      );
    }

    // Successful login
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Detailed login error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during login',
        debugError: error.message
      },
      { status: 500 }
    );
  }
}