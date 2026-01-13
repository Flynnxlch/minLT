import { apiRoutes } from './api.js';

/**
 * Main request handler - routes requests to appropriate handlers
 */
export async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // API routes
  if (path.startsWith('/api')) {
    return apiRoutes(request, path.replace('/api', ''));
  }
  
  // Health check endpoint
  if (path === '/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Root endpoint
  if (path === '/') {
    return new Response(
      JSON.stringify({
        name: 'MinLT Backend API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // 404 for unknown routes
  return new Response(
    JSON.stringify({ error: 'Not Found', path }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

