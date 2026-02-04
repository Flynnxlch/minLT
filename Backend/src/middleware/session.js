/**
 * Session tracking middleware
 * Tracks user sessions and devices for security monitoring
 */

// In-memory store for active sessions (in production, use Redis)
const activeSessions = new Map(); // userId -> Set of sessionIds
const sessionDetails = new Map(); // sessionId -> session details
const sessionHistory = []; // Array of session events for history tracking
const trafficStats = {
  totalRequests: 0,
  requestsByEndpoint: new Map(),
  requestsByUser: new Map(),
  requestsByIP: new Map(),
  requestsByHour: new Map(),
  startTime: new Date().toISOString(),
};
const MAX_CONCURRENT_LOGINS = 15;
const MAX_DEVICES_PER_USER = 4;
const DEVICE_WARNING_THRESHOLD = 3;
const MAX_HISTORY_ENTRIES = 1000; // Keep last 1000 session events

/**
 * Generate session ID from request
 */
export function generateSessionId(request, user) {
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
             request.headers.get('X-Real-IP') || 
             'unknown';
  
  // Create a unique session identifier
  const sessionData = `${user.id}:${ip}:${userAgent}`;
  return btoa(sessionData).substring(0, 32);
}

/**
 * Get device fingerprint
 */
function getDeviceFingerprint(request) {
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
             request.headers.get('X-Real-IP') || 
             'unknown';
  const acceptLanguage = request.headers.get('Accept-Language') || 'unknown';
  
  return {
    userAgent,
    ip,
    acceptLanguage,
    fingerprint: btoa(`${ip}:${userAgent}:${acceptLanguage}`).substring(0, 32),
  };
}

/**
 * Check concurrent login limit
 */
export async function checkConcurrentLoginLimit() {
  const totalActiveSessions = activeSessions.size;
  
  if (totalActiveSessions >= MAX_CONCURRENT_LOGINS) {
    return {
      allowed: false,
      message: `Maximum ${MAX_CONCURRENT_LOGINS} concurrent users reached. Please try again later.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Track user session and check device limit
 */
export async function trackUserSession(request, user) {
  const userId = user.id;
  const deviceInfo = getDeviceFingerprint(request);
  const sessionId = generateSessionId(request, user);
  
  // Get or create user sessions
  let userSessions = activeSessions.get(userId) || new Set();
  
  // Check device count
  const deviceCount = userSessions.size;
  let removedSession = null;
  
  if (deviceCount >= MAX_DEVICES_PER_USER) {
    // Remove oldest session (FIFO)
    const sessionsArray = Array.from(userSessions);
    const oldestSession = sessionsArray[0];
    userSessions.delete(oldestSession);
    sessionDetails.delete(oldestSession);
    removedSession = oldestSession;
    
    // Log the removal
    console.log(`[Session] Removed oldest session for user ${userId} (device limit reached)`);
    
    // Add to history
    addSessionHistory({
      type: 'session_removed',
      userId,
      sessionId: oldestSession,
      reason: 'device_limit_reached',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Add new session
  userSessions.add(sessionId);
  activeSessions.set(userId, userSessions);
  
  // Store session details
  sessionDetails.set(sessionId, {
    sessionId,
    userId,
    userEmail: user.email,
    userName: user.name,
    deviceInfo,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  });
  
  // Check if warning should be shown
  const shouldWarn = deviceCount >= DEVICE_WARNING_THRESHOLD && deviceCount < MAX_DEVICES_PER_USER;
  
  // Add to history
  addSessionHistory({
    type: 'session_created',
    userId,
    sessionId,
    deviceInfo,
    deviceCount: userSessions.size,
    shouldWarn,
    timestamp: new Date().toISOString(),
  });
  
  return {
    sessionId,
    deviceCount: userSessions.size,
    shouldWarn,
    warningMessage: shouldWarn 
      ? `Warning: You are logged in on ${userSessions.size} different devices. Maximum is ${MAX_DEVICES_PER_USER}.`
      : null,
  };
}

/**
 * Add entry to session history
 */
function addSessionHistory(entry) {
  sessionHistory.push(entry);
  // Keep only last MAX_HISTORY_ENTRIES
  if (sessionHistory.length > MAX_HISTORY_ENTRIES) {
    sessionHistory.shift();
  }
}

/**
 * Remove user session
 */
export function removeUserSession(userId, sessionId) {
  const userSessions = activeSessions.get(userId);
  if (userSessions) {
    userSessions.delete(sessionId);
    sessionDetails.delete(sessionId);
    if (userSessions.size === 0) {
      activeSessions.delete(userId);
    } else {
      activeSessions.set(userId, userSessions);
    }
    
    // Add to history
    addSessionHistory({
      type: 'session_removed',
      userId,
      sessionId,
      reason: 'logout',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Update session activity
 */
export function updateSessionActivity(userId, sessionId) {
  const userSessions = activeSessions.get(userId);
  if (userSessions && userSessions.has(sessionId)) {
    // Update last activity
    const details = sessionDetails.get(sessionId);
    if (details) {
      details.lastActivity = new Date().toISOString();
      // Also update device info in case it changed (e.g., IP changed)
      return true;
    }
  }
  return false;
}

/**
 * Get active sessions for user
 */
export function getUserActiveSessions(userId) {
  return activeSessions.get(userId) || new Set();
}

/**
 * Cleanup expired sessions (call periodically)
 */
export function cleanupExpiredSessions() {
  // In production, this would check Redis TTL or database timestamps
  // For now, we keep sessions active until logout
  console.log(`[Session] Active sessions: ${activeSessions.size} users`);
}

/**
 * Get session history for monitoring
 */
export function getSessionHistory(limit = 100) {
  return {
    totalEntries: sessionHistory.length,
    activeSessions: activeSessions.size,
    activeUsers: Array.from(activeSessions.keys()).length,
    recentHistory: sessionHistory.slice(-limit).reverse(), // Most recent first
    summary: {
      totalSessionsCreated: sessionHistory.filter(e => e.type === 'session_created').length,
      totalSessionsRemoved: sessionHistory.filter(e => e.type === 'session_removed').length,
      deviceWarnings: sessionHistory.filter(e => e.shouldWarn === true).length,
    },
  };
}

/**
 * Get current active sessions (for dashboard)
 */
export function getCurrentSessions() {
  const currentSessions = [];
  
  for (const [userId, sessions] of activeSessions.entries()) {
    for (const sessionId of sessions) {
      const details = sessionDetails.get(sessionId);
      if (details) {
        currentSessions.push({
          ...details,
          sessionCount: sessions.size,
        });
      }
    }
  }
  
  // Sort by last activity (most recent first)
  currentSessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  
  return {
    totalActiveSessions: currentSessions.length,
    totalActiveUsers: activeSessions.size,
    sessions: currentSessions,
    summary: {
      byUser: Array.from(activeSessions.entries()).map(([userId, sessions]) => ({
        userId,
        sessionCount: sessions.size,
      })),
    },
  };
}

/**
 * Get active sessions details
 */
export function getActiveSessionsDetails() {
  const details = [];
  for (const [userId, sessions] of activeSessions.entries()) {
    details.push({
      userId,
      sessionCount: sessions.size,
      sessions: Array.from(sessions),
    });
  }
  return details;
}

/**
 * Track API request for traffic monitoring
 */
export function trackRequest(request, user = null) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
             request.headers.get('X-Real-IP') || 
             'unknown';
  const hour = new Date().getHours();
  
  // Update total requests
  trafficStats.totalRequests++;
  
  // Track by endpoint
  const endpointKey = `${method} ${endpoint}`;
  trafficStats.requestsByEndpoint.set(
    endpointKey,
    (trafficStats.requestsByEndpoint.get(endpointKey) || 0) + 1
  );
  
  // Track by user
  if (user) {
    const userKey = `${user.id}:${user.email}`;
    trafficStats.requestsByUser.set(
      userKey,
      (trafficStats.requestsByUser.get(userKey) || 0) + 1
    );
  }
  
  // Track by IP
  trafficStats.requestsByIP.set(
    ip,
    (trafficStats.requestsByIP.get(ip) || 0) + 1
  );
  
  // Track by hour
  trafficStats.requestsByHour.set(
    hour,
    (trafficStats.requestsByHour.get(hour) || 0) + 1
  );
}

/**
 * Get traffic statistics
 */
export function getTrafficStats() {
  // Convert Maps to arrays for JSON serialization
  const requestsByEndpoint = Array.from(trafficStats.requestsByEndpoint.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 endpoints
  
  const requestsByUser = Array.from(trafficStats.requestsByUser.entries())
    .map(([userKey, count]) => {
      const [userId, email] = userKey.split(':');
      return { userId: parseInt(userId), email, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 users
  
  const requestsByIP = Array.from(trafficStats.requestsByIP.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 IPs
  
  const requestsByHour = Array.from(trafficStats.requestsByHour.entries())
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour);
  
  const uptime = Math.floor((Date.now() - new Date(trafficStats.startTime).getTime()) / 1000);
  const requestsPerSecond = trafficStats.totalRequests / Math.max(uptime, 1);
  const requestsPerMinute = requestsPerSecond * 60;
  const requestsPerHour = requestsPerMinute * 60;
  
  return {
    summary: {
      totalRequests: trafficStats.totalRequests,
      uptimeSeconds: uptime,
      uptimeFormatted: formatUptime(uptime),
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      requestsPerHour: Math.round(requestsPerHour * 100) / 100,
      startTime: trafficStats.startTime,
      uniqueEndpoints: trafficStats.requestsByEndpoint.size,
      uniqueUsers: trafficStats.requestsByUser.size,
      uniqueIPs: trafficStats.requestsByIP.size,
    },
    topEndpoints: requestsByEndpoint,
    topUsers: requestsByUser,
    topIPs: requestsByIP,
    hourlyDistribution: requestsByHour,
  };
}

/**
 * Format uptime to human readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);
