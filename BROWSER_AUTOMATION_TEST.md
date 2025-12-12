# Browser Automation API - Testing & Troubleshooting

## The Core Issue

Your **endpoint format is correct** (matches official Bright Data example). The **403 error means Bright Data is rejecting your credentials**, not your code.

## Quick Test

**Before uploading to AWS**, test your credentials locally:

```bash
node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-scraping_browser1:dw6x0q7oe6ix@brd.superproxy.io:9222"
```

**If it says ✅ SUCCESS:**
- Your credentials work
- Upload to AWS and use Browser Automation
- Everything should work

**If it says ❌ 403 Unauthorized:**
- Try with `unblocker` zone:
  ```bash
  node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222"
  ```
- If that works, use the unblocker endpoint in Settings
- If nothing works, use Dual-Proxy instead

## What Each Approach Does

### Browser Automation Only
- ✅ Single connection to Bright Data remote browser
- ✅ Bright Data handles Google search AND target site
- ❌ Requires valid credentials (403 issue with some zones)
- ❌ No proxy control for target site
- Code: Uses `useBrowserAutomation: true`

### Dual-Proxy (SERP API + Luna)
- ✅ Search via Bright Data SERP API
- ✅ Target site via Luna residential proxy
- ✅ Proxy control for geolocation
- ✅ Works even if Browser Automation has credential issues
- ✅ More reliable for production
- Code: Uses `useSerpApi: true` + Luna proxy

## Steps to Fix Browser Automation

### Step 1: Test Locally (5 minutes)
```bash
# Current credentials
node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-scraping_browser1:dw6x0q7oe6ix@brd.superproxy.io:9222"

# If 403, try unblocker zone
node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222"

# Get credentials from dashboard if above fail
# Go to https://brightdata.com > Browser Automation > copy full endpoint
```

### Step 2: Save Working Endpoint
Once a test succeeds, save that endpoint:
- Go to Settings > SERP Config
- Paste in "Bright Data WebSocket Endpoint"
- Enable "Browser Automation"
- Save

### Step 3: Test Campaign
- Create campaign with "Use Browser Automation" enabled
- Disable SERP API and Luna proxy
- Start campaign and monitor logs

## File Changes Made

### puppeteer-server.js
✅ Enhanced error logging:
- Shows parsed endpoint details (customer ID, zone, password status)
- Detailed 403 error guidance
- Increased timeout from 30s to 60s
- Logs full error stack

### test-browser-auth.cjs
✅ New diagnostic tool:
- Tests endpoint in isolation
- Provides zone switching suggestions
- Shows exact fixes for common issues
- No dependencies beyond puppeteer-core

### BROWSER_AUTOMATION_DIAGNOSTIC.md
✅ Complete troubleshooting guide:
- Why 403 occurs
- How Bright Data example works
- Step-by-step testing procedure
- Zone name alternatives

## Expected Test Output

### ✅ Success Output
```
🔍 Testing Bright Data Browser Automation

📋 Parsed Endpoint:
   Customer ID: brd-customer-hl_a908b07a
   Zone: scraping_browser1
   Has Password: ✓ yes

⏳ Connecting to Bright Data...

✅ SUCCESS! Connected to Bright Data Browser Automation API

Your credentials are valid and working.
```

### ❌ 403 Error Output
```
❌ FAILED: Unexpected server response: 403

🔧 403 Unauthorized - Credential Issue

Solutions:
1. Verify zone name in Bright Data dashboard
   - Try: -zone-unblocker instead of -zone-scraping_browser1
2. Copy FULL endpoint from Bright Data dashboard
3. Verify customer ID (hl_xxxxx) is correct
4. Ensure port is 9222 (not 33335 or other)

Command to retry with unblocker zone:
node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222"
```

## Why We Can't Use Both Methods

When you try Browser Automation **AND** SERP API:
- Browser Automation connects to Bright Data's remote browser
- We try to add Luna proxy on top
- Conflicts occur, both fail

**Solution:** Auto-disable Browser Automation when SERP API enabled (already implemented)

## Recommendation

### If test succeeds → Use Browser Automation
- Simpler setup
- Single proxy approach
- Good for non-geo-specific campaigns

### If test fails with 403 → Use Dual-Proxy
- More reliable
- Geo-targeting control
- Better for production
- Fallback if Bright Data zone issues

## Next Steps

1. **Test locally now:**
   ```bash
   node test-browser-auth.cjs "wss://brd-customer-hl_a908b07a-zone-scraping_browser1:dw6x0q7oe6ix@brd.superproxy.io:9222"
   ```

2. **If ✅ success:** Upload puppeteer-server.js to AWS and test campaign

3. **If ❌ 403:** Try unblocker zone or use Dual-Proxy method

4. **Monitor campaign:** Check logs for [BROWSER AUTOMATION] messages

## Files to Upload to AWS

1. `puppeteer-server.js` - Updated with better error logging
2. `package.json` - No changes needed (axios already installed)

Command:
```bash
scp -i ~/.ssh/your-key.pem puppeteer-server.js ubuntu@13.218.100.97:/home/ubuntu/puppeteer-server/server.js
```

Then:
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@13.218.100.97
cd /home/ubuntu/puppeteer-server
pm2 restart server
```

That's it! Test script works locally, then upload the production file to AWS.
