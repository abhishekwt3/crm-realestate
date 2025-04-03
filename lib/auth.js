import { jwtVerify, SignJWT } from 'jose';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file'
);
const JWT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

// Hash password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export async function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    organisation_id: user.organisation_id
  };
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${JWT_EXPIRES_IN}s`)
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token) {
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// Authenticate user
export async function authenticateUser(email, password) {
  try {
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
    
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    const token = await generateToken(user);
    
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
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'admin',
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
    const token = await generateToken(newUser);
    
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        organisation_id: newUser.organisation_id,
        organisation_name: newUser.organisation?.organisation_name
      },
      token,
      setupRequired: true,
      nextStep: 'create-organization'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

// Export all functions
export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateUser,
  registerUser
};