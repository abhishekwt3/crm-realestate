import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

// GET all organizations
export async function GET(request) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For admin or superadmin roles, might show all organizations
    // For regular users, only show their organization
    let organisations;
    
    if (decoded.role === 'superadmin') {
      organisations = await prisma.organisation.findMany({
        include: {
          _count: {
            select: {
              teamMembers: true,
              properties: true
            }
          }
        }
      });
    } else {
      // Regular users can only see their organization
      organisations = await prisma.organisation.findMany({
        where: {
          id: decoded.organisation_id
        },
        include: {
          _count: {
            select: {
              teamMembers: true,
              properties: true
            }
          }
        }
      });
    }
    
    return new Response(
      JSON.stringify({ organisations }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST create new organization
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate input
    if (!data.organisation_name) {
      return new Response(
        JSON.stringify({ error: 'Organization name is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create new organization
    const organisation = await prisma.organisation.create({
      data: {
        organisation_name: data.organisation_name
      }
    });
    
    return new Response(
      JSON.stringify(organisation),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return new Response(
        JSON.stringify({ error: 'An organization with this name already exists' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to create organization: ' + error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}