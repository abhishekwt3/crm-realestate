/** @type {import('next').NextConfig} 
const nextConfig = {};

export default nextConfig;
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensure errors are displayed properly in development
    reactStrictMode: true,
    
    // Configure redirects if needed
    async redirects() {
      return [
        {
          source: '/',
          destination: '/dashboard',
          permanent: false,
        },
      ];
    },
    
    // Error handling
    onDemandEntries: {
      // period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
    
    // Configure headers for security
    async headers() {
      return [
        {
          // Apply these headers to all routes
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;