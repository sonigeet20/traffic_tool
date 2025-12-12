# Bright Data Browser Automation API Integration Guide

## Overview
Replace the dual-proxy SERP approach with Bright Data's Browser Automation API for a single unified proxy solution.

## Current Flow (Dual Proxy)
1. **SERP Search**: Bright Data SERP API proxy → Google Search
2. **Proxy Switch**: Close browser, relaunch with Luna proxy
3. **Target Visit**: Luna proxy → Target website

## New Flow (Browser Automation API)
1. **Connect**: Puppeteer connects to Bright Data's remote browser via WebSocket
2. **Entire Session**: Single Bright Data browser handles Google search AND target site
3. **No Switching**: Same browser/proxy throughout

## Implementation Steps

### 1. Update Bright Data Configuration Table
The `bright_data_serp_config` table should store Browser Automation credentials:

```sql
-- Add browser automation specific fields
ALTER TABLE bright_data_serp_config 
ADD COLUMN IF NOT EXISTS use_browser_automation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS browser_ws_endpoint TEXT;
```

### 2. Browser Automation WebSocket Format
```
wss://brd-customer-{CUSTOMER_ID}-zone-{ZONE}-country-{COUNTRY}:{PASSWORD}@brd.superproxy.io:9222
```

Example:
```
wss://brd-customer-hl_a908b07a-zone-unblocker-country-us:Dang7898@brd.superproxy.io:9222
```

### 3. Code Changes in puppeteer-server.js

**Before** (lines ~400-500):
- Launch local browser with proxy
- For SERP: Launch → Search → Close → Relaunch with Luna → Visit target

**After**:
```javascript
// Check if Browser Automation is enabled
if (useBrightDataBrowser && brightDataWsEndpoint) {
  console.log('[BRIGHT DATA] Connecting to Browser Automation API...');
  
  browser = await puppeteer.connect({
    browserWSEndpoint: brightDataWsEndpoint,
    ignoreHTTPSErrors: true,
  });
  
  console.log('[BRIGHT DATA] ✓ Connected to remote browser');
} else {
  // Standard local launch with proxy
  browser = await puppeteer.launch(launchOptions);
}
```

### 4. Benefits
✅ **Single proxy** for entire session (no switching)
✅ **Simpler code** - remove proxy switch logic
✅ **Better success rate** - no browser restart mid-session
✅ **Consistent fingerprint** - same browser throughout
✅ **Geo-targeting** - via WebSocket URL country parameter

### 5. Scheduler Changes
Remove the dual-proxy logic:

```typescript
// OLD: Separate logic for SERP vs direct
if (useSerpApi && trafficSource === 'search') {
  proxyType = 'serp_api';
  willUseProxy = true;  // For Luna after search
}

// NEW: Single proxy type for Browser Automation
if (useBrightDataBrowser && trafficSource === 'search') {
  proxyType = 'browser_automation';
  proxyIP = 'Bright Data (Browser Automation)';
  // No Luna needed - same browser throughout
}
```

### 6. Configuration UI
Add toggle in SERP Config component:
- [ ] Use SERP API (old dual-proxy method)
- [x] Use Browser Automation API (recommended)

## Testing Plan
1. Create campaign with Browser Automation enabled
2. Set search keyword
3. Monitor logs for WebSocket connection
4. Verify single browser session from search to target
5. Check analytics tracking works

## Credentials Needed
- Customer ID: `hl_a908b07a` (from current SERP config)
- Zone: `unblocker` or `serp_api1`
- Password: Current SERP API password
- Port: 9222 (WebSocket)

## Migration Path
1. ✅ Fix current dual-proxy issues (completed)
2. 🔄 Test current flow works with Luna credentials
3. ⏳ Add Browser Automation toggle to UI
4. ⏳ Implement WebSocket connection in puppeteer-server.js
5. ⏳ Test Browser Automation flow
6. ⏳ Migrate all campaigns to Browser Automation
