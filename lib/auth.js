import { SignJWT, jwtVerify } from 'jose'; // Edge-compatible JWT signing and verification
import { compare, hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Make sure the JWT_SECRET is loaded
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Convert string to Uint8Array for jose
function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

export async function hashPassword(password) {
  return await hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  try {
    return await compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Verify token using jose (Edge-compatible)
export async function verifyToken(token) {
  try {
    if (!token) return null;
    
    // Get the secret from env
    const secret = JWT_SECRET;
    const secretKey = stringToUint8Array(secret);
    
    // Verify the token
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export async function generateToken(user) {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organisation_id: user.organisation_id,
    };

    console.log('Generating token with payload:', JSON.stringify(payload));
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate expiry time
    let expiryTime = now + 7 * 24 * 60 * 60; // 7 days in seconds
    if (JWT_EXPIRES_IN) {
      const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === 'd') expiryTime = now + value * 24 * 60 * 60;
        else if (unit === 'h') expiryTime = now + value * 60 * 60;
        else if (unit === 'm') expiryTime = now + value * 60;
        else if (unit === 's') expiryTime = now + value;
      }
    }
    
    // Convert secret to Uint8Array
    const secretKey = stringToUint8Array(JWT_SECRET);
    
    // Create and sign JWT using jose
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiryTime)
      .sign(secretKey);
    
    console.log(`Token generated (${token.length} chars)`);
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

export async function registerUser(userData) {
  const { email, password, role, organisation_id } = userData;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }
  
  // Validate password
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('Email is already registered');
  }
  
  try {
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        organisation_id
      }
    });
    
    // If this is the first user for an organization, create a team member record
    if (organisation_id) {
      await prisma.teamMember.create({
        data: {
          team_member_name: email.split('@')[0], // Default name from email
          team_member_email_id: email,
          organisation_id: organisation_id,
          user_id: user.id
        }
      });
    }
    
    // Generate JWT token
    const token = await generateToken(user);
    
    return { user, token, success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      throw new Error('This email is already registered');
    }
    
    throw new Error('Failed to create account: ' + error.message);
  }
}

export async function loginUser(email, password) {
  try {
    // Validate inputs
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    
    if (!password) {
      return { success: false, error: 'Password is required' };
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // User not found
    if (!user) {
      console.log('Login failed: User not found');
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    // Password doesn't match
    if (!isPasswordValid) {
      console.log('Login failed: Password incorrect');
      return { success: false, error: 'Invalid credentials' };
    }
    
    console.log('Login successful for user:', email);
    
    // Generate JWT token
    const token = await generateToken(user);
    
    // Return user and token
    return { 
      success: true,
      user,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: 'Authentication failed: ' + error.message 
    };
  }
}