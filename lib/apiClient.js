// lib/apiClient.js
import { gql } from '@apollo/client';
import client from './apollo-client';

// Example wrapper for common operations
const apiClient = {
  // Authentication
  login: async (email, password) => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
              email
              role
            }
            setupRequired
            nextStep
          }
        }
      `,
      variables: {
        input: { email, password }
      }
    });
    return data.login;
  },
  
  // Get current user
  getCurrentUser: async () => {
    const { data } = await client.query({
      query: gql`
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
          }
        }
      `,
      fetchPolicy: 'network-only'
    });
    return data;
  },
  
  // More methods can be added here...
};

export default apiClient;