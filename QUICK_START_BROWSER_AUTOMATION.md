# Quick Start: Browser Automation API

## 🚀 Immediate Deployment (3 Steps)

### 1. Apply Migrations (5 min)
Go to Supabase Dashboard → SQL Editor → New Query:

```sql
-- Migration 1: Add to bright_data_serp_config
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS browser_zone text DEFAULT 'unblocker';

-- Migration 2: Add to campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS use_browser_automation boolean DEFAULT NULL;
```

### 2. Deploy Edge Function (2 min)
Supabase Dashboard → Edge Functions → `campaign-scheduler` → Deploy

### 3. Restart Puppeteer Server (1 min)
```bash
# SSH to AWS
ssh -i your-key.pem ec2-user@13.218.100.97
pm2 restart puppeteer-server
```

## ✅ Test It Now

### Enable for Your Account:
```sql
UPDATE bright_data_serp_config 
SET 
  use_browser_automation = true,
  browser_zone = 'unblocker',
  api_token = 'brd-customer-hl_a908b07a',  -- Your customer ID
  api_password = 'Dang7898'  -- Your password
WHERE user_id = 'YOUR_USER_ID';
```

### Create Test Campaign:
1. Go to Campaigns → New Campaign
2. Set target URL: `https://groeixyz.com/`
3. Enable "Use SERP API" ✓
4. Add search keyword: `groeixyz`
5. Traffic distribution: 100% search
6. Total sessions: 5
7. Start campaign

### Monitor Logs:
```bash
# On AWS
pm2 logs puppeteer-server --lines 100

# Look for:
# [BROWSER AUTOMATION] ✓ Connected to Bright Data Browser Automation API
```

## 📊 What You'll See

### Browser Automation Mode:
```
[BROWSER AUTOMATION] Connecting to remote browser...
[BROWSER AUTOMATION] ✓ Connected 
[GOOGLE SEARCH] Performing search...
[GOOGLE SEARCH] ✓ Found target URL
[BROWSER AUTOMATION] ✓ Skipping proxy switch
[BROWSER AUTOMATION] ✓ Navigated to target
✓ Simulated human behavior
✓ Session completed
```

### Dual-Proxy Mode (Old):
```
[SERP API] Using Bright Data SERP proxy...
[GOOGLE SEARCH] Performing search...
[PROXY SWITCH] Closing SERP browser...
[PROXY SWITCH] Launching Luna browser...
[PROXY SWITCH] ✓ Navigated to target
```

## 🔧 Your Bright Data Credentials

Based on your current config:
- **Customer ID:** `hl_a908b07a`
- **Zone for Browser Automation:** `unblocker` (or `scraping_browser`)
- **Password:** `Dang7898`
- **WebSocket Format:** `wss://brd-customer-hl_a908b07a-zone-unblocker-country-us:{PASSWORD}@brd.superproxy.io:9222`

## 💡 Key Differences

| Feature | Dual-Proxy (Old) | Browser Automation (New) |
|---------|------------------|-------------------------|
| Proxies Used | SERP API + Luna | Single Bright Data |
| Browser Restarts | 1 (switch mid-session) | 0 (continuous) |
| Complexity | High | Low |
| Speed | ~60s | ~50s |
| Failure Points | 2 (SERP + switch) | 1 |
| Cost | SERP + Luna | Browser Automation only |

## ⚠️ Important Notes

1. **Both modes work** - Browser Automation is optional
2. **Per-campaign control** - Each campaign can choose its mode
3. **Rollback safe** - Just set `use_browser_automation = false`
4. **Luna still needed** - For direct traffic (non-search sessions)

## 🎯 Next Steps

After testing:
1. Monitor success rate of Browser Automation sessions
2. Compare costs (Browser Automation vs SERP+Luna)
3. Gradually migrate campaigns if successful
4. Add UI toggle in SERP Config component (future)
5. Remove dual-proxy code (far future, after proven)

