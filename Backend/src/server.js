import { serve } from 'bun';
import { handleRequest } from './routes/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { config } from './config/index.js';

console.log(`
╔═══════════════════════════════════════════════╗
║           MinLT Backend Server                ║
║                                               ║
║   🚀 Starting server on port ${config.port}           ║
╚═══════════════════════════════════════════════╝
`);

const server = serve({
  port: config.port,
  
  async fetch(request) {
    // Apply CORS middleware
    const corsResponse = corsMiddleware(request);
    if (corsResponse) return corsResponse;

    // Handle the request
    try {
      const response = await handleRequest(request);
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', config.cors.origin);
      headers.set('Access-Control-Allow-Methods', config.cors.methods);
      headers.set('Access-Control-Allow-Headers', config.cors.headers);
      
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
  
  error(error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
});

console.log(`✅ Server running at http://localhost:${server.port}`);

