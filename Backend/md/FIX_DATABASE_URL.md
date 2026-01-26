# Fix Database URL Connection Error

## Problem
Error: `P1013: The provided database string is invalid. invalid port number in database URL`

## Common Causes

### 1. Special Characters in Password
If your Supabase password contains special characters like `@`, `#`, `%`, `&`, etc., they need to be **URL-encoded**.

### 2. Missing Port Number
The connection string must include the port number `:5432`

### 3. Incorrect Format
The connection string must follow this exact format:
```
postgresql://postgres:PASSWORD@HOST:5432/postgres
```

## Solution

### Step 1: Check Your Current DATABASE_URL

Open your `.env` file in the `Backend/` directory and check the `DATABASE_URL` line.

### Step 2: URL-Encode Special Characters in Password

If your password contains special characters, you need to encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |
| ` ` (space) | `%20` |

**Example:**
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Connection string: `postgresql://postgres:MyP%40ss%23123@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Verify Connection String Format

Your `DATABASE_URL` should look like this:

```env
DATABASE_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

**Important parts:**
- `postgresql://` - protocol
- `postgres` - username
- `:` - separator
- `YOUR_ENCODED_PASSWORD` - password (URL-encoded if needed)
- `@` - separator
- `db.xxxxx.supabase.co` - your Supabase host
- `:5432` - port number (required!)
- `/postgres` - database name

### Step 4: Quick Fix - Use Supabase Connection Pooler

If encoding is too complicated, you can use Supabase's connection pooler which handles special characters better:

1. Go to Supabase Dashboard → Settings → Database
2. Find **"Connection pooling"** section
3. Copy the **"Session mode"** connection string
4. It will look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xx-x.pooler.supabase.com:6543/postgres
   ```
5. Note: Port is `6543` (pooler) instead of `5432` (direct)

### Step 5: Test the Connection

After fixing your `.env` file:

```bash
# Test connection
bunx prisma db pull

# Or run migration
bun run prisma:migrate
```

## Examples

### Example 1: Simple Password (No Special Characters)
```env
DATABASE_URL="postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

### Example 2: Password with Special Characters
**Password:** `P@ssw0rd#2024!`

**Encoded:** `P%40ssw0rd%232024%21`

**Connection String:**
```env
DATABASE_URL="postgresql://postgres:P%40ssw0rd%232024%21@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

### Example 3: Using Connection Pooler
```env
DATABASE_URL="postgresql://postgres.xxxxx:MyPassword123@aws-0-xx-x.pooler.supabase.com:6543/postgres"
```

## Online URL Encoder

If you need to encode your password, use an online URL encoder:
- https://www.urlencoder.org/
- Just paste your password and copy the encoded result

## Still Having Issues?

1. **Double-check the port number** - Must be `:5432` or `:6543` (pooler)
2. **Remove quotes if using PowerShell** - Sometimes quotes cause issues
3. **Check for extra spaces** - No spaces around `=` in `.env` file
4. **Verify Supabase project is active** - Check dashboard to ensure project isn't paused

## Need Help?

Share your connection string format (with password hidden) and I can help identify the issue:
```
postgresql://postgres:***@db.xxxxx.supabase.co:5432/postgres
```
