# Quick Setup: Enable Network Access for MinLT

This is a quick reference for enabling network access. For detailed explanations, see `LOCAL_NETWORK_ACCESS_GUIDE.md`.

## Prerequisites

1. Find your local IP address:
   ```powershell
   # Windows
   ipconfig | findstr IPv4
   ```
   Example output: `192.168.1.105`

## Step 1: Update Vite Config (Frontend)

**File:** `vite.config.js`

Add the `server` configuration:

```javascript
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Allow network access
    port: 5173,
  },
  // ... rest of your existing config
})
```

## Step 2: Update API Config (Frontend)

**File:** `src/config/api.js`

Replace the `API_BASE_URL` definition with:

```javascript
// API Configuration
// Automatically uses the same hostname as the frontend
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (import.meta.env.PROD) {
    return '';
  }
  
  // Use the same hostname as the frontend (works for both localhost and network IP)
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();
```

## Step 3: Update CORS Config (Backend)

**File:** `Backend/src/config/index.js`

Update the CORS origin to allow both localhost and local IP:

```javascript
// Load environment variables
const env = process.env;

// Get local IP from environment or use default
const LOCAL_IP = env.LOCAL_IP || '192.168.1.105'; // ⚠️ Replace with your IP
const FRONTEND_PORT = env.FRONTEND_PORT || '5173';

export const config = {
  // Server configuration
  port: parseInt(env.PORT || '3001', 10),
  nodeEnv: env.NODE_ENV || 'development',
  
  // CORS configuration - allow both localhost and network IP
  cors: {
    origin: env.CORS_ORIGIN 
      ? (env.CORS_ORIGIN.includes(',') 
          ? env.CORS_ORIGIN.split(',').map(o => o.trim())
          : env.CORS_ORIGIN)
      : [
          `http://localhost:${FRONTEND_PORT}`,
          `http://127.0.0.1:${FRONTEND_PORT}`,
          `http://${LOCAL_IP}:${FRONTEND_PORT}`,
        ],
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    headers: 'Content-Type, Authorization, X-Requested-With',
  },
  
  // ... rest of your existing config
};
```

**OR** add to `Backend/.env`:

```env
LOCAL_IP=192.168.1.105
CORS_ORIGIN=http://localhost:5173,http://192.168.1.105:5173
```

## Step 4: Update CORS Middleware (Backend)

**File:** `Backend/src/middleware/cors.js`

Update to handle multiple origins:

```javascript
import { config } from '../config/index.js';

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  const allowedOrigins = Array.isArray(config.cors.origin) 
    ? config.cors.origin 
    : [config.cors.origin];
  
  // Allow localhost variants
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  
  // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const localNetworkRegex = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
  if (localNetworkRegex.test(origin)) {
    return true;
  }
  
  // Check against configured origins
  return allowedOrigins.includes(origin);
}

/**
 * Get allowed origin for response
 */
function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) {
    return Array.isArray(config.cors.origin) ? config.cors.origin[0] : config.cors.origin;
  }
  
  if (isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }
  
  return Array.isArray(config.cors.origin) ? config.cors.origin[0] : config.cors.origin;
}

/**
 * CORS middleware for handling preflight requests
 */
export function corsMiddleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': config.cors.methods,
        'Access-Control-Allow-Headers': config.cors.headers,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // Return null to continue processing
  return null;
}
```

## Step 5: Update Server.js (Backend)

**File:** `Backend/src/server.js`

Update the CORS header setting to use dynamic origin (around line 56-60):

```javascript
// ... existing code ...

// Add CORS headers
const origin = request.headers.get('origin');
const allowedOrigins = Array.isArray(config.cors.origin) 
  ? config.cors.origin 
  : [config.cors.origin];

// Check if origin is allowed
const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
const isLocalNetwork = origin && /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
const isAllowed = origin && (allowedOrigins.includes(origin) || isLocalhost || isLocalNetwork);

const corsOrigin = isAllowed ? origin : allowedOrigins[0];

headers.set('Access-Control-Allow-Origin', corsOrigin);
headers.set('Access-Control-Allow-Methods', config.cors.methods);
headers.set('Access-Control-Allow-Headers', config.cors.headers);
headers.set('Access-Control-Allow-Credentials', 'true');

// ... rest of existing code ...
```

## Step 6: Configure Windows Firewall

Run PowerShell as Administrator:

```powershell
# Allow frontend port
New-NetFirewallRule -DisplayName "MinLT Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow backend port
New-NetFirewallRule -DisplayName "MinLT Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## Step 7: Start Servers

**Terminal 1 - Backend:**
```bash
cd Backend
bun run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.105:5173/
```

## Step 8: Access from Another Device

On another device on the same WiFi, open:
```
http://192.168.1.105:5173
```

Replace `192.168.1.105` with your actual IP address.

## Troubleshooting

1. **Can't connect?** Check firewall rules are active
2. **CORS errors?** Verify CORS config includes your IP
3. **API calls fail?** Check browser console for errors
4. **Wrong IP?** Run `ipconfig` (Windows) to get current IP

## Notes

- Your backend already listens on `0.0.0.0` ✅ (no changes needed)
- Remember to update `LOCAL_IP` in config or `.env` with your actual IP
- IP addresses can change if you reconnect to WiFi (use DHCP reservation for static IP)
