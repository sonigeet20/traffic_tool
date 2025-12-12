# Browser Automation 403 Forbidden Fix

## The Issue

You were getting a **403 Forbidden** error when Browser Automation tried to fetch the configuration from Supabase:

```
[BROWSER AUTOMATION] ✗ Failed to connect: Unexpected server response: 403
```

## Root Cause

The issue is **Supabase Row Level Security (RLS)** blocking the API call. Even though the Edge Function is sending the `SUPABASE_SERVICE_ROLE_KEY`, the RLS policy on the `bright_data_serp_config` table may be preventing the query.

## The Solution

I've updated the puppeteer-server.js with:

1. **HTTP Status Code Checking** - Now logs the actual HTTP response code before trying to parse JSON
2. **Better Error Messages** - Shows exactly what went wrong (403, 404, etc.)
3. **RLS Diagnosis Help** - Suggests checking RLS policies on the table

## What to Do Now

### Step 1: Check Supabase RLS Policies

Go to Supabase Dashboard:
1. Navigate to **Authentication** → **Policies**
2. Find the `bright_data_serp_config` table
3. Check if RLS is **enabled**

If RLS is enabled, you need to add a policy that allows the service role to access the table.

### Step 2: Fix RLS (if needed)

Run this in Supabase SQL Editor to disable RLS (if you only have one user, this is fine):

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bright_data_serp_config';

-- If rowsecurity = true, disable it:
ALTER TABLE bright_data_serp_config DISABLE ROW LEVEL SECURITY;
```

**OR** create a proper policy for service role:

```sql
CREATE POLICY "Allow service role access"
ON bright_data_serp_config
FOR SELECT
USING (true);

GRANT SELECT ON bright_data_serp_config TO service_role;
```

### Step 3: Deploy Updated Server

Upload the updated `puppeteer-server.js` to AWS EC2 and restart:

```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@13.218.100.97

# Replace the file
# (upload new puppeteer-server.js)

# Restart the process
pm2 restart puppeteer-server  # or however you're running it
```

### Step 4: Test Again

Create a new test campaign with:
- ✅ Browser Automation enabled
- ✅ Search traffic + keywords
- ✅ Start campaign and check logs

**You should now see:**
```
[BROWSER AUTOMATION] Response status: 200
[BROWSER AUTOMATION] Config records found: 1
[BROWSER AUTOMATION] ✓ Configuration found and enabled
[BROWSER AUTOMATION] Connecting to remote browser via WebSocket...
[BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
```

---

## Debug Log Messages

**If still getting 403:**
```
[BROWSER AUTOMATION] HTTP Error 403: Insufficient privileges
```

This means RLS policy exists and is blocking the service role. Run the SQL fix above.

**If getting 401:**
```
[BROWSER AUTOMATION] HTTP Error 401: Unauthorized
```

This means the API key is wrong. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly in the Edge Function environment.

**If getting 404:**
```
[BROWSER AUTOMATION] HTTP Error 404: Not found
```

This means the table doesn't exist or has a different name. Check your Supabase database schema.

---

## Important Notes

- The fix is now in `puppeteer-server.js`
- All previous code changes (migrations, Settings UI, types) are still in place
- The server will now log detailed HTTP errors instead of generic "Failed to connect" messages
- If Browser Automation fails, it gracefully falls back to standard browser launch

