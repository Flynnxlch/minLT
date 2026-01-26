# Environment Variables Setup

## Quick Setup

1. **Create `.env` file** in the `Backend/` directory
2. **Copy the template below** into your `.env` file
3. **Replace the values** with your actual Supabase credentials

## .env File Template

Create a file named `.env` in the `Backend/` directory with this content:

```env
# Database Connection
# Get this from Supabase: Settings > Database > Connection string (URI)
# Replace YOUR_PASSWORD and db.xxxxx with your actual values
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# JWT Secret
# Generate a secure random string (minimum 32 characters)
# Use: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-change-in-production-minimum-32-characters-long"

# JWT Expiration Time
JWT_EXPIRES_IN="7d"

# Server Port
PORT=3001

# Environment
NODE_ENV=development

# CORS Origin (Frontend URL)
CORS_ORIGIN="http://localhost:5173"
```

## How to Get Your Values

### DATABASE_URL

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **"Connection string"** section
4. Click the **"URI"** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password

**Example:**
```
postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### JWT_SECRET

Generate a secure random string:

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use online generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated string

### Other Values

- **PORT**: Default is `3001`, change if needed
- **NODE_ENV**: Use `development` for local, `production` for production
- **CORS_ORIGIN**: Your frontend URL (default: `http://localhost:5173`)

## Verify Setup

After creating `.env`, test the connection:

```bash
# Generate Prisma Client
bun run prisma:generate

# Test database connection
bunx prisma db pull
```

If successful, you're all set! 🎉

## Security Notes

- **Never commit `.env` to Git** - it's already in `.gitignore`
- **Use strong passwords** for database
- **Generate unique JWT_SECRET** for each environment
- **Don't share `.env` file** publicly
