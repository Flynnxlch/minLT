# Backend-Frontend Connection Test Guide

## Prerequisites

1. **Backend Server** should be running on `http://localhost:3001`
2. **Frontend** should be running on `http://localhost:5173`

## How to Test Connection

### Step 1: Start Backend Server

```bash
cd Backend
bun run dev
```

The backend should start on port 3001. You should see:
```
✅ Server running at http://localhost:3001
```

### Step 2: Start Frontend

```bash
# In the root directory
npm run dev
# or
vite
```

The frontend should start on port 5173.

### Step 3: Test Login

1. Navigate to `http://localhost:5173/login`
2. Try logging in with:

   **Valid Test Credentials** (from seed):
   - **Admin Pusat**: 
     - Email: `admin@adminlte.io`
     - Password: `admin123`
   - **Admin Cabang**: 
     - Email: `admincabang@adminlte.io`
     - Password: `admin123`
   - **Regular User**: 
     - Email: `user@adminlte.io`
     - Password: `user123`

   **Invalid Credentials** (to test error popup):
   - Enter any wrong email/password combination
   - You should see an error popup: "Invalid email or password"

### Expected Behavior

#### ✅ Successful Connection:
- Login with valid credentials should work
- User should be redirected to dashboard
- Token should be stored in localStorage

#### ❌ Failed Connection:
- Error popup will show: "Unable to connect to server. Please check if the backend is running."
- This means the backend is not running or not accessible

#### ❌ Invalid Credentials:
- Error popup will show: "Invalid email or password"
- This means backend is connected but credentials are wrong

## API Configuration

The frontend is configured to connect to:
- **Base URL**: `http://localhost:3001` (default)
- **Login Endpoint**: `http://localhost:3001/api/auth/login`

You can override this by setting `VITE_API_BASE_URL` in a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Troubleshooting

### Backend not connecting?

1. Check if backend is running:
   ```bash
   curl http://localhost:3001/api/auth/login
   ```

2. Check CORS settings in `Backend/src/config/index.js`:
   ```js
   cors: {
     origin: 'http://localhost:5173', // Should match frontend URL
   }
   ```

3. Check backend logs for errors

### Frontend showing connection errors?

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab to see if requests are being made
4. Verify the API endpoint URL in `src/config/api.js`

## Testing with Seeded Users

Default users are created when you run:
```bash
cd Backend
bun run prisma:seed
```

**Seeded Users:**
1. **Admin Pusat** (`admin@adminlte.io` / `admin123`)
2. **Admin Cabang** (`admincabang@adminlte.io` / `admin123`)
3. **Regular User** (`user@adminlte.io` / `user123`)

## What's New

✅ **Error Popup**: When login fails (wrong email/password), a modal popup will appear with the error message
✅ **Backend Connection**: Frontend now connects to backend API at `http://localhost:3001`
✅ **Token Management**: JWT tokens are automatically stored and sent with requests
✅ **Connection Error Handling**: If backend is not running, you'll see a clear error message
