# Complete Setup Guide - From Scratch to Production

This guide will walk you through setting up the MinLT Backend from scratch, including creating a Supabase project, configuring Prisma, and running migrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Supabase Project](#step-1-create-supabase-project)
3. [Step 2: Get Database Connection String](#step-2-get-database-connection-string)
4. [Step 3: Install Dependencies](#step-3-install-dependencies)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Initialize Prisma](#step-5-initialize-prisma)
7. [Step 6: Run Migrations](#step-6-run-migrations)
8. [Step 7: Seed Database (Optional)](#step-7-seed-database-optional)
9. [Step 8: Start the Server](#step-8-start-the-server)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Bun** installed ([Download Bun](https://bun.sh))
- **Git** installed
- **A Supabase account** (free tier is sufficient) - [Sign up at supabase.com](https://supabase.com)
- **Node.js 18+** (optional, for Prisma CLI if Bun doesn't work)

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign up with GitHub, Google, or email

### 1.2 Create New Project

1. Once logged in, click **"New Project"** button
2. Fill in the project details:
   - **Name**: `minlt-risk-management` (or any name you prefer)
   - **Database Password**: Create a strong password (save this - you'll need it!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Select "Free" for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for Supabase to provision your database

### 1.3 Note Your Project Details

After creation, you'll see your project dashboard. Keep this page open - you'll need:
- Project URL
- Database password (the one you just created)

---

## Step 2: Get Database Connection String

### 2.1 Navigate to Database Settings

1. In your Supabase project dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"Database"** in the settings menu

### 2.2 Get Connection String

1. Scroll down to **"Connection string"** section
2. Find the **"URI"** tab (not "Session mode" or "Transaction mode")
3. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. **Copy this entire string** - you'll use it in the next step
5. Replace `[YOUR-PASSWORD]` with the actual password you created in Step 1.2

**Example:**
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## Step 3: Install Dependencies

### 3.1 Navigate to Backend Directory

Open your terminal and navigate to the Backend folder:

```bash
cd Backend
```

### 3.2 Install Required Packages

Run the following commands to install all dependencies:

```bash
# Install production dependencies
bun add @prisma/client bcryptjs jsonwebtoken cors dotenv

# Install development dependencies
bun add -d prisma @types/bcryptjs @types/jsonwebtoken @types/bun
```

**Alternative (if Bun doesn't work):**
```bash
npm install @prisma/client bcryptjs jsonwebtoken cors dotenv
npm install -D prisma @types/bcryptjs @types/jsonwebtoken
```

### 3.3 Verify Installation

Check that `node_modules` folder was created and packages are installed:

```bash
ls node_modules
```

---

## Step 4: Configure Environment Variables

### 4.1 Create .env File

In the `Backend/` directory, create a new file named `.env`:

```bash
# On Windows (PowerShell)
New-Item -Path .env -ItemType File

# On Windows (CMD)
type nul > .env

# On Mac/Linux
touch .env
```

### 4.2 Add Environment Variables

Open the `.env` file and add the following content:

```env
# Database Connection
# Replace with your Supabase connection string from Step 2
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# JWT Secret (generate a random string)
# You can use: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-change-in-production-minimum-32-characters"

# JWT Expiration
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:5173"
```

### 4.3 Update DATABASE_URL

1. Replace `YOUR_PASSWORD` with your actual Supabase database password
2. Replace `db.xxxxx.supabase.co` with your actual Supabase database host
3. The connection string should look like:
   ```env
   DATABASE_URL="postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres"
   ```

### 4.4 Generate JWT Secret (Optional but Recommended)

Generate a secure random string for JWT_SECRET:

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use an online generator:**
- Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
- Copy the generated string
- Replace `your-super-secret-key-change-in-production-minimum-32-characters` with it

### 4.5 Verify .env File

Your `.env` file should now look like this (with your actual values):

```env
DATABASE_URL="postgresql://postgres:actual_password@db.actual_host.supabase.co:5432/postgres"
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**Important:** Never commit `.env` to Git! It's already in `.gitignore`.

---

## Step 5: Initialize Prisma

### 5.1 Generate Prisma Client

This reads your `schema.prisma` and generates the Prisma Client:

```bash
bun run prisma:generate

**Or manually:**
```bash
bunx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in XXXms
```

### 5.2 Verify Prisma Client

Check that Prisma Client was generated:

```bash
ls node_modules/.prisma/client
```

You should see files like `index.js`, `index.d.ts`, etc.

---

## Step 6: Run Migrations

### 6.1 Create Initial Migration

This will:
1. Read your `schema.prisma` file
2. Compare it with your database (empty at first)
3. Create migration files
4. Apply them to your Supabase database

```bash
bun run prisma:migrate
```

**Or manually:**
```bash
bunx prisma migrate dev --name init
```

### 6.2 Follow the Prompts

1. **Migration name**: Press Enter to use default name `init` or type a custom name
2. Prisma will:
   - Create migration files in `prisma/migrations/`
   - Apply the migration to your Supabase database
   - Regenerate Prisma Client

**Expected output:**
```
✔ Migration created and applied successfully.
```

### 6.3 Verify Migration

Check that tables were created in Supabase:

1. Go to your Supabase project dashboard
2. Click **"Table Editor"** in the left sidebar
3. You should see tables:
   - `users`
   - `risks`
   - `risk_analyses`
   - `risk_mitigations`
   - `risk_evaluations`
   - `user_registration_requests`
   - `other_requests`

### 6.4 View Migration Files

Check the created migration:

```bash
ls prisma/migrations
```

You should see a folder like `20240101120000_init/` containing `migration.sql`

---

## Step 7: Seed Database (Optional)

### 7.1 Run Seed Script

This creates sample data for testing:

```bash
bun run prisma:seed
```

**Or manually:**
```bash
bun prisma/seed.js
```

### 7.2 Verify Seed Data

1. Go to Supabase **"Table Editor"**
2. Click on `users` table
3. You should see 3 users:
   - `admin@adminlte.io` (Admin Pusat)
   - `admincabang@adminlte.io` (Admin Cabang)
   - `user@adminlte.io` (Regular User)
4. Click on `risks` table to see sample risk data

**Default Passwords:**
- Admin users: `admin123`
- Regular user: `user123`

---

## Step 8: Start the Server

### 8.1 Start Development Server

```bash
bun run dev
```

**Expected output:**
```
╔═══════════════════════════════════════════════╗
║           MinLT Backend Server                ║
║                                               ║
║   🚀 Starting server on port 3001            ║
╚═══════════════════════════════════════════════╝
✅ Server running at http://localhost:3001
```

### 8.2 Test the API

Open a new terminal and test the API:

**Test Health Endpoint:**
```bash
curl http://localhost:3001/health
```

**Test Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@adminlte.io\",\"password\":\"admin123\"}"
```

**Expected response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 8.3 Test with Token

Copy the `token` from login response and use it:

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
1. Check your `DATABASE_URL` in `.env`
2. Verify password is correct (no special characters need encoding)
3. Check Supabase project is active (not paused)
4. Verify network connection

### Issue: "Migration failed"

**Solution:**
1. Check database connection string
2. Ensure database password is correct
3. Try resetting: `bunx prisma migrate reset` (WARNING: deletes all data)
4. Check Supabase logs in dashboard

### Issue: "Prisma Client not found"

**Solution:**
```bash
bun run prisma:generate
```

### Issue: "Port already in use"

**Solution:**
1. Change `PORT` in `.env` to another number (e.g., `3002`)
2. Or kill the process using port 3001

### Issue: "JWT secret too short"

**Solution:**
Generate a longer secret (minimum 32 characters):
```bash
openssl rand -base64 32
```

### Issue: "Module not found"

**Solution:**
```bash
bun install
```

### Issue: "Connection timeout"

**Solution:**
1. Check Supabase project status
2. Verify connection string format
3. Check firewall/network settings
4. Try using Supabase connection pooler (add `?pgbouncer=true` to connection string)

---

## Next Steps

After successful setup:

1. **Update Frontend**: Point your frontend API calls to `http://localhost:3001/api`
2. **Test All Endpoints**: Use Postman or curl to test all API endpoints
3. **Production Setup**: See `README.md` for production deployment guide
4. **Monitor**: Use Supabase dashboard to monitor database usage

---

## Quick Reference

### Common Commands

```bash
# Generate Prisma Client
bun run prisma:generate

# Create and apply migration
bun run prisma:migrate

# View database in browser
bun run prisma:studio

# Seed database
bun run prisma:seed

# Start dev server
bun run dev

# Start production server
bun run start
```

### Important Files

- `prisma/schema.prisma` - Database schema definition
- `.env` - Environment variables (never commit!)
- `Backend/src/lib/prisma.js` - Prisma Client instance
- `Backend/src/controllers/` - API controllers
- `Backend/src/routes/api.js` - API routes

### Support

If you encounter issues:
1. Check Supabase dashboard for database status
2. Review Prisma migration logs
3. Check server console for error messages
4. Verify all environment variables are set correctly

---

**Congratulations!** 🎉 Your backend is now set up and ready to use!
