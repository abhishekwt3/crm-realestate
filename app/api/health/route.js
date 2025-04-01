export async function GET(request) {
    try {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          apiWorking: true
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Health check failed:', error);
      
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }