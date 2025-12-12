# Browser Automation 403 Error - Diagnostic Guide

## The Real Issue

Your credentials format is **CORRECT** based on Bright Data's official documentation. The 403 error means:

**Bright Data is rejecting your authentication credentials - the format is right, but the credentials themselves are invalid/unauthorized for that zone.**

## Official Bright Data Example

Bright Data provides this exact pattern:
```javascript
const browserWSEndpoint = `wss://${AUTH}@brd.superproxy.io:9222`;
const browser = await puppeteer.connect({ browserWSEndpoint });
```

Where `AUTH` = `brd-customer-hl_a908b07a-zone-scraping_browser1:dw6x0q7oe6ix`

**This is exactly what you're using - so the issue is with the credentials themselves, not the format.**

## Why 403 Occurs (Not a Code Issue)

The 403 Unauthorized error from Bright Data means:

1. **Zone doesn't exist or isn't active** for your account
   - `scraping_browser1` might not be set up
   - Zone might be disabled/inactive

2. **Zone requires different authentication**
   - SERP API password ≠ Browser Automation password
   - You might be using SERP credentials for Browser Automation

3. **Account doesn't have Browser Automation access**
   - Feature might not be enabled for your Bright Data account
   - Different tier required

4. **Wrong customer ID**
   - `hl_a908b07a` might not be your actual customer ID
   - Should be in format: `hl_` followed by 8 alphanumeric chars

## How to Test & Fix

### Step 1: Run Direct Test (No Code Changes Needed)
```bash
node test-browser-automation.js "wss://brd-customer-hl_a908b07a-zone-scraping_browser1:dw6x0q7oe6ix@brd.superproxy.io:9222"
```

This will:
- ✅ Test exact endpoint format
- ✅ Attempt real connection
- ✅ Show detailed error message
- ✅ Provide specific troubleshooting steps

### Step 2: Get Correct Credentials from Bright Data

**DO NOT use SERP credentials for Browser Automation**

1. Log into https://brightdata.com
2. Navigate to **Proxy & Scraping Infrastructure** → **Browser Automation**
3. Look for your zone configuration
4. Copy the **full WebSocket endpoint** - it will look like:
   ```
   wss://brd-customer-{YOUR_ID}-zone-{YOUR_ZONE}:{YOUR_PASSWORD}@brd.superproxy.io:9222
   ```
5. Note the exact zone name (might be different from what you're using)

### Step 3: Try Different Zone Names
If `scraping_browser1` returns 403, try these in order:
```bash
# Try 1: unblocker zone
node test-browser-automation.js "wss://brd-customer-hl_a908b07a-zone-unblocker:dw6x0q7oe6ix@brd.superproxy.io:9222"

# Try 2: Check dashboard for other active zones
# Then test them
```

### Step 4: Verify Customer ID

The customer ID `hl_a908b07a` should match exactly what's in your Bright Data dashboard:

1. Log into Bright Data
2. Go to Account Settings or Proxy page
3. Find your **Customer ID**
4. It should start with `hl_` followed by 8 characters
5. If it's different, use the correct one:
   ```bash
   # Example with different ID
   node test-browser-automation.js "wss://brd-customer-hl_XXXXXXXX-zone-unblocker:PASSWORD@brd.superproxy.io:9222"
   ```

## What The Test Script Does

```bash
node test-browser-automation.js "YOUR_ENDPOINT_HERE"
```

If **successful** (✅):
- Connects to Bright Data
- Creates a browser instance
- Opens a page
- Navigates to example.com
- Confirms all features work

If **fails with 403**:
- Provides exact troubleshooting steps
- Suggests zone alternatives
- Shows credential format requirements

## Using in Your App

Once you confirm the endpoint works with test script:

1. Go to **Settings > SERP Config**
2. Enable "Browser Automation"
3. Paste the **working endpoint** into "Bright Data WebSocket Endpoint"
4. Save
5. Create campaign with "Use Browser Automation" enabled
6. Should now work

## Code Changes Made

We improved error logging:
- Parses your endpoint to show: Customer ID, Zone, Password status
- Shows exact error message from Bright Data
- Provides solution checklist for 403 errors
- Increased timeout from 30s to 60s for slow connections

## Critical Points

❌ **Don't do this:**
- Use same credentials for SERP API and Browser Automation
- Assume `scraping_browser1` exists in your account
- Mix HTTP/HTTPS endpoints

✅ **Do this:**
- Test with `test-browser-automation.js` script first
- Use exact credentials from Bright Data dashboard
- Try `unblocker` zone if primary zone fails
- Verify customer ID matches dashboard
- Ensure port is 9222 (not 33335)

## If Browser Automation Still Fails

**Use Dual-Proxy Method Instead** (more reliable):
```
SERP API (Bright Data) → Luna Proxy (target site)
```

This approach:
- ✅ Doesn't require Browser Automation
- ✅ Works with your current SERP credentials
- ✅ Gives you control over proxy for target visit
- ✅ More flexible for geo-targeting

## Summary

1. Run test script: `node test-browser-automation.js "wss://..."`
2. Get correct credentials from Bright Data dashboard
3. Try zone name alternatives (unblocker, etc.)
4. If 403 persists, verify customer ID
5. If still failing, use Dual-Proxy instead

The code is correct - the credentials need to be verified in your Bright Data account.
