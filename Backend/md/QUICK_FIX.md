# Quick Fix: Database Connection Error

## Error
```
P1001: Can't reach database server at `db.gzyupaztzssvpdmgdtdg.supabase.co:5432`
```

## Most Common Cause: Supabase Project is Paused

Supabase free tier **automatically pauses** projects after 1 week of inactivity.

### Fix Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in to your account

2. **Check Project Status**
   - Look for your project `gzyupaztzssvpdmgdtdg`
   - If you see "Paused" or "Inactive", click **"Restore"** or **"Resume"**

3. **Wait 1-2 Minutes**
   - After restoring, wait for the database to fully start
   - You'll see "Active" status when ready

4. **Try Migration Again**
   ```bash
   cd Backend
   bun run prisma:migrate
   ```

## Alternative: Use Connection Pooler

If direct connection doesn't work, use Supabase's connection pooler:

### Steps:

1. **Get Pooler Connection String**
   - Go to Supabase Dashboard → Your Project
   - Click **Settings** (gear icon) → **Database**
   - Scroll to **"Connection pooling"** section
   - Click **"Session mode"** tab
   - Copy the connection string

2. **It will look like:**
   ```
   postgresql://postgres.gzyupaztzssvpdmgdtdg:[YOUR-PASSWORD]@aws-0-xx-x.pooler.supabase.com:6543/postgres
   ```

3. **Update .env File**
   - Open `Backend/.env`
   - Replace `DATABASE_URL` with the pooler connection string
   - **Important:** URL-encode special characters in password:
     - `*` → `%2A`
     - `#` → `%23`
     - `@` → `%40`
   
   **Example:**
   ```env
   DATABASE_URL="postgresql://postgres.gzyupaztzssvpdmgdtdg:8KfnYQ%2A_%23_8m7ph@aws-0-xx-x.pooler.supabase.com:6543/postgres"
   ```

4. **Try Migration**
   ```bash
   bun run prisma:migrate
   ```

## Differences: Direct vs Pooler

| Feature | Direct Connection | Connection Pooler |
|---------|------------------|-------------------|
| Port | `5432` | `6543` |
| Host | `db.xxxxx.supabase.co` | `aws-0-xx-x.pooler.supabase.com` |
| Username | `postgres` | `postgres.xxxxx` (with project ref) |
| Reliability | Can timeout | More stable |
| Best for | Development | Production & Migrations |

## Still Not Working?

### Check These:

1. **Is project active?** - Check Supabase dashboard
2. **Network connection?** - Try from different network
3. **Firewall blocking?** - Port 5432 or 6543 might be blocked
4. **VPN active?** - Try disconnecting VPN
5. **Password correct?** - Double-check in Supabase dashboard

### Test Connection Manually:

If you have `psql` installed:
```bash
psql "postgresql://postgres:8KfnYQ%2A_%23_8m7ph@db.gzyupaztzssvpdmgdtdg.supabase.co:5432/postgres"
```

## Success Indicators

When connection works, you'll see:
```
✔ Migration created and applied successfully.
```

Then you can seed:
```bash
bun run prisma:seed
```
