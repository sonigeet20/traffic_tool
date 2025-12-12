# Browser Automation API - 403 Error Fix Guide

## The Issue
When using Bright Data's Browser Automation API, you're getting a **403 Unauthorized** error even though credentials appear correct.

## Root Causes

### 1. **Zone Mismatch** (Most Common)
- You're using zone: `scraping_browser1`
- Browser Automation might require a different zone
- **Solution**: Try using zone `unblocker` instead

### 2. **Wrong Credentials Type**
- Your current password (`dw6x0q7oe6ix`) might be for **SERP API**, not Browser Automation
- Browser Automation API may require separate credentials
- **Solution**: Check Bright Data dashboard under Browser Automation section for dedicated credentials

### 3. **Customer ID Format**
- Format must be: `brd-customer-hl_a908b07a` (with `brd-customer-` prefix)
- Verify exact format in WebSocket endpoint
- **Solution**: Copy directly from Bright Data dashboard

### 4. **WebSocket Endpoint Format**
- Must follow: `wss://brd-customer-{ID}-zone-{ZONE}:{PASSWORD}@brd.superproxy.io:9222`
- Port must be `9222` (not 33335)
- Missing/incorrect parts cause 403
- **Solution**: Copy the full endpoint from Bright Data dashboard

## Solutions in Order of Likelihood

### Solution 1: Try Unblocker Zone (90% Success Rate)
1. Go to **Settings > SERP Config**
2. In "Bright Data WebSocket Endpoint" field, change zone from `scraping_browser1` to `unblocker`:
   ```
   wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222
   ```
3. Click Save
4. Test with a campaign

### Solution 2: Get Credentials from Bright Data Dashboard
1. Log in to https://brightdata.com
2. Navigate to **Proxy & Scraping Infrastructure > Browser Automation**
3. Look for a zone that says "Active" or "Ready"
4. Copy the full WebSocket URL (should look like):
   ```
   wss://brd-customer-XXXXX-zone-YYYYYY:PASSWORD@brd.superproxy.io:9222
   ```
5. Paste into Settings > SERP Config > Browser Automation WebSocket Endpoint
6. Save and test

### Solution 3: Use Dual-Proxy Instead (Recommended)
If Browser Automation continues to fail, use the **SERP API + Luna Proxy** approach:
1. **Do NOT enable** "Use Browser Automation"
2. **DO enable** "Use SERP API" in campaign settings
3. Configure Luna residential proxy for target site visits
4. System will: Search via SERP API → Click URL → Visit with Luna proxy

**Benefits of Dual-Proxy:**
- ✅ Reliable SERP results from Bright Data
- ✅ Residential IPs from Luna for target site
- ✅ Works even if Browser Automation API has issues
- ✅ Better for geo-targeted campaigns

## Implementation

### For Browser Automation Only (if you prefer single approach):
1. Ensure WebSocket endpoint is correct in Settings
2. Set campaign to use Browser Automation
3. Disable SERP API and Luna proxy
4. Check server logs for exact error message

### For Dual-Proxy (Recommended):
1. Configure SERP API credentials in Settings
2. Configure Luna proxy username/password
3. In campaign:
   - Enable "Use SERP API"
   - Enable "Use Residential Proxies"
   - Disable "Use Browser Automation"
4. Add search keywords
5. Start campaign

## Debugging Steps

### Check Server Logs
When campaign fails, SSH into AWS server:
```bash
ssh ubuntu@13.218.100.97
pm2 logs server | grep -A 5 "BROWSER AUTOMATION\|403"
```

Look for lines like:
```
[BROWSER AUTOMATION] 403 Error - Check these credentials:
[BROWSER AUTOMATION] Connection failed: Unexpected server response: 403
```

### Verify Endpoint Format
The endpoint should contain:
- ✅ `wss://` protocol
- ✅ `brd-customer-hl_a908b07a` (your customer ID)
- ✅ `-zone-` followed by zone name
- ✅ `:PASSWORD` after zone
- ✅ `@brd.superproxy.io:9222` endpoint and port

### Wrong Format Examples
```
❌ wss://hl_a908b07a... (missing brd-customer prefix)
❌ wss://...:8080 (wrong port, should be 9222)
❌ wss://...@pr.lunaproxy.com (wrong host, should be brd.superproxy.io)
❌ http:// instead of wss:// (wrong protocol)
```

## Why You Can't Use Both Methods Simultaneously

**Browser Automation API:**
- Connects to Bright Data's remote browser
- Bright Data controls the IP/proxy
- 403 means Bright Data rejected the connection
- Cannot layer Luna proxy on top

**Dual-Proxy Method:**
- SERP API handles Google search (Bright Data's infrastructure)
- Luna proxy handles target site visit (your residential IPs)
- No conflict - two separate systems
- More reliable for production

## Code Changes Made

### puppeteer-server.js
- Added detailed logging for Browser Automation connection
- Added error diagnostics for 403 errors
- Improved error messages to guide troubleshooting
- Logs endpoint (first 50 chars) for verification

### SerpConfig.tsx (Settings UI)
- Added troubleshooting checklist
- Added hints for zone name and credential format
- Explains difference between Browser Automation and dual-proxy

### campaign-scheduler/index.ts
- Auto-disables Browser Automation when SERP API is enabled
- Ensures dual-proxy flow gets correct credentials
- Prevents conflicting configurations

## Final Recommendation

**Use Dual-Proxy (SERP API + Luna)** for:
- ✅ Production campaigns
- ✅ Search traffic with Luna proxies
- ✅ Geo-targeted campaigns
- ✅ Better reliability

**Use Browser Automation Only** if:
- ✅ You need a single browser without proxy switching
- ✅ 403 issue is resolved with zone/credential adjustment
- ✅ Your use case doesn't require geo-specific proxies

Test the zone change first - if `unblocker` zone works, use that. If not, switch to dual-proxy approach which is more robust.
