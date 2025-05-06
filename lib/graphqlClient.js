// lib/graphqlClient.js
'use client';

/**
 * A simple GraphQL client for making requests to the API
 * @param {string} query - The GraphQL query or mutation
 * @param {Object} variables - The variables for the query
 * @param {string} token - Optional auth token
 * @returns {Promise<Object>} - The response data
 */
export async function graphqlRequest(query, variables = {}, token = null) {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graphql`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    
    const result = await response.json();
    
    // Handle GraphQL errors
    if (result.errors) {
      const errorMessage = result.errors.map(e => e.message).join(', ');
      throw new Error(errorMessage);
    }
    
    return result.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

// Define GraphQL operations
export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role
        organisationId
        organisation {
          id
          organisationName
        }
        teamMember {
          id
          teamMemberName
          teamMemberEmailId
        }
      }
      setupRequired
      nextStep
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        role
        organisationId
        organisation {
          id
          organisationName
        }
      }
      setupRequired
      nextStep
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      role
      organisationId
      organisation {
        id
        organisationName
      }
      teamMember {
        id
        teamMemberName
        teamMemberEmailId
      }
    }
  }
`;