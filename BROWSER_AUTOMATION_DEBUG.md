# Browser Automation Debugging Guide

## Why Nothing Happened?

Your Browser Automation request failed silently because it requires **ALL** of the following conditions to be met:

### ✅ Checklist (All MUST be true)

1. **Campaign has Browser Automation ENABLED**
   - In Campaign Form → Check the toggle: "Browser Automation API (Bright Data)"
   - This saves `use_browser_automation = true` to the database

2. **Campaign has Search Traffic (NOT Direct traffic)**
   - Traffic Source Distribution: Search traffic must be > 0%
   - WITHOUT search traffic, `searchKeyword` is undefined → Browser Automation skipped

3. **Campaign has Search Keywords defined**
   - In Campaign Form → Search tab → Add at least one keyword (e.g., "best product reviews")
   - Keyword must be non-empty string
   - Browser Automation REQUIRES keywords to work (it performs Google search)

4. **Settings → Browser Automation is ENABLED**
   - Go to Settings tab
   - Scroll to Browser Automation section
   - Check: "Enable Browser Automation"
   - This saves `use_browser_automation = true` to `bright_data_serp_config` table

5. **Browser Automation Credentials are filled in Settings**
   - Username: `brd-customer-hl_a908b07a-zone-unblocker` (full format)
   - Password: Your zone password
   - Zone: `unblocker` (or your custom zone)
   - Endpoint: `brd.superproxy.io` (default)
   - Port: `9222` (default)
   - All fields MUST be saved

6. **Database Migrations Applied**
   - Run in Supabase SQL Editor:
   ```sql
   ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false;
   ALTER TABLE bright_data_serp_config 
   ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS browser_zone text DEFAULT 'unblocker',
   ADD COLUMN IF NOT EXISTS browser_username text,
   ADD COLUMN IF NOT EXISTS browser_password text,
   ADD COLUMN IF NOT EXISTS browser_endpoint text DEFAULT 'brd.superproxy.io',
   ADD COLUMN IF NOT EXISTS browser_port text DEFAULT '9222';
   ```

7. **AWS Puppeteer Server Updated**
   - The `puppeteer-server.js` file deployed to EC2 (13.218.100.97:3000) must have latest code
   - It reads `browser_username`, `browser_password`, `browser_endpoint`, `browser_port` from database
   - Without update, it tries to construct username from old fields → fails

---

## How to Verify Each Step

### Step 1: Check Campaign Settings
```sql
SELECT 
  id, name, 
  use_browser_automation,
  traffic_source_distribution,
  search_keywords
FROM campaigns 
WHERE name = 'YOUR_CAMPAIGN_NAME';
```

**Expected Output:**
- `use_browser_automation` = `true`
- `traffic_source_distribution` like `{"search": 50, "direct": 50}` (search > 0)
- `search_keywords` like `["keyword1", "keyword2"]` (non-empty array)

### Step 2: Check Browser Automation Settings
```sql
SELECT 
  user_id,
  use_browser_automation,
  browser_username,
  browser_password,
  browser_zone,
  browser_endpoint,
  browser_port
FROM bright_data_serp_config
LIMIT 1;
```

**Expected Output:**
- `use_browser_automation` = `true`
- `browser_username` = `brd-customer-...` (not empty)
- `browser_password` = actual password (not empty)
- `browser_zone` = zone name
- `browser_endpoint` = `brd.superproxy.io` or custom
- `browser_port` = `9222` or custom

### Step 3: Check AWS Server Logs
SSH to EC2 and check recent logs:
```bash
tail -f /var/log/puppeteer-server.log  # Or wherever you redirect output
```

**Look for one of these patterns:**

**If working:**
```
[BROWSER AUTOMATION] ===== BROWSER AUTOMATION MODE =====
[BROWSER AUTOMATION] Conditions met - fetching configuration...
[BROWSER AUTOMATION] Config fetch returned 1 result(s)
[BROWSER AUTOMATION] ✓ Configuration found and enabled
[BROWSER AUTOMATION] Connecting to remote browser via WebSocket...
[BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
```

**If NOT working - Missing condition:**
```
[BROWSER AUTOMATION] Conditions not met, using standard mode:
[BROWSER AUTOMATION]   - useBrowserAutomation: false (← Should be true)
[BROWSER AUTOMATION]   - searchKeyword present: false (← Should be true)
```

**If NOT working - Missing credentials:**
```
[BROWSER AUTOMATION] ✗ Missing credentials - username or password empty
[BROWSER AUTOMATION] username: EMPTY
[BROWSER AUTOMATION] password: EMPTY
[BROWSER AUTOMATION] Please configure Browser Automation credentials in Settings
```

---

## Common Issues & Solutions

### Issue: "Conditions not met, using standard mode"
**Cause:** One or more required conditions are false

**Solutions:**
1. Verify campaign has search traffic (not 100% direct)
2. Verify campaign has search keywords defined
3. Verify toggle is checked in campaign form

---

### Issue: "Config fetch returned 0 result(s)"
**Cause:** No Browser Automation config exists for your user

**Solutions:**
1. Go to Settings tab
2. Scroll to Browser Automation section
3. Check "Enable Browser Automation"
4. Fill in all credential fields
5. Click "Save Browser Automation Config" (purple button)

---

### Issue: "Missing credentials - username or password empty"
**Cause:** Saved config but left username/password blank

**Solutions:**
1. Go to Settings → Browser Automation section
2. Fill in:
   - Username: Copy from Bright Data dashboard (must include full `brd-customer-...` prefix)
   - Password: Your zone password
3. Click "Save Browser Automation Config"

---

### Issue: "Failed to connect: ECONNREFUSED"
**Cause:** Either:
- Bright Data credentials are wrong
- AWS server can't reach Bright Data endpoint
- Browser Automation zone doesn't exist in your account

**Solutions:**
1. Verify credentials are correct in Bright Data dashboard
2. Test WebSocket connection manually:
   ```bash
   curl -v -N \
   wss://brd-customer-XXXX-zone-unblocker:PASSWORD@brd.superproxy.io:9222/ws
   ```
3. Check if zone is active in Bright Data → Proxy & Scraping → Browser Automation

---

## Manual Testing

### Create a Test Campaign

1. **Name:** "Browser Automation Test"
2. **Target URL:** https://example.com
3. **Total Sessions:** 1
4. **Sessions Per Hour:** 1
5. **Traffic Source:** 100% Search
6. **Search Keywords:** "example site"
7. **Toggle:** Enable "Browser Automation API (Bright Data)"
8. **Save & Start**

### Monitor Logs

Watch the Puppeteer server logs in real-time:
```bash
# On AWS EC2
tail -f /path/to/puppeteer-server-output.log
```

### Expected Flow

```
[BROWSER AUTOMATION] ===== BROWSER AUTOMATION MODE =====
[BROWSER AUTOMATION] Conditions met - fetching configuration...
[BROWSER AUTOMATION] useBrowserAutomation: true
[BROWSER AUTOMATION] searchKeyword: example site
[BROWSER AUTOMATION] userId: xxxxx
[BROWSER AUTOMATION] Config fetch returned 1 result(s)
[BROWSER AUTOMATION] ✓ Configuration found and enabled
[BROWSER AUTOMATION] Username: brd-customer-hl_a908b07a-zone-unblocker
[BROWSER AUTOMATION] Endpoint: brd.superproxy.io:9222
[BROWSER AUTOMATION] Country: US
[BROWSER AUTOMATION] Session: abc123xx
[BROWSER AUTOMATION] Connecting to remote browser via WebSocket...
[BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
[BROWSER AUTOMATION] ✓ Single browser session for entire flow (search + target site)
[BROWSER AUTOMATION] ✓ Browser ready - proceeding with session
```

---

## Next Steps

1. **Verify database migrations are applied** - Run migration SQL in Supabase
2. **Configure Browser Automation credentials** - Go to Settings, fill in all fields
3. **Create test campaign** - Enable Browser Automation + Search traffic + Keywords
4. **Start campaign** - Monitor AWS logs
5. **Check for errors** - Share the log output if still not working

