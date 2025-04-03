import jwt from 'jsonwebtoken';
import prisma from './prisma'; // Use singleton instance

// Secret key should be in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    organisation_id: user.organisation_id
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// Get token from cookies or Authorization header
export function getTokenFromRequest(request) {
  // Check Authorization header first
  const authHeader = request?.headers?.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const cookies = request?.cookies;
  const tokenCookie = cookies?.get?.('token');
  return tokenCookie?.value;
}

// Authenticate user by email/password
export async function authenticateUser(email, password) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organisation: {
          select: {
            organisation_name: true
          }
        }
      }
    });
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // In a real app, use bcrypt to compare passwords
    const isPasswordValid = user.password === password;
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Generate token
    const token = generateToken(user);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organisation_id: user.organisation_id,
        organisation_name: user.organisation?.organisation_name
      },
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Register a new user
export async function registerUser(userData) {
  try {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password, // In production, hash this password
        role: userData.role || 'user',
        organisation_id: userData.organisation_id
      },
      include: {
        organisation: {
          select: {
            organisation_name: true
          }
        }
      }
    });
    
    // Generate token
    const token = generateToken(newUser);
    
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        organisation_id: newUser.organisation_id,
        organisation_name: newUser.organisation?.organisation_name
      },
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}