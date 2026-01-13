import { dashboardController } from '../controllers/dashboard.js';
import { authController } from '../controllers/auth.js';

/**
 * API route handler
 */
export async function apiRoutes(request, path) {
  const method = request.method;
  
  // Dashboard endpoints
  if (path === '/dashboard/stats') {
    if (method === 'GET') {
      return dashboardController.getStats(request);
    }
  }
  
  if (path === '/dashboard/chart-data') {
    if (method === 'GET') {
      return dashboardController.getChartData(request);
    }
  }
  
  if (path === '/dashboard/notifications') {
    if (method === 'GET') {
      return dashboardController.getNotifications(request);
    }
  }
  
  if (path === '/dashboard/messages') {
    if (method === 'GET') {
      return dashboardController.getMessages(request);
    }
  }
  
  // Auth endpoints
  if (path === '/auth/login') {
    if (method === 'POST') {
      return authController.login(request);
    }
  }
  
  if (path === '/auth/register') {
    if (method === 'POST') {
      return authController.register(request);
    }
  }
  
  if (path === '/auth/me') {
    if (method === 'GET') {
      return authController.getCurrentUser(request);
    }
  }
  
  // API info
  if (path === '' || path === '/') {
    return new Response(
      JSON.stringify({
        message: 'MinLT API',
        version: '1.0.0',
        endpoints: {
          dashboard: {
            'GET /api/dashboard/stats': 'Get dashboard statistics',
            'GET /api/dashboard/chart-data': 'Get chart data',
            'GET /api/dashboard/notifications': 'Get notifications',
            'GET /api/dashboard/messages': 'Get messages',
          },
          auth: {
            'POST /api/auth/login': 'User login',
            'POST /api/auth/register': 'User registration',
            'GET /api/auth/me': 'Get current user',
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // 404 for unknown API routes
  return new Response(
    JSON.stringify({ error: 'API endpoint not found', path: `/api${path}` }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

