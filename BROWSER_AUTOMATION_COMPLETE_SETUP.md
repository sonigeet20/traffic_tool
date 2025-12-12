# Browser Automation - Complete Setup Guide

## Overview

Browser Automation allows a single Bright Data remote browser to handle your entire session:
1. Google search
2. Click on search result
3. Navigate to target website
4. All in one browser (no proxy switching)

---

# STEP 1: Apply Database Migrations in Supabase

## What This Does
Adds the necessary database columns to store Browser Automation configuration.

### Action Steps

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select project: `xrqobmncpllhkjjorjul`

2. **Navigate to SQL Editor**
   - Left sidebar → SQL Editor

3. **Run First Migration (if not done)**
   - Click "New Query"
   - Paste this SQL:
   ```sql
   -- Add Browser Automation support to campaigns table
   ALTER TABLE campaigns 
   ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false;
   ```
   - Click "Run"
   - Verify: No errors shown

4. **Run Second Migration (if not done)**
   - Click "New Query"
   - Paste this SQL:
   ```sql
   -- Add Browser Automation fields to bright_data_serp_config table
   ALTER TABLE bright_data_serp_config 
   ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS browser_zone text DEFAULT 'unblocker',
   ADD COLUMN IF NOT EXISTS browser_username text,
   ADD COLUMN IF NOT EXISTS browser_password text,
   ADD COLUMN IF NOT EXISTS browser_endpoint text DEFAULT 'brd.superproxy.io',
   ADD COLUMN IF NOT EXISTS browser_port text DEFAULT '9222';
   ```
   - Click "Run"
   - Verify: No errors shown

5. **Check RLS Policy (CRITICAL)**
   - Go to: **Authentication** → **Policies**
   - Find table: `bright_data_serp_config`
   - Check if RLS is enabled
   
   **If RLS is enabled:**
   ```sql
   -- Run this to disable RLS (simple approach for single user)
   ALTER TABLE bright_data_serp_config DISABLE ROW LEVEL SECURITY;
   ```
   
   **OR create a policy for service role:**
   ```sql
   -- Allow service role full access
   CREATE POLICY "Service role full access"
   ON bright_data_serp_config
   USING (true)
   WITH CHECK (true);
   
   -- Grant permissions
   GRANT ALL ON bright_data_serp_config TO service_role;
   ```

✅ **Verify Step 1 Complete:**
- All 4 SQL commands ran without errors
- RLS is disabled OR policy is created

---

# STEP 2: Update AWS Puppeteer Server

## What This Does
Deploys the updated puppeteer-server.js to your AWS EC2 instance so it can:
- Read Browser Automation credentials from database
- Connect to Bright Data remote browser via WebSocket
- Handle errors gracefully

### Action Steps

1. **Get Latest Code**
   - In your workspace, the file is updated: `/Users/geetsoni/Downloads/traffic_tool-main/puppeteer-server.js`

2. **Connect to AWS EC2**
   ```bash
   # In terminal, SSH to your EC2 instance
   ssh -i your-key.pem ec2-user@13.218.100.97
   ```
   
   ⚠️ **Note:** Replace `your-key.pem` with your actual AWS key file path

3. **Stop Current Server**
   ```bash
   # If running with pm2
   pm2 stop puppeteer-server
   
   # OR if running with node directly
   pkill -f "node puppeteer-server"
   ```

4. **Upload New File**
   
   **Option A: Using SCP (Simple)**
   ```bash
   # From your local machine (not SSH)
   scp -i your-key.pem \
     /Users/geetsoni/Downloads/traffic_tool-main/puppeteer-server.js \
     ec2-user@13.218.100.97:/home/ec2-user/puppeteer-server.js
   ```

   **Option B: Manual Edit**
   - SSH to EC2 (command above)
   - Edit the file: `nano puppeteer-server.js`
   - Find lines 495-550 (Browser Automation section)
   - Replace with latest code from your local file
   - Save: `Ctrl+X` → `Y` → `Enter`

5. **Start Server Again**
   ```bash
   # If using pm2
   pm2 start puppeteer-server.js --name "puppeteer-server"
   
   # OR if using node directly
   node puppeteer-server.js &
   
   # View logs
   tail -f /path/to/logs.txt  # Or wherever you log output
   ```

6. **Verify Server Is Running**
   ```bash
   # Check if listening on port 3000
   curl -s http://localhost:3000/ 2>&1
   # Should show HTML or "Cannot GET /"
   ```

✅ **Verify Step 2 Complete:**
- SSH connection successful to EC2
- File uploaded/updated
- Server started and listening on port 3000
- No errors in logs

---

# STEP 3: Configure Browser Automation Credentials in Settings

## What This Does
Stores your Bright Data Browser Automation credentials so the server can connect to remote browser.

### Action Steps

1. **Open App**
   - Go to: http://localhost:5174
   - Login with your account

2. **Navigate to Settings**
   - Click "Settings" tab (right side)
   - Scroll down to find "Browser Automation API (Bright Data)" section
   - Should see a dark box with fields for:
     - [ ] Enable Browser Automation (checkbox)
     - Username (Zone)
     - Password
     - Browser Automation Zone
     - Endpoint
     - Port

3. **Fill in Credentials**

   **Get Username from Bright Data:**
   - Login to: https://brightdata.com
   - Navigate: Proxy & Scraping Infrastructure → Browser Automation
   - Find your zone (e.g., "unblocker")
   - Copy the username (format: `brd-customer-hl_XXXXX-zone-unblocker`)

   **Get Password:**
   - Same Bright Data dashboard
   - Copy the zone password

   **Fill form:**
   ```
   [ X ] Enable Browser Automation           ← CHECK THIS BOX FIRST
   
   Username (Zone):
   brd-customer-hl_a908b07a-zone-unblocker
   
   Password:
   your-zone-password-here
   
   Browser Automation Zone:
   unblocker
   
   Endpoint:
   brd.superproxy.io
   
   Port:
   9222
   ```

4. **Click Save**
   - Look for purple "Save Browser Automation Config" button
   - Click it
   - Wait for "Saved!" confirmation message

5. **Verify Saved**
   - Refresh page: `Cmd+R` (Mac) or `Ctrl+R` (Windows)
   - Go back to Settings
   - All fields should still be filled
   - WebSocket URL preview at bottom should show your credentials

✅ **Verify Step 3 Complete:**
- All fields are filled (no empty fields)
- "Saved!" message appeared
- Settings persist after refresh
- WebSocket preview shows your username

---

# STEP 4: Create Test Campaign with Browser Automation

## What This Does
Creates a simple campaign that uses Browser Automation to test if everything works.

### Action Steps

1. **Click "Create New Campaign"**
   - Main dashboard
   - Click blue button: "Create New Campaign"

2. **Fill Basic Settings**
   ```
   Campaign Name:
   Browser Automation Test
   
   Target URL:
   https://example.com
   
   Total Sessions:
   1
   
   Sessions Per Hour:
   1
   
   Concurrent Bots:
   1
   ```

3. **Set Traffic Source Distribution**
   - Tab: "Geo & Traffic"
   - Traffic Source Distribution:
     - Search: 100%
     - Direct: 0%
     
   ⚠️ **IMPORTANT:** Must have Search traffic enabled!

4. **Add Search Keywords**
   - Still in "Geo & Traffic" tab
   - Click "Add Keyword" button
   - Enter a keyword: `example site`
   - Click add
   
   ⚠️ **IMPORTANT:** Must have at least one keyword!

5. **Enable Browser Automation**
   - Scroll down in form
   - Find section: "Browser Automation API (Bright Data)"
   - It should be a standalone card (NOT inside SERP section)
   - Check the checkbox: "Enable Browser Automation API"
   - This will auto-disable the SERP toggle

6. **Save Campaign**
   - Scroll to top
   - Click blue "Save Campaign" button
   - Wait for success message

✅ **Verify Step 4 Complete:**
- Campaign created successfully
- Campaign shows in "Campaigns" list
- Campaign has `use_browser_automation = true` in database

---

# STEP 5: Test Browser Automation in Action

## What This Does
Runs the campaign and monitors logs to see if Browser Automation connects properly.

### Action Steps

1. **Open Terminal and Monitor Logs**
   
   **Terminal 1: Watch AWS Logs**
   ```bash
   # SSH to AWS
   ssh -i your-key.pem ec2-user@13.218.100.97
   
   # Tail the logs (adjust path as needed)
   tail -f ~/puppeteer-server.log
   # OR
   pm2 logs puppeteer-server
   ```

2. **Start Campaign**
   - In app, click "Campaigns" tab
   - Find "Browser Automation Test" campaign
   - Click green "Start" button
   - Confirm: "Start campaign?"

3. **Watch for These Logs**

   **GOOD SIGNS (success):**
   ```
   [BROWSER AUTOMATION] ===== BROWSER AUTOMATION MODE =====
   [BROWSER AUTOMATION] Calling Supabase API...
   [BROWSER AUTOMATION] Response status: 200
   [BROWSER AUTOMATION] Config records found: 1
   [BROWSER AUTOMATION] ✓ Configuration found and enabled
   [BROWSER AUTOMATION] Username: brd-customer-hl_a908b07a-zone-unblocker
   [BROWSER AUTOMATION] Endpoint: brd.superproxy.io:9222
   [BROWSER AUTOMATION] Country: US
   [BROWSER AUTOMATION] Connecting to remote browser via WebSocket...
   [BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
   [BROWSER AUTOMATION] ✓ Browser ready - proceeding with session
   ```

   **BAD SIGNS (see troubleshooting below):**
   ```
   [BROWSER AUTOMATION] HTTP Error 403: Insufficient privileges
   [BROWSER AUTOMATION] HTTP Error 401: Unauthorized
   [BROWSER AUTOMATION] ✗ Not enabled in config
   [BROWSER AUTOMATION] ✗ Missing credentials
   ```

4. **Monitor Completion**
   - Watch app UI for session to complete
   - Check AWS logs for final status
   - Look for: `[SESSION] ✓ Session completed`

✅ **Verify Step 5 Complete:**
- Campaign started successfully
- Logs show "✓ Connected to Bright Data Browser Automation API"
- Session completed without errors
- Session appears in "Sessions" analytics

---

# TROUBLESHOOTING

## Issue 1: HTTP Error 403: Insufficient privileges

**Cause:** RLS (Row Level Security) is blocking the query

**Fix:**
1. Go to Supabase SQL Editor
2. Run:
```sql
ALTER TABLE bright_data_serp_config DISABLE ROW LEVEL SECURITY;
```
3. Restart server on AWS
4. Try campaign again

---

## Issue 2: HTTP Error 401: Unauthorized

**Cause:** Wrong API key being used

**Fix:**
1. Verify Edge Function has correct `SUPABASE_SERVICE_ROLE_KEY`
2. In Supabase: Settings → API Keys
3. Copy "service_role secret" (not "anon" key)
4. Make sure Edge Function has this key
5. Redeploy Edge Function

---

## Issue 3: ✗ Not enabled in config

**Cause:** `use_browser_automation` flag is false in database

**Fix:**
1. Go to Settings
2. Check the "Enable Browser Automation" checkbox
3. Save
4. Check database:
```sql
SELECT use_browser_automation FROM bright_data_serp_config LIMIT 1;
```
Should return: `true`

---

## Issue 4: ✗ Missing credentials

**Cause:** Username or password is empty

**Fix:**
1. Go to Settings → Browser Automation section
2. All fields must be filled:
   - Username: `brd-customer-...` (from Bright Data)
   - Password: zone password
   - Zone: unblocker (or custom)
   - Endpoint: brd.superproxy.io
   - Port: 9222
3. Click "Save Browser Automation Config"
4. Refresh page to verify

---

## Issue 5: Campaign shows "No search keywords"

**Cause:** Campaign needs search traffic to use Browser Automation

**Fix:**
1. Edit campaign
2. Go to "Geo & Traffic" tab
3. Set Traffic Source Distribution:
   - Search: 100%
   - Direct: 0%
4. Add at least one search keyword
5. Enable "Browser Automation API" toggle
6. Save campaign

---

## Issue 6: Bright Data WebSocket Connection Failed

**Cause:** Bright Data credentials are wrong or zone doesn't exist

**Fix:**
1. Test credentials manually:
```bash
# On AWS EC2
curl -v -N \
  wss://brd-customer-hl_XXXX-zone-unblocker-country-US-session-abc123:PASSWORD@brd.superproxy.io:9222/ws
```
Should NOT show "401 Unauthorized"

2. Verify credentials in Bright Data dashboard:
   - Login: https://brightdata.com
   - Go: Proxy & Scraping → Browser Automation
   - Check zone is "Active"
   - Copy username and password correctly

---

# VERIFICATION CHECKLIST

Before declaring success, verify each item:

- [ ] Step 1: Migrations applied to Supabase
- [ ] Step 1: RLS disabled or policy created
- [ ] Step 2: puppeteer-server.js uploaded to AWS
- [ ] Step 2: Server running and accessible on port 3000
- [ ] Step 3: Browser Automation credentials filled in Settings
- [ ] Step 3: "Enable Browser Automation" checkbox checked
- [ ] Step 3: Settings saved (showed "Saved!" message)
- [ ] Step 4: Test campaign created with Search traffic + keywords
- [ ] Step 4: "Browser Automation API" toggle enabled on campaign
- [ ] Step 5: Campaign started successfully
- [ ] Step 5: Logs show "✓ Connected to Bright Data Browser Automation API"
- [ ] Step 5: Session completed and shows in analytics

---

# NEXT STEPS AFTER SUCCESS

Once Browser Automation is working:

1. **Test with Multiple Campaigns**
   - Create campaigns with different:
     - Countries
     - Search keywords
     - Bounce rates

2. **Compare with Dual-Proxy Mode**
   - Time to complete
   - Success rate
   - Cost difference

3. **Monitor Performance**
   - Watch for timeouts
   - Check completion rates
   - Verify analytics accuracy

4. **Adjust Settings**
   - Fine-tune session duration
   - Optimize bounce rate
   - Set ideal keywords

---

# SUPPORT & DEBUGGING

If something goes wrong:

1. **Check AWS Logs First**
   ```bash
   # SSH to EC2
   ssh -i key.pem ec2-user@13.218.100.97
   tail -f ~/puppeteer-server.log
   ```

2. **Check Supabase Logs**
   - Supabase Dashboard → Logs → Edge Functions
   - Look for errors in `campaign-scheduler` function

3. **Database Query Test**
   ```sql
   SELECT 
     use_browser_automation,
     browser_username,
     browser_password,
     browser_endpoint,
     browser_port
   FROM bright_data_serp_config
   WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Browser Console**
   - In app, press F12 → Console
   - Look for JavaScript errors
   - Check Network tab for failed requests

