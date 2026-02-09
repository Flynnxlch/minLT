/**
 * Rate limiting middleware
 * Prevents API abuse and DDoS attacks
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();
const detectionHistory = []; // Array of detection events
const MAX_DETECTION_HISTORY = 1000; // Keep last 1000 detection events

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Add detection event to history
 */
function addDetectionHistory(event) {
  detectionHistory.push({
    ...event,
    timestamp: new Date().toISOString(),
  });
  // Keep only last MAX_DETECTION_HISTORY
  if (detectionHistory.length > MAX_DETECTION_HISTORY) {
    detectionHistory.shift();
  }
}

/**
 * Get client identifier (IP address or user ID).
 * Uses verified JWT only (jwt.verify) so forged tokens cannot bypass rate limit per-user.
 */
function getClientId(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const payload = jwt.verify(token, config.jwt.secret);
      if (payload && payload.userId) {
        return `user:${payload.userId}`;
      }
    } catch {
      // Invalid or expired token: do not trust payload, fall back to IP
    }
  }

  const forwarded = request.headers.get('X-Forwarded-For');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('X-Real-IP') || 'unknown';
  return `ip:${ip}`;
}
/**
 * Rate limit configuration
*/
const RATE_LIMITS = {
  // Login/Register: 4 requests per minute
  '/auth/login': { maxRequests: 8, windowMs: 60 * 1000 },
  '/auth/register': { maxRequests: 15, windowMs: 60 * 1000 },
  
  // General API: 100 requests per minute
  default: { maxRequests: 70, windowMs: 60 * 1000 },

  // Strict endpoints: 20 requests per minute
  strict: { maxRequests: 20, windowMs: 60 * 1000 },
};

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(request) {
  const path = new URL(request.url).pathname;
  
  // Skip rate limiting for monitoring endpoints (backend only)
  if (path === '/health' || path === '/session-history' || path === '/detection' || path === '/') {
    return null;
  }
  
  const clientId = getClientId(request);
  
  // Determine rate limit config (register has its own limit)
  let limitConfig = RATE_LIMITS.default;
  if (path.includes('/auth/register')) {
    limitConfig = RATE_LIMITS['/auth/register'];
  } else if (path.includes('/auth/login')) {
    limitConfig = RATE_LIMITS['/auth/login'];
  } else if (path.includes('/auth/') || (path.includes('/risks') && request.method === 'POST')) {
    limitConfig = RATE_LIMITS.strict;
  }

  const key = `${clientId}:${path}:${limitConfig.windowMs}`;
  const now = Date.now();
  
  // Get or create rate limit data
  let data = rateLimitStore.get(key);
  
  if (!data || data.resetTime < now) {
    // Reset window
    data = {
      count: 0,
      resetTime: now + limitConfig.windowMs,
      firstRequest: now,
    };
    rateLimitStore.set(key, data);
  }

  // Increment request count
  data.count++;

  // Check if limit exceeded
  if (data.count > limitConfig.maxRequests) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);

    addDetectionHistory({
      type: 'rate_limit_exceeded',
      clientId,
      path,
      requestCount: data.count,
      maxRequests: limitConfig.maxRequests,
      windowMs: limitConfig.windowMs,
      retryAfter,
    });

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${limitConfig.maxRequests} requests per ${limitConfig.windowMs / 1000} seconds.`,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limitConfig.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(data.resetTime),
        },
      }
    );
  }

  request.rateLimitHeaders = {
    'X-RateLimit-Limit': String(limitConfig.maxRequests),
    'X-RateLimit-Remaining': String(limitConfig.maxRequests - data.count),
    'X-RateLimit-Reset': String(data.resetTime),
  };
  
  return null;
}

/**
 * Bot detection - check for suspicious patterns
 */
export function botDetectionMiddleware(request) {
  const path = new URL(request.url).pathname;
  
  // Skip bot detection for monitoring endpoints (backend only)
  if (path === '/health' || path === '/session-history' || path === '/detection' || path === '/') {
    return null;
  }
  
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Common bot user agents
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
  ];
  
  // Check if user agent is missing or looks like a bot
  if (!userAgent || botPatterns.some(pattern => pattern.test(userAgent))) {
    // Allow if it's a legitimate API client (has proper auth)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Block suspicious requests without auth
      if (path.includes('/auth/') || path.includes('/risks')) {
        const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                   request.headers.get('X-Real-IP') || 
                   'unknown';
        
        // Add to detection history
        addDetectionHistory({
          type: 'bot_detected',
          path,
          userAgent,
          ip,
          reason: 'suspicious_user_agent',
        });
        
        return new Response(
          JSON.stringify({
            error: 'Access denied',
            message: 'Suspicious activity detected',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  }
  
  return null;
}

/**
 * Get detection history for monitoring
 */
export function getDetectionHistory(limit = 100) {
  const recentDetections = detectionHistory.slice(-limit).reverse(); // Most recent first
  
  // Group detections by type for detailed analysis
  const detectionsByType = {
    rate_limit_exceeded: detectionHistory.filter(e => e.type === 'rate_limit_exceeded'),
    bot_detected: detectionHistory.filter(e => e.type === 'bot_detected'),
  };
  
  // Get top offenders for rate limiting
  const rateLimitOffenders = new Map();
  detectionsByType.rate_limit_exceeded.forEach(detection => {
    const key = detection.clientId || 'unknown';
    if (!rateLimitOffenders.has(key)) {
      rateLimitOffenders.set(key, {
        clientId: key,
        count: 0,
        paths: new Set(),
        maxRequests: detection.maxRequests || 0,
        windowMs: detection.windowMs || 0,
      });
    }
    const offender = rateLimitOffenders.get(key);
    offender.count++;
    if (detection.path) offender.paths.add(detection.path);
  });
  
  // Get top bot patterns
  const botPatterns = new Map();
  detectionsByType.bot_detected.forEach(detection => {
    const key = detection.userAgent || 'unknown';
    if (!botPatterns.has(key)) {
      botPatterns.set(key, {
        userAgent: key,
        count: 0,
        ips: new Set(),
        paths: new Set(),
        reasons: new Set(),
      });
    }
    const pattern = botPatterns.get(key);
    pattern.count++;
    if (detection.ip) pattern.ips.add(detection.ip);
    if (detection.path) pattern.paths.add(detection.path);
    if (detection.reason) pattern.reasons.add(detection.reason);
  });
  
  // Calculate rate limit statistics
  const rateLimitStats = {
    totalRequests: Array.from(rateLimitStore.values()).reduce((sum, data) => sum + data.count, 0),
    activeLimits: rateLimitStore.size,
    currentLimits: Array.from(rateLimitStore.entries()).map(([key, data]) => {
      // key format: "clientId:path:windowMs" but clientId can contain ":" (e.g. "user:123", "ip:1.2.3.4")
      const parts = key.split(':');
      const windowMs = parts.pop();
      const path = parts.pop();
      const clientId = parts.join(':');
      return {
        clientId,
        path,
        windowMs: parseInt(windowMs, 10),
        currentCount: data.count,
        resetTime: new Date(data.resetTime).toISOString(),
        firstRequest: new Date(data.firstRequest).toISOString(),
      };
    }),
  };
  
  return {
    totalEntries: detectionHistory.length,
    summary: {
      rateLimitExceeded: detectionsByType.rate_limit_exceeded.length,
      botDetected: detectionsByType.bot_detected.length,
      lastDetection: detectionHistory.length > 0 
        ? detectionHistory[detectionHistory.length - 1].timestamp 
        : null,
    },
    recentDetections: recentDetections.map(detection => ({
      ...detection,
      // Add human-readable details
      details: detection.type === 'rate_limit_exceeded' 
        ? `Client ${detection.clientId} exceeded rate limit on ${detection.path} (${detection.requestCount}/${detection.maxRequests} requests in ${detection.windowMs / 1000}s)`
        : detection.type === 'bot_detected'
        ? `Bot detected: ${detection.userAgent} from IP ${detection.ip} accessing ${detection.path} (Reason: ${detection.reason})`
        : 'Unknown detection type',
    })),
    topOffenders: {
      rateLimit: Array.from(rateLimitOffenders.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(offender => ({
          ...offender,
          paths: Array.from(offender.paths),
        })),
      bots: Array.from(botPatterns.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(pattern => ({
          ...pattern,
          ips: Array.from(pattern.ips),
          paths: Array.from(pattern.paths),
          reasons: Array.from(pattern.reasons),
        })),
    },
    rateLimitStats,
    detectionBreakdown: {
      byType: {
        rate_limit_exceeded: {
          count: detectionsByType.rate_limit_exceeded.length,
          percentage: detectionHistory.length > 0 
            ? Math.round((detectionsByType.rate_limit_exceeded.length / detectionHistory.length) * 100) 
            : 0,
        },
        bot_detected: {
          count: detectionsByType.bot_detected.length,
          percentage: detectionHistory.length > 0 
            ? Math.round((detectionsByType.bot_detected.length / detectionHistory.length) * 100) 
            : 0,
        },
      },
      byPath: (() => {
        const pathCounts = new Map();
        detectionHistory.forEach(detection => {
          const path = detection.path || 'unknown';
          pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
        });
        return Array.from(pathCounts.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      })(),
    },
  };
}
