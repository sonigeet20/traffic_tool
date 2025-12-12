# Browser API Credentials Setup - Complete Guide

## Summary
You now have everything set up to manage Browser API credentials! Here's what was added:

### ✅ What's New:

1. **Frontend Component**: `BrowserApiCredentials.tsx`
   - New settings page where you can enter and save Browser API credentials
   - Located in: **Settings → Bright Data Browser API**
   - Accessible from the main dashboard

2. **Database Table**: `serp_configs`
   - Stores Browser API credentials per user
   - Uses `user_id` (UUID) to link to your Supabase Auth user
   - Row-level security ensures users can only access their own credentials

3. **Automatic Integration**:
   - When you run a campaign with search traffic, credentials are automatically loaded
   - If credentials are saved, Browser API is used for searches
   - Falls back to Luna Proxy if credentials aren't available

---

## Setup Instructions

### Step 1: Create the Database Table
1. Open **Supabase Dashboard** → SQL Editor
2. Copy and paste this SQL:

```sql
-- Create serp_configs table for storing Browser API credentials per user
CREATE TABLE serp_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_customer_id TEXT,
  browser_password TEXT,
  browser_zone TEXT DEFAULT 'unblocker',
  browser_endpoint TEXT DEFAULT 'brd.superproxy.io',
  browser_port INTEGER DEFAULT 9222,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE serp_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own serp_configs
CREATE POLICY "Users can view own serp_configs"
  ON serp_configs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own serp_configs
CREATE POLICY "Users can update own serp_configs"
  ON serp_configs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own serp_configs
CREATE POLICY "Users can insert own serp_configs"
  ON serp_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own serp_configs
CREATE POLICY "Users can delete own serp_configs"
  ON serp_configs FOR DELETE
  USING (auth.uid() = user_id);
```

3. Click **Run** to create the table

### Step 2: Add Your Browser API Credentials

#### Option A: Via Frontend (Recommended)
1. Go to **Settings** → **Bright Data Browser API**
2. Enter your credentials:
   - **Customer ID**: Your Bright Data customer ID
   - **Password**: Your Bright Data password
   - **Zone Name**: Usually "unblocker" (default)
   - **Endpoint**: brd.superproxy.io (default)
   - **Port**: 9222 (default)
3. Click **Save Credentials**
4. See success message confirming save

#### Option B: Via SQL (Manual)
If you prefer to insert via SQL:

```sql
INSERT INTO serp_configs (
  user_id,
  browser_customer_id,
  browser_password,
  browser_zone,
  browser_endpoint,
  browser_port
) VALUES (
  'YOUR_USER_UUID_HERE',
  'your_bright_data_customer_id',
  'your_bright_data_password',
  'unblocker',
  'brd.superproxy.io',
  9222
) ON CONFLICT (user_id) DO UPDATE SET
  browser_customer_id = 'your_bright_data_customer_id',
  browser_password = 'your_bright_data_password',
  updated_at = CURRENT_TIMESTAMP;
```

To find your user UUID:
```sql
SELECT id, email FROM auth.users;
```

---

## How It Works

### Flow Diagram:
```
User Creates Campaign with Search Keywords
         ↓
Campaign Details loads serp_configs
         ↓
Check if Browser API credentials exist
         ↓
If YES: Use Browser API → Browser API handles CAPTCHA solving automatically
If NO: Fall back to Luna Proxy (traditional proxy method)
         ↓
Session completes
```

### When Browser API is Used:
- ✅ Campaign has search keywords configured
- ✅ "Search Traffic" is enabled (traffic distribution)
- ✅ Browser API credentials are saved in Settings
- ✅ Campaign is set to use Luna Proxy for search

### Browser API Features:
- 🔓 Automatic CAPTCHA solving
- 🌍 Geo-targeted browsing (per campaign setting)
- 📱 Real device fingerprinting
- 🛡️ Anti-detection measures (300+ lines)
- ✨ Realistic search behavior simulation

---

## Verification

After saving credentials, you'll see:

### In Browser Console (Settings Page):
```
Browser API Credentials saved successfully!
```

### When Running a Campaign:
```
[DEBUG] Including Browser API credentials for search
[BROWSER API SEARCH] Starting search "your keyword" (geo: US)
[BROWSER API SEARCH] ✓ Connected to Browser API
[BROWSER API SEARCH] ✓ Found X organic results
```

### Without Credentials:
```
[DEBUG] Browser API config still not available after fetch
[LUNA PROXY] Using Luna Proxy fallback
```

---

## Troubleshooting

### "Failed to load credentials"
- **Cause**: Table doesn't exist yet
- **Fix**: Run the SQL table creation script above

### "Customer ID and Password are required"
- **Cause**: Fields are empty
- **Fix**: Enter valid Bright Data credentials

### Credentials save but don't appear in campaigns
- **Cause**: Page wasn't reloaded after saving
- **Fix**: Reload the browser tab or go to a campaign and back

### Browser API not being used despite saved credentials
- **Cause**: Campaign doesn't have search keywords configured
- **Fix**: Edit campaign, add search keywords, save, try again

---

## Security Notes

✅ **Row Level Security (RLS)**
- Each user can only view/edit their own credentials
- Enforced at the database level
- Other users cannot access your credentials

✅ **Encryption**
- Passwords are stored in Supabase's encrypted storage
- HTTPS is used for all API calls

✅ **No Logging**
- Passwords are never logged to console in production
- Only frontend shows masked values (••••••)

---

## Next Steps

1. ✅ Run the SQL table creation
2. ✅ Go to Settings and enter your Browser API credentials
3. ✅ Create a campaign with search keywords
4. ✅ Run the campaign and watch it use Browser API for searches
5. ✅ Check console logs to verify Browser API routing

Questions? Check the debug logs in:
- **Browser Console**: `Settings → F12 → Console`
- **Server Logs**: SSH into AWS instance and check `server.cjs` logs
