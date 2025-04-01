import { registerUser } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email is already in use' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate password
    if (!data.password || data.password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if organization exists
    if (data.organisation_id) {
      const organization = await prisma.organisation.findUnique({
        where: { id: data.organisation_id }
      });
      
      if (!organization) {
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Register user
    const { user, token } = await registerUser(data);
    
    // Don't send the password back
    const { password, ...userWithoutPassword } = user;
    
    return new Response(
      JSON.stringify({ user: userWithoutPassword, token }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide more detailed error message if possible
    let errorMessage = 'Registration failed';
    
    if (error.message.includes('Unique constraint failed')) {
      errorMessage = 'This email is already registered';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}