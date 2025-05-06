// app/providers/ApolloProvider.js
'use client';

import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export function ApolloWrapper({ children }) {
  // Create the HTTP link
  const httpLink = createHttpLink({
    uri: 'http://localhost:3001/graphql',
  });

  // Add authentication link
  const authLink = setContext((_, { headers }) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    };
  });

  // Create Apollo Client instance
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}