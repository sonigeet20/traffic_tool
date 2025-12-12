# Browser API Search Traffic - State Timing Fix

## Problem
Session execution was routing to Luna Proxy Direct instead of Browser API for search traffic, even when search keywords were present. Root cause: `browserApiConfig` state was undefined when payload was being constructed.

## Root Cause
React state initialization timing issue:
1. `loadBrowserApiConfig()` is called in `useEffect` on component mount (async)
2. User clicks "Start Campaign" → `handleExecute()` is called
3. `handleExecute()` immediately calls `runSession()` 5 times
4. `runSession()` constructs the payload
5. **ISSUE**: `browserApiConfig` state hasn't updated yet because the async Supabase query is still pending

## Solution
Two-part fix implemented in `CampaignDetails.tsx`:

### Part 1: Pre-load config before starting sessions
In `handleExecute()` function (line ~250):
```typescript
// Ensure Browser API config is loaded before starting sessions
if (!browserApiConfig && campaign.use_luna_proxy_search) {
  console.log('[DEBUG] Loading Browser API config before starting sessions');
  await loadBrowserApiConfig();
}
```

This ensures the Browser API credentials are fetched and the state is updated **before** any sessions are spawned.

### Part 2: Fallback load inside runSession (defensive)
In `runSession()` function (line ~185):
```typescript
// Load Browser API config if not already loaded
if (!browserApiConfig) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from('serp_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setBrowserApiConfig(data);
  }
}
```

This provides a safety net: if for any reason the config wasn't loaded in `handleExecute()`, it will be fetched inline before the payload is constructed.

## What Gets Loaded
When Browser API config is loaded, these credentials are fetched from the `serp_configs` table:
- `browser_customer_id` - Bright Data customer ID
- `browser_password` - Authentication password
- `browser_zone` - Proxy zone (default: 'unblocker')
- `browser_endpoint` - Browser API endpoint (default: 'brd.superproxy.io')
- `browser_port` - WebSocket port (default: '9222')

## Debug Logging
Added comprehensive debug logging to `runSession()`:
```
[DEBUG runSession] sessionId=..., isSearchTraffic=..., searchKeyword=...
[DEBUG runSession] browserApiConfig exists=..., campaign.use_luna_proxy_search=...
[DEBUG] Condition met for Browser API: search traffic + keywords + luna proxy + use_luna_proxy_search
[DEBUG] browserApiConfig is null, fetching from serp_configs...
[DEBUG] Successfully fetched serp_configs: { browser_customer_id, browser_zone, has_password }
[DEBUG] Including Browser API credentials for search
```

Check browser console for these logs when testing.

## Testing the Fix

### Prerequisites
1. Ensure your `serp_configs` table has Browser API credentials:
   - Log in to Supabase dashboard
   - Go to `serp_configs` table
   - Verify your row has `browser_customer_id` and `browser_password` populated

2. Create a campaign with:
   - `use_luna_proxy_search` = TRUE (labeled as "Browser API for Search Traffic")
   - Search keywords populated (e.g., ["groeixyz.com"])
   - Target URL set
   - Proxy provider = "luna"

### Test Steps
1. Open the campaign details page
2. Check browser console (F12) for `[DEBUG]` logs
3. Click "Start Campaign"
4. **Expected behavior**:
   - Logs should show `[DEBUG] Including Browser API credentials for search`
   - Payload sent to server should include: `useLunaProxySearch=true`, `browser_customer_id`, `browser_password`, etc.
5. Server logs should show: `[SEARCH] Using Browser API` instead of `[LUNA PROXY]`

### If Still Not Working
1. Check browser console logs - they will tell you exactly where it's failing
2. Verify `serp_configs` has data (Supabase dashboard)
3. Make sure campaign has `use_luna_proxy_search = true`
4. Verify `campaign.proxy_provider === 'luna'` in the campaign settings

## Backend Changes
No changes to `server.cjs` were needed - it already has:
- `searchWithBrowserAPI()` function for search traffic
- Routing logic in `/api/automate` endpoint
- All device fingerprinting and anti-detection measures

The backend was ready; this fix ensures the frontend sends the Browser API credentials in the payload.

## What This Enables
Once the Browser API config is properly loaded and sent:
- Google searches will use Bright Data Browser API (auto-CAPTCHA solving)
- Search traffic will find results for any keyword
- Luna proxy used only for direct navigation (cost-effective)
- No more "unusual traffic" blocks from Google

## Files Modified
- `src/components/CampaignDetails.tsx`
  - Updated `handleExecute()` to pre-load Browser API config
  - Updated `runSession()` with fallback config loading + debug logging
