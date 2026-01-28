import http from 'http';
import 'dotenv/config';
import { config } from './config/index.js';
import { corsMiddleware, getAllowedOrigin } from './middleware/cors.js';
import { logRequest } from './middleware/logger.js';
import { botDetectionMiddleware, rateLimitMiddleware } from './middleware/rateLimit.js';
import { securityHeaders } from './middleware/security.js';
import { handleRequest } from './routes/index.js';

console.log(`
Starting server on port ${config.port}
`);

// Convert Node.js request to Web API Request
async function nodeToWebRequest(req) {
  const protocol = req.socket.encrypted ? 'https:' : 'http:';
  const host = req.headers.host || `${req.socket.localAddress}:${req.socket.localPort}`;
  const url = `${protocol}//${host}${req.url}`;
  
  const body = req.method !== 'GET' && req.method !== 'HEAD' 
    ? await streamToString(req) 
    : null;
  
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body,
  });
}

// Convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
    stream.on('error', reject);
  });
}

// Convert Web API Response to Node.js response
async function sendResponse(res, webResponse) {
  // Set status
  res.statusCode = webResponse.status;
  res.statusMessage = webResponse.statusText || '';
  
  // Set headers
  for (const [key, value] of webResponse.headers.entries()) {
    res.setHeader(key, value);
  }
  
  // Send body
  const body = await webResponse.text();
  res.end(body);
}

// Request handler (same logic as Bun version)
async function handleFetch(request) {
  // Apply CORS middleware (must be first)
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;

  // Apply bot detection
  const botResponse = botDetectionMiddleware(request);
  if (botResponse) return botResponse;

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    // Add CORS headers to rate limit response
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    const headers = new Headers(rateLimitResponse.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', config.cors.methods);
    headers.set('Access-Control-Allow-Headers', config.cors.headers);
    headers.set('Access-Control-Allow-Credentials', 'true');
    return new Response(rateLimitResponse.body, {
      status: rateLimitResponse.status,
      headers,
    });
  }

  // Handle the request
  try {
    const startTime = Date.now();
    const response = await handleRequest(request);
    const responseTime = Date.now() - startTime;
    
    // Log the request (skip logging for dashboard and monitoring endpoints to avoid spam)
    const path = new URL(request.url).pathname;
    if (!path.startsWith('/dashboard') && path !== '/' && !path.startsWith('/monitoring')) {
      logRequest(request, response, responseTime);
    }
    
    // Add security headers first
    let headers = securityHeaders(request, response);
    
    // Add CORS headers with dynamic origin
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', config.cors.methods);
    headers.set('Access-Control-Allow-Headers', config.cors.headers);
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add rate limit headers if available
    if (request.rateLimitHeaders) {
      Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    // Log full error for server logs (with stack trace only in development)
    console.error('Server error:', {
      message: error.message,
      stack: config.nodeEnv === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return generic error to client (mask stack traces in production)
    const errorResponse = {
      error: 'Internal Server Error',
      ...(config.nodeEnv === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    };
    
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
    });
    headers = securityHeaders(request, { headers });
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers,
      }
    );
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  try {
    const request = await nodeToWebRequest(req);
    const response = await handleFetch(request);
    await sendResponse(res, response);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

// Start server
server.listen(config.port, '0.0.0.0', () => {
  console.log(`✅ Server running on 0.0.0.0:${config.port}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

