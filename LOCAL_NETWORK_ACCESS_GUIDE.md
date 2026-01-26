# Local Network Access Guide: Making Your React + Backend App Accessible on WiFi

**Role:** Senior Full-Stack Developer and Network Administrator  
**Objective:** Enable local network access to your React frontend and Backend API so other devices on the same WiFi can access your application.

---

## Table of Contents

1. [Identify Local IP Address](#step-1-identify-local-ip-address)
2. [Configure the Backend (Server)](#step-2-configure-the-backend-server)
3. [Configure the Frontend (React)](#step-3-configure-the-frontend-react)
4. [Handle CORS (Cross-Origin Resource Sharing)](#step-4-handle-cors-cross-origin-resource-sharing)
5. [Configure System Firewall](#step-5-configure-system-firewall)
6. [Connecting from Other Devices](#step-6-connecting-from-other-devices)

---

## Step 1: Identify Local IP Address

### Instructions

#### Windows

**Method 1: Using Command Prompt**
```powershell
ipconfig
```
Look for the **IPv4 Address** under your active network adapter (usually "Wireless LAN adapter Wi-Fi" or "Ethernet adapter Ethernet"). It will look like `192.168.x.x` or `10.x.x.x`.

**Method 2: Using PowerShell**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"} | Select-Object IPAddress, InterfaceAlias
```

**Method 3: Using Network Settings (GUI)**
1. Open **Settings** → **Network & Internet** → **Wi-Fi** (or **Ethernet**)
2. Click on your connected network
3. Scroll down to find **IPv4 address**

#### macOS

**Method 1: Using Terminal**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for the IP address that starts with `192.168.` or `10.`

**Method 2: Using System Preferences**
1. Open **System Preferences** → **Network**
2. Select your active connection (Wi-Fi or Ethernet)
3. The IP address is displayed on the right

#### Linux

**Method 1: Using ip command**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Method 2: Using ifconfig**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Method 3: Using hostname**
```bash
hostname -I
```

### Example Output

Your IP address will typically look like:
- `192.168.1.105`
- `192.168.0.50`
- `10.0.0.25`

**📝 Note:** Write down this IP address - you'll need it for the following steps!

---

### Why is this necessary?

**Technical Explanation:**

When you access `localhost` or `127.0.0.1` on your computer, you're using the **loopback interface** - a virtual network interface that only exists on your local machine. The loopback interface is designed to route traffic back to the same machine, and it's not accessible from other devices on the network.

**What happens with localhost:**
- `localhost` resolves to `127.0.0.1` (IPv4) or `::1` (IPv6)
- This address is **only valid on your computer**
- Other devices on the network cannot reach `127.0.0.1` because it's not a real network address

**What happens with your local IP:**
- Your local IP (e.g., `192.168.1.105`) is assigned by your router via DHCP
- This is your computer's **actual address on the local network**
- Other devices can reach this address because it's part of the same network subnet

**Consequences of skipping this step:**
- Other devices will try to connect to `localhost` on their own machines (not yours)
- Connection attempts will fail with "Connection refused" or timeout errors
- The application will only work on the development machine

**Network Layer Explanation:**
```
Device A (192.168.1.105) → Router → Device B (192.168.1.106)
     ✅ Can communicate using IP addresses

Device A → localhost (127.0.0.1)
     ❌ Only accessible on Device A itself
```

---

## Step 2: Configure the Backend (Server)

### Instructions

Your backend is already configured to listen on `0.0.0.0` in `Backend/src/server.js` (line 15), which is correct! However, let's verify and understand the configuration.

#### Current Configuration (Bun Server)

Your server is already set up correctly:
```javascript
// Backend/src/server.js (line 14-16)
const server = serve({
  hostname: '0.0.0.0', // ✅ Already configured correctly!
  port: config.port,
  // ...
});
```

#### For Other Backend Stacks

**Node.js/Express:**
```javascript
// Instead of:
app.listen(3001, 'localhost', () => {
  console.log('Server running on localhost:3001');
});

// Use:
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3001');
});

// Or simply (0.0.0.0 is the default):
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

**Python/Flask:**
```python
# Instead of:
app.run(host='127.0.0.1', port=5000)

# Use:
app.run(host='0.0.0.0', port=5000)
```

**Python/FastAPI:**
```python
# Instead of:
uvicorn.run(app, host="127.0.0.1", port=8000)

# Use:
uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Go (net/http):**
```go
// Instead of:
http.ListenAndServe("127.0.0.1:8080", nil)

// Use:
http.ListenAndServe("0.0.0.0:8080", nil)
```

### Verification

After starting your backend, you should see:
```
✅ Server running on 0.0.0.0:3001
```

This confirms the server is listening on all network interfaces.

---

### Why is this necessary?

**Technical Explanation:**

**localhost (127.0.0.1) vs 0.0.0.0:**

1. **`127.0.0.1` (localhost):**
   - Binds the server to the **loopback interface only**
   - Only accepts connections from the same machine
   - Network packets sent to this address never leave your computer
   - Other devices cannot establish TCP connections to this address

2. **`0.0.0.0` (all interfaces):**
   - Binds the server to **all available network interfaces**
   - Accepts connections from:
     - The local machine (via loopback)
     - Other devices on the local network (via WiFi/Ethernet)
     - Any other network interface (VPN, etc.)
   - Makes the server reachable from the network

**Network Socket Binding:**
```
Binding to 127.0.0.1:3001:
  └─ Server socket only listens on loopback interface
  └─ External connection attempts → Connection refused

Binding to 0.0.0.0:3001:
  └─ Server socket listens on ALL interfaces
  └─ External connection attempts → Accepted ✅
```

**What happens if you skip this:**
- The server only binds to the loopback interface
- When Device B tries to connect to `192.168.1.105:3001`, the connection is refused
- The server never receives the connection request because it's not listening on the network interface
- Error: `ECONNREFUSED` or "Connection refused"

**Security Note:**
Binding to `0.0.0.0` makes your server accessible to anyone on your local network. This is fine for development, but in production, you should use a reverse proxy (like Nginx) with proper firewall rules.

---

## Step 3: Configure the Frontend (React)

### Instructions

#### For Vite (Your Current Setup)

**Method 1: Command Line Flag (Recommended for Quick Testing)**

Update your `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite --host",
    "dev:network": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host"
  }
}
```

Then run:
```bash
npm run dev
# or
npm run dev:network
```

**Method 2: Vite Configuration File (Permanent Solution)**

Update `vite.config.js`:
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
    host: '0.0.0.0', // Allow access from network
    port: 5173, // Your current port
    strictPort: false, // Allow port fallback if 5173 is taken
  },
  // ... rest of your config
})
```

#### For Create React App (CRA)

Set the `HOST` environment variable:
```bash
# Windows (PowerShell)
$env:HOST="0.0.0.0"; npm start

# Windows (CMD)
set HOST=0.0.0.0 && npm start

# macOS/Linux
HOST=0.0.0.0 npm start
```

Or add to `.env` file:
```env
HOST=0.0.0.0
```

#### For Next.js

```bash
# Command line
next dev -H 0.0.0.0

# Or in package.json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

### Verification

After starting the dev server, you should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.105:5173/
  ➜  Network: http://10.0.0.25:5173/
```

The "Network" URLs are what other devices should use!

---

### Why is this necessary?

**Technical Explanation:**

**Default Behavior:**
Development servers (Vite, Webpack, Next.js, etc.) default to binding on `localhost` (127.0.0.1) for security reasons:
- Prevents accidental exposure to the network
- Reduces attack surface during development
- Follows the principle of least privilege

**What `--host` or `host: '0.0.0.0'` does:**
- Changes the binding from `127.0.0.1` to `0.0.0.0`
- Makes the dev server listen on all network interfaces
- Allows incoming connections from other devices on the network

**Network Flow:**
```
Without --host flag:
  Device B → 192.168.1.105:5173 → Connection refused ❌
  (Server only listening on 127.0.0.1)

With --host flag:
  Device B → 192.168.1.105:5173 → Connection accepted ✅
  (Server listening on 0.0.0.0, accepts from any interface)
```

**What happens if you skip this:**
- The dev server only accepts connections from `localhost`
- Other devices cannot load the React app
- Browser shows "This site can't be reached" or connection timeout
- Even if the backend is accessible, the frontend won't load

**Security Consideration:**
The `--host` flag exposes your dev server to the local network. This is safe on trusted networks (home/office WiFi), but avoid using it on public networks. The dev server also includes hot module replacement (HMR) which can be a security risk if exposed publicly.

---

## Step 4: Handle CORS (Cross-Origin Resource Sharing)

### Instructions

#### Current Configuration

Your backend already has CORS middleware, but it's currently configured to only allow `http://localhost:5173`. We need to update it to allow your local IP address.

#### Update Backend CORS Configuration

**Option 1: Allow Multiple Origins (Recommended for Development)**

Update `Backend/src/config/index.js`:
```javascript
// Load environment variables
const env = process.env;

// Get your local IP (you'll set this in .env)
const LOCAL_IP = env.LOCAL_IP || '192.168.1.105'; // Replace with your IP
const FRONTEND_PORT = env.FRONTEND_PORT || '5173';

export const config = {
  // ... other config
  cors: {
    // Allow both localhost and local IP
    origin: env.CORS_ORIGIN || [
      `http://localhost:${FRONTEND_PORT}`,
      `http://127.0.0.1:${FRONTEND_PORT}`,
      `http://${LOCAL_IP}:${FRONTEND_PORT}`,
    ],
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    headers: 'Content-Type, Authorization, X-Requested-With',
    credentials: true,
  },
  // ... rest of config
};
```

**Option 2: Use Environment Variable (More Flexible)**

Update `Backend/.env`:
```env
# Add your local IP address
LOCAL_IP=192.168.1.105
CORS_ORIGIN=http://192.168.1.105:5173,http://localhost:5173
```

Then update `Backend/src/config/index.js`:
```javascript
export const config = {
  // ... other config
  cors: {
    // Parse comma-separated origins or use default
    origin: env.CORS_ORIGIN 
      ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : 'http://localhost:5173',
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    headers: 'Content-Type, Authorization, X-Requested-With',
    credentials: true,
  },
  // ... rest of config
};
```

**Option 3: Dynamic Origin Detection (Advanced)**

Update `Backend/src/middleware/cors.js`:
```javascript
import { config } from '../config/index.js';

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin) {
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
 * CORS middleware for handling preflight requests
 */
export function corsMiddleware(request) {
  const origin = request.headers.get('origin');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const allowedOrigin = origin && isOriginAllowed(origin) ? origin : config.cors.origin[0];
    
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

And update `Backend/src/server.js` to use dynamic origin:
```javascript
// In the fetch handler, around line 56-60
const origin = request.headers.get('origin');
const allowedOrigin = origin && isOriginAllowed(origin) 
  ? origin 
  : (Array.isArray(config.cors.origin) ? config.cors.origin[0] : config.cors.origin);

headers.set('Access-Control-Allow-Origin', allowedOrigin);
```

#### Update Frontend API Configuration

Update `src/config/api.js` to use your local IP when accessing from network:

**Option 1: Environment Variable**
Create `.env` in the root directory:
```env
# For localhost access (default)
VITE_API_BASE_URL=http://localhost:3001

# For network access, use your local IP
# VITE_API_BASE_URL=http://192.168.1.105:3001
```

**Option 2: Dynamic Detection (Recommended)**
Update `src/config/api.js`:
```javascript
// Detect if we're accessing from localhost or network
const getApiBaseUrl = () => {
  // Check if VITE_API_BASE_URL is explicitly set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production, use relative paths (Nginx will proxy)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use the same host as the frontend
  // This automatically works for both localhost and network IP
  const hostname = window.location.hostname;
  const port = '3001'; // Your backend port
  
  // If accessing via localhost, use localhost for API
  // If accessing via IP, use the same IP for API
  return `http://${hostname}:${port}`;
};

export const API_BASE_URL = getApiBaseUrl();
```

This way, if someone accesses `http://192.168.1.105:5173`, the API calls will automatically go to `http://192.168.1.105:3001`.

### Verification

1. Start your backend and frontend
2. Open browser DevTools (F12) → Network tab
3. Access the app from another device using `http://YOUR_IP:5173`
4. Check the Network tab - API requests should succeed (status 200)
5. If CORS is misconfigured, you'll see errors like:
   - `Access to fetch at 'http://192.168.1.105:3001/api/...' from origin 'http://192.168.1.105:5173' has been blocked by CORS policy`

---

### Why is this necessary?

**Technical Explanation:**

**Same-Origin Policy:**
Browsers enforce the **Same-Origin Policy** for security. Two URLs are considered the same origin if they have:
- Same **protocol** (http/https)
- Same **domain** (or IP address)
- Same **port**

Examples:
- `http://localhost:5173` and `http://localhost:3001` → **Different origins** (different ports)
- `http://192.168.1.105:5173` and `http://192.168.1.105:3001` → **Different origins** (different ports)
- `http://localhost:5173` and `http://192.168.1.105:5173` → **Different origins** (different hosts)

**CORS (Cross-Origin Resource Sharing):**
When the frontend (origin A) tries to make a request to the backend (origin B), the browser:
1. Sends a **preflight OPTIONS request** to check if the server allows cross-origin requests
2. The server must respond with appropriate CORS headers:
   - `Access-Control-Allow-Origin`: Which origins are allowed
   - `Access-Control-Allow-Methods`: Which HTTP methods are allowed
   - `Access-Control-Allow-Headers`: Which headers can be sent
   - `Access-Control-Allow-Credentials`: Whether cookies/auth headers are allowed

**What happens without proper CORS:**
```
Browser (192.168.1.105:5173) → Backend (192.168.1.105:3001)
  ↓
Browser sends preflight OPTIONS request
  ↓
Backend responds with CORS headers
  ↓
If origin not in Access-Control-Allow-Origin:
  ❌ Browser blocks the request
  ❌ Console error: "CORS policy blocked"
  ❌ Network tab shows: "CORS error" or "Failed to fetch"
```

**Common CORS Errors:**
1. **"No 'Access-Control-Allow-Origin' header"**
   - Backend not sending CORS headers
   - Solution: Add CORS middleware

2. **"Origin 'http://192.168.1.105:5173' is not allowed"**
   - Backend only allows `localhost:5173`
   - Solution: Add your IP to allowed origins

3. **"Credentials flag is true, but 'Access-Control-Allow-Credentials' is not 'true'"**
   - Frontend sending credentials (cookies/auth headers)
   - Backend not allowing credentials
   - Solution: Set `credentials: true` in CORS config

**Why localhost works but IP doesn't:**
- `localhost` and `192.168.1.105` are **different origins** from the browser's perspective
- Even though they point to the same machine, the browser treats them as different
- The backend must explicitly allow both origins in CORS headers

**Security Note:**
CORS is a browser security feature, not a server security feature. It prevents malicious websites from making unauthorized requests on behalf of users. However, CORS can be bypassed by non-browser clients (Postman, curl, etc.), so always validate requests on the server side.

---

## Step 5: Configure System Firewall

### Instructions

#### Windows Firewall

**Method 1: Allow Through Windows Defender Firewall (GUI)**

1. Open **Windows Security** → **Firewall & network protection**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP** and enter your ports:
   - **Frontend port:** `5173`
   - **Backend port:** `3001`
   - Or select **Specific local ports** and enter: `5173,3001`
6. Click **Next**
7. Select **Allow the connection** → **Next**
8. Check all profiles (Domain, Private, Public) → **Next**
9. Name it: "MinLT Development Server" → **Finish**

**Method 2: Using PowerShell (Quick Method)**

Run PowerShell as Administrator:
```powershell
# Allow frontend port
New-NetFirewallRule -DisplayName "MinLT Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow backend port
New-NetFirewallRule -DisplayName "MinLT Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Method 3: Temporary Allow (For Testing)**

```powershell
# Allow ports temporarily (until next reboot)
netsh advfirewall firewall add rule name="MinLT Dev" dir=in action=allow protocol=TCP localport=5173,3001
```

**Verify Firewall Rules:**
```powershell
# List all firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*MinLT*"}

# Check if ports are open
Test-NetConnection -ComputerName localhost -Port 5173
Test-NetConnection -ComputerName localhost -Port 3001
```

#### macOS Firewall

**Method 1: System Settings (GUI)**

1. Open **System Settings** → **Network** → **Firewall**
2. Click **Options** (or **Firewall Options**)
3. Click the **+** button
4. Navigate to your Node.js/Bun executable:
   - Bun: Usually in `/usr/local/bin/bun` or `~/.bun/bin/bun`
   - Node: Usually in `/usr/local/bin/node`
5. Select it and click **Add**
6. Ensure it's set to **Allow incoming connections**

**Method 2: Using Terminal**

```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow specific ports (requires admin)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/bun
```

#### Linux (iptables/ufw)

**Ubuntu/Debian (ufw):**
```bash
# Allow frontend port
sudo ufw allow 5173/tcp

# Allow backend port
sudo ufw allow 3001/tcp

# Check status
sudo ufw status
```

**Other Linux (iptables):**
```bash
# Allow frontend port
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT

# Allow backend port
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT

# Save rules (varies by distribution)
sudo iptables-save > /etc/iptables/rules.v4
```

### Verification

**Test from Another Device:**
```bash
# From another device on the same network
# Replace 192.168.1.105 with your IP

# Test backend
curl http://192.168.1.105:3001/api/health
# or
telnet 192.168.1.105 3001

# Test frontend
curl http://192.168.1.105:5173
```

If the firewall is blocking, you'll get:
- Connection timeout
- "Connection refused" (though this could also be a server binding issue)
- No response

---

### Why is this necessary?

**Technical Explanation:**

**Firewall Function:**
A firewall acts as a **network security barrier** that controls incoming and outgoing traffic based on predefined rules. Even if your application code is correctly configured, the firewall can block connections before they reach your application.

**How Firewalls Work:**
```
External Device → Router → Your Computer's Firewall → Your Application
                                    ↓
                          Firewall checks rules:
                          - Is this port allowed?
                          - Is this protocol allowed?
                          - Is this source IP allowed?
                                    ↓
                          If blocked: Connection dropped ❌
                          If allowed: Connection forwarded to app ✅
```

**Default Firewall Behavior:**
- **Windows:** Blocks most incoming connections by default (except established connections)
- **macOS:** Blocks incoming connections unless explicitly allowed
- **Linux:** Depends on distribution, but often blocks by default

**What happens if you skip this step:**
1. Your server binds to `0.0.0.0:3001` ✅
2. Your frontend runs with `--host` flag ✅
3. CORS is configured correctly ✅
4. **BUT:** Firewall blocks incoming connections on ports 3001 and 5173 ❌
5. Result: Connection timeout or "Connection refused" from other devices

**Network Stack:**
```
Application Layer (Your App)
        ↓
Transport Layer (TCP/UDP)
        ↓
Network Layer (IP)
        ↓
Firewall (Blocks/Allows)
        ↓
Network Interface (WiFi/Ethernet)
```

The firewall operates at a lower level than your application. Even if your app is listening correctly, the firewall can intercept and drop packets before they reach your application's socket.

**Common Scenarios:**
1. **Development machine:** Firewall blocks → Other devices can't connect
2. **Corporate network:** Additional firewall rules → May need IT approval
3. **Public WiFi:** Often has strict firewall rules → May not work at all

**Security Consideration:**
Opening ports in the firewall exposes your application to the local network. This is generally safe on trusted networks (home/office), but:
- Only open ports you need
- Close ports when not in use
- Use strong authentication in your application
- Consider using a VPN for remote access instead

**Troubleshooting:**
If connections still fail after configuring the firewall:
1. Check if another firewall (antivirus, corporate firewall) is active
2. Verify the firewall rule is enabled and not blocked by another rule
3. Test with firewall temporarily disabled (for debugging only)
4. Check router settings (some routers have firewall features)

---

## Step 6: Connecting from Other Devices

### Instructions

#### Prerequisites Checklist

Before connecting, ensure:
- ✅ You've completed Steps 1-5
- ✅ Backend is running and accessible
- ✅ Frontend is running with `--host` flag
- ✅ Firewall allows connections on ports 3001 and 5173
- ✅ Both devices are on the **same WiFi network**

#### Finding Your IP Address (Reminder)

**Windows:**
```powershell
ipconfig | findstr IPv4
```

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### Accessing from Another Device

**Step 1: Get Your Development Machine's IP**
Example: `192.168.1.105`

**Step 2: Access the Frontend**

On the other device (phone, tablet, another computer), open a web browser and navigate to:

```
http://192.168.1.105:5173
```

**Important Notes:**
- Use **HTTP** (not HTTPS) unless you've set up SSL certificates
- Include the **port number** (`:5173`)
- Use the **IP address**, not `localhost` or a hostname
- Ensure both devices are on the **same network**

#### Mobile Devices (iOS/Android)

1. Open Safari (iOS) or Chrome (Android)
2. Type in the address bar: `http://192.168.1.105:5173`
3. The app should load (may take a moment on first load)

**Troubleshooting on Mobile:**
- If the page doesn't load, check:
  - Both devices are on the same WiFi (not mobile data)
  - Firewall is configured correctly
  - Backend is running and accessible

#### Other Computers (Windows/macOS/Linux)

1. Open any web browser
2. Navigate to: `http://192.168.1.105:5173`
3. The React app should load

#### Testing the Connection

**From Another Device:**

1. **Test Frontend Access:**
   - Open `http://YOUR_IP:5173`
   - You should see your React app

2. **Test Backend API:**
   - Open `http://YOUR_IP:3001/api/health` (if you have a health endpoint)
   - Or check browser DevTools → Network tab when using the app
   - API requests should return 200 status codes

3. **Test Full Flow:**
   - Try logging in or performing an action that calls the API
   - Check that data loads correctly
   - Verify CORS is working (no CORS errors in console)

#### Common Issues and Solutions

**Issue 1: "This site can't be reached" or Connection Timeout**

**Possible Causes:**
- Devices not on the same network
- Firewall blocking connections
- Server not bound to `0.0.0.0`
- Wrong IP address

**Solutions:**
1. Verify both devices are on the same WiFi network
2. Check firewall rules are active
3. Verify server is running: `netstat -an | findstr :3001` (Windows) or `lsof -i :3001` (macOS/Linux)
4. Double-check IP address with `ipconfig` or `ifconfig`

**Issue 2: CORS Errors in Browser Console**

**Error:** `Access to fetch at 'http://192.168.1.105:3001/...' from origin 'http://192.168.1.105:5173' has been blocked by CORS policy`

**Solution:**
- Update CORS configuration to include your IP address (see Step 4)
- Restart the backend server after changing CORS settings

**Issue 3: Page Loads but API Calls Fail**

**Possible Causes:**
- Frontend still using `localhost` for API calls
- Backend CORS not configured for IP address
- Backend not accessible from network

**Solutions:**
1. Update `src/config/api.js` to use dynamic hostname (see Step 4)
2. Update backend CORS to allow your IP
3. Verify backend is accessible: `curl http://YOUR_IP:3001/api/health`

**Issue 4: Works on Some Devices but Not Others**

**Possible Causes:**
- Router blocking inter-device communication
- Device-specific firewall settings
- Network isolation (guest network, AP isolation)

**Solutions:**
1. Check router settings for "AP Isolation" or "Client Isolation" (disable it)
2. Ensure devices are on the same network segment
3. Try accessing from a device on the same network type (both WiFi or both Ethernet)

#### Quick Connection Test Script

Create a test file to verify connectivity:

**test-connection.js:**
```javascript
// Run this from another device to test connectivity
const testIP = '192.168.1.105'; // Replace with your IP

async function testConnection() {
  console.log(`Testing connection to ${testIP}...\n`);
  
  // Test backend
  try {
    const backendResponse = await fetch(`http://${testIP}:3001/api/health`);
    console.log('✅ Backend accessible:', backendResponse.status);
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
  }
  
  // Test frontend
  try {
    const frontendResponse = await fetch(`http://${testIP}:5173`);
    console.log('✅ Frontend accessible:', frontendResponse.status);
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
  }
}

testConnection();
```

---

### Why is this necessary?

**Technical Explanation:**

**How Network Routing Works:**

When Device B tries to access `http://192.168.1.105:5173`:

1. **DNS Resolution (if using hostname):**
   - Browser resolves hostname to IP address
   - For IP addresses, this step is skipped

2. **TCP Connection Establishment:**
   ```
   Device B (192.168.1.106)                    Device A (192.168.1.105)
        |                                              |
        |  SYN (Synchronize)                          |
        |-------------------------------------------->|
        |                                              |
        |  SYN-ACK (Synchronize-Acknowledge)          |
        |<--------------------------------------------|
        |                                              |
        |  ACK (Acknowledge)                          |
        |-------------------------------------------->|
        |                                              |
        |  Connection Established ✅                   |
   ```

3. **HTTP Request:**
   ```
   Device B sends: GET / HTTP/1.1
                   Host: 192.168.1.105:5173
   
   Device A responds: HTTP/1.1 200 OK
                      Content-Type: text/html
                      <!DOCTYPE html>...
   ```

**Network Components:**
```
Device B Browser
    ↓
Device B Network Stack
    ↓
WiFi/Ethernet Interface
    ↓
Router (192.168.1.1)
    ↓ (Routes based on IP address)
WiFi/Ethernet Interface
    ↓
Device A Firewall
    ↓ (Checks rules)
Device A Network Stack
    ↓
Device A Application (Port 5173)
```

**Why IP + Port is Required:**
- **IP Address (`192.168.1.105`):** Identifies the target device on the network
- **Port (`5173`):** Identifies the specific application/service on that device
- Together, they form a **socket address** that uniquely identifies where to send the request

**What happens when you use localhost:**
```
Device B → http://localhost:5173
    ↓
Browser resolves localhost → 127.0.0.1 (Device B's loopback)
    ↓
Connection attempt to Device B's own port 5173
    ↓
Device B doesn't have a server on port 5173
    ↓
Connection refused ❌
```

**What happens with IP address:**
```
Device B → http://192.168.1.105:5173
    ↓
Browser sends request to IP 192.168.1.105, port 5173
    ↓
Router routes packet to Device A (192.168.1.105)
    ↓
Device A's firewall checks rules
    ↓
If allowed: Packet reaches Device A's application
    ↓
Application responds with HTML/JS
    ↓
Device B receives response ✅
```

**Network Protocols Involved:**
1. **ARP (Address Resolution Protocol):** Resolves IP to MAC address for local network
2. **IP (Internet Protocol):** Routes packets to the correct device
3. **TCP (Transmission Control Protocol):** Establishes reliable connection
4. **HTTP (Hypertext Transfer Protocol):** Application-layer protocol for web requests

**Summary:**
The IP address tells the network **where** to send the request (which device), and the port tells the device **which application** should handle it. Without both pieces of information, the request cannot be routed correctly through the network stack from Device B to Device A's application.

---

## Quick Reference Checklist

Use this checklist to ensure everything is configured:

- [ ] **Step 1:** Identified local IP address (e.g., `192.168.1.105`)
- [ ] **Step 2:** Backend configured to listen on `0.0.0.0` (already done in your project ✅)
- [ ] **Step 3:** Frontend started with `--host` flag or `host: '0.0.0.0'` in config
- [ ] **Step 4:** CORS updated to allow your local IP address
- [ ] **Step 5:** Firewall rules added for ports 3001 and 5173
- [ ] **Step 6:** Tested access from another device using `http://YOUR_IP:5173`

---

## Security Best Practices

1. **Only use on trusted networks** (home/office WiFi, not public WiFi)
2. **Close ports when not in use** (disable firewall rules after development)
3. **Use strong authentication** in your application
4. **Consider using a VPN** for remote access instead of exposing ports
5. **Don't use in production** - deploy to a proper server with HTTPS

---

## Troubleshooting Summary

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Connection timeout | Firewall blocking | Configure firewall (Step 5) |
| CORS errors | Backend not allowing IP | Update CORS config (Step 4) |
| "This site can't be reached" | Wrong IP or server not running | Verify IP and server status |
| Works on localhost but not network | Server bound to 127.0.0.1 | Bind to 0.0.0.0 (Step 2) |
| Frontend loads but API fails | Frontend using localhost for API | Update API config (Step 4) |

---

## Additional Resources

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [Windows Firewall Documentation](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-firewall/)

---

**Last Updated:** January 2026  
**Project:** MinLT - Risk Management System
