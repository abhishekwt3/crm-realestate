import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

// GET all properties
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
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query filter based on user role and optional filters
    let where = {};
    
    // Regular users can only see properties from their organization
    if (decoded.role !== 'superadmin') {
      where.organisation_id = decoded.organisation_id;
    }
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Fetch properties
    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: true,
        organisation: {
          select: {
            organisation_name: true
          }
        },
        _count: {
          select: {
            deals: true
          }
        }
      }
    });
    
    return new Response(
      JSON.stringify({ properties }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/properties:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST create new property
export async function POST(request) {
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
    
    const data = await request.json();
    
    // Validate input
    if (!data.name) {
      return new Response(
        JSON.stringify({ error: 'Property name is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Set organization ID from token if not provided
    if (!data.organisation_id) {
      data.organisation_id = decoded.organisation_id;
    }
    
    // Create new property
    const property = await prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        owner_id: data.owner_id,
        organisation_id: data.organisation_id,
        status: data.status || 'Available'
      }
    });
    
    return new Response(
      JSON.stringify(property),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in POST /api/properties:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}