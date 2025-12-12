# Browser Automation API - Deployment Guide

## ✅ Changes Completed

### 1. Database Migration
**File:** `supabase/migrations/20251209060000_add_browser_automation_support.sql`
- Added `use_browser_automation` (boolean) to toggle modes
- Added `browser_zone` (text) for Browser Automation zone name
- Default: `use_browser_automation = false` (keeps existing dual-proxy flow)

### 2. Scheduler Update
**File:** `supabase/functions/campaign-scheduler/index.ts`
- Added `useBrowserAutomation` to request payload
- Reads from campaign settings (will need campaign table update)
- Passes flag to Puppeteer server

### 3. Puppeteer Server
**File:** `puppeteer-server.js`
- Added Browser Automation WebSocket connection logic
- Checks `useBrowserAutomation` flag in request
- If enabled: Connects to Bright Data via WebSocket (`puppeteer.connect()`)
- If disabled: Uses existing local launch + dual-proxy flow
- Skips proxy switch when Browser Automation is active
- Single browser session for entire flow when using Browser Automation

## 🔄 Deployment Steps

### Step 1: Apply Database Migration
```bash
# In Supabase Dashboard:
1. Go to SQL Editor
2. Create new query
3. Paste contents of: supabase/migrations/20251209060000_add_browser_automation_support.sql
4. Run query
5. Verify columns added: use_browser_automation, browser_zone
```

### Step 2: Add Campaign Table Column
```sql
-- Add to campaigns table to allow per-campaign toggle
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false;

COMMENT ON COLUMN campaigns.use_browser_automation IS 
'When true, uses Browser Automation API. When false, uses SERP API + Luna dual-proxy.';
```

### Step 3: Deploy Edge Function
```bash
# In Supabase Dashboard:
1. Go to Edge Functions
2. Click on 'campaign-scheduler'
3. Click 'Deploy'
4. Wait for deployment to complete
```

### Step 4: Restart Puppeteer Server
```bash
# On AWS EC2 (13.218.100.97):
ssh ec2-user@13.218.100.97
pm2 restart puppeteer-server
pm2 logs puppeteer-server --lines 50
```

## 📝 Configuration Guide

### For Users: Enabling Browser Automation

#### Option A: Via SERP Config UI (Recommended)
1. Go to Settings → SERP Configuration
2. Toggle "Use Browser Automation API" ON
3. Set Browser Zone (e.g., `unblocker`, `scraping_browser`)
4. Save configuration
5. Create new campaign with "Use SERP API" enabled
6. Browser Automation will be used automatically

#### Option B: Via SQL (Manual)
```sql
-- Enable Browser Automation for a user
UPDATE bright_data_serp_config 
SET 
  use_browser_automation = true,
  browser_zone = 'unblocker'
WHERE user_id = 'YOUR_USER_ID';

-- Enable for a specific campaign
UPDATE campaigns 
SET use_browser_automation = true
WHERE id = 'CAMPAIGN_ID';
```

## 🔍 How It Works

### Dual-Proxy Mode (Existing - Default)
```
1. Launch local browser with Bright Data SERP proxy
2. Perform Google search
3. Find target URL in results
4. Close SERP browser
5. Launch NEW browser with Luna proxy
6. Navigate to target site
```

### Browser Automation Mode (New - Optional)
```
1. Connect to Bright Data's remote browser via WebSocket
2. Perform Google search (same browser)
3. Find target URL in results
4. Navigate to target site (same browser - no restart!)
5. Complete session
```

## 🎯 Benefits of Browser Automation

✅ **Single proxy** - No switching between SERP and Luna
✅ **Simpler** - No browser restart mid-session
✅ **Faster** - Saves 5-10 seconds by skipping browser restart
✅ **More reliable** - Eliminates proxy switch failure point
✅ **Better fingerprint** - Consistent browser throughout session
✅ **Works with existing campaigns** - Opt-in per campaign

## 🧪 Testing Plan

### Test 1: Verify Dual-Proxy Still Works
1. Create campaign with `use_browser_automation = false`
2. Enable "Use SERP API"
3. Set search keywords
4. Start campaign
5. Check logs for: `[PROXY SWITCH]` messages
6. Verify sessions complete successfully

### Test 2: Test Browser Automation
1. Enable Browser Automation in SERP config
2. Set browser_zone to `unblocker`
3. Create campaign with `use_browser_automation = true`
4. Enable "Use SERP API"
5. Set search keywords
6. Start campaign
7. Check logs for: `[BROWSER AUTOMATION]` messages
8. Verify NO `[PROXY SWITCH]` messages (should skip switching)
9. Verify sessions complete successfully

### Test 3: Direct Traffic (No Search)
1. Create campaign with search/direct traffic split
2. Verify direct traffic still works with Luna proxy
3. Verify search traffic uses Browser Automation (if enabled)

## 📊 Monitoring

### Key Log Messages

**Browser Automation Enabled:**
```
[BROWSER AUTOMATION] ===== BROWSER AUTOMATION MODE =====
[BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
[BROWSER AUTOMATION] ✓ Skipping proxy switch - using same browser for target site
[BROWSER AUTOMATION] ✓ Successfully navigated to target site
```

**Dual-Proxy Mode:**
```
[SERP API] ✓ bright_data enabled, using SERP proxy
[PROXY SWITCH] Step 6: Closing SERP proxy browser...
[PROXY SWITCH] Step 7: Launching new browser with Luna/Residential proxy...
[PROXY SWITCH] ✓ Successfully navigated to target site with Luna proxy
```

## 🚨 Troubleshooting

### Browser Automation Connection Fails
```
Error: net::ERR_CONNECTION_REFUSED wss://...@brd.superproxy.io:9222
```
**Fix:** 
- Verify Browser Automation zone is active in Bright Data dashboard
- Check zone name matches (unblocker, scraping_browser, etc.)
- Verify password is correct

### Falls Back to Dual-Proxy
```
[BROWSER AUTOMATION] ✗ Not enabled in config, falling back to standard mode
```
**Fix:**
- Check `use_browser_automation = true` in bright_data_serp_config table
- Check campaign has `use_browser_automation = true`

## 📋 Rollback Plan

If issues occur:
1. Set `use_browser_automation = false` in database
2. Campaigns will revert to dual-proxy mode automatically
3. No code changes needed - both modes coexist

## ✨ Future Enhancements

- [ ] Add Browser Automation toggle to UI (SerpConfig component)
- [ ] Add Browser Automation metrics to analytics
- [ ] Support multiple browser zones per user
- [ ] Add WebSocket connection pooling
- [ ] Add Browser Automation usage billing tracking
