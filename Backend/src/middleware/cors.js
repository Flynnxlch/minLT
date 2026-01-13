import { config } from '../config/index.js';

/**
 * CORS middleware for handling preflight requests
 */
export function corsMiddleware(request) {
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': config.cors.origin,
        'Access-Control-Allow-Methods': config.cors.methods,
        'Access-Control-Allow-Headers': config.cors.headers,
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // Return null to continue processing
  return null;
}

