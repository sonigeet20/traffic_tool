# Testing Checklist - Browser API Search Traffic Fix

## Pre-Flight Checks

### 1. Database Verification
- [ ] Log in to Supabase dashboard
- [ ] Navigate to `serp_configs` table
- [ ] Verify your user's row exists and has:
  - `browser_customer_id` = Your Bright Data customer ID
  - `browser_password` = Your Bright Data password
  - `browser_zone` = 'unblocker' (or your custom zone)
  - `browser_endpoint` = 'brd.superproxy.io' (or custom endpoint)
  - `browser_port` = 9222 (or your custom port)

### 2. Campaign Setup
- [ ] Create or edit a campaign with:
  - Name: "Browser API Test Campaign"
  - Target URL: "https://groeixyz.com/" (or your test domain)
  - Proxy Provider: "luna"
  - **Browser API for Search Traffic**: ENABLED (checked)
  - Search Keywords: ["groeixyz.com", "test traffic"]
  - Traffic Distribution: 50% search, 50% direct
  - Session Duration: 30-120 seconds
  - Total Sessions: 5
- [ ] Verify campaign shows `use_luna_proxy_search = true` in database

### 3. Browser & Network
- [ ] Open browser developer tools (F12)
- [ ] Go to Console tab
- [ ] Make sure no previous logs are filtering results

## Execution Tests

### Test 1: Frontend Payload Construction
1. [ ] Click "Start Campaign" button
2. [ ] Check browser console immediately for logs like:
   ```
   [DEBUG runSession] sessionId=..., isSearchTraffic=true, searchKeyword=...
   [DEBUG runSession] browserApiConfig exists=...
   ```
3. [ ] Look for:
   ```
   [DEBUG] Condition met for Browser API: search traffic + keywords + luna proxy + use_luna_proxy_search
   [DEBUG] Including Browser API credentials for search
   ```
4. [ ] **Expected**: Should see "Including Browser API credentials", NOT "config not available"

### Test 2: Network Request
1. [ ] Open Network tab in browser developer tools
2. [ ] Filter for `/api/automate` requests
3. [ ] Click "Start Campaign"
4. [ ] Click on the `/api/automate` POST request
5. [ ] Go to "Request" tab and check the JSON body
6. [ ] Look for these fields in the payload:
   - `useLunaProxySearch: true`
   - `browser_customer_id: "..."`
   - `browser_password: "..."`
   - `browser_zone: "unblocker"`
   - `browser_endpoint: "brd.superproxy.io"`
   - `browser_port: 9222`
7. [ ] **Expected**: All Browser API credentials should be present in the payload

### Test 3: Server-Side Routing
1. [ ] Open terminal where server is running
2. [ ] Look for logs after campaign starts:
   ```
   [SEARCH] Using Browser API for Google search
   [BROWSER API] Connecting to: wss://brd-customer-...-zone-unblocker...
   ```
3. [ ] **Expected**: Should see Browser API connection logs, NOT Luna proxy logs
4. [ ] **NOT Expected**: Should NOT see `[LUNA PROXY] Authenticating`

### Test 4: Search Results
1. [ ] Monitor browser console for results:
   ```
   [SERP] Found X organic results for "groeixyz.com"
   [RESULTS] Result 1: ...
   ```
2. [ ] **Expected**: Should extract and log search results
3. [ ] **Not Expected**: Should NOT see `[SEARCH] Found 0 organic results`

### Test 5: Session Completion
1. [ ] Wait for session to complete (usually 30-120 seconds)
2. [ ] Check Supabase `bot_sessions` table
3. [ ] Verify the session row has:
   - `status: 'completed'`
   - `search_keyword: 'groeixyz.com'` (the keyword used)
   - `traffic_source: 'search'`
   - `google_search_attempted: true`

## Troubleshooting

### Issue: "Browser API config not available"
**Symptoms**: Console shows `[DEBUG] Browser API config not available for search`

**Solutions**:
1. Check if `serp_configs` has data for your user (Supabase dashboard)
2. Verify `browser_customer_id` is not null/empty
3. Check if you're logged in to the correct Supabase account
4. Verify `loadBrowserApiConfig()` actually fetched the row

**Debug**: Add to browser console:
```javascript
// Get current user
const user = (await supabase.auth.getUser()).data.user;
console.log('Current user:', user?.id);

// Query serp_configs
const config = await supabase
  .from('serp_configs')
  .select('*')
  .eq('user_id', user.id);
console.log('serp_configs:', config);
```

### Issue: Credentials in payload but still using Luna Proxy
**Symptoms**: Payload has Browser API creds, but server logs show Luna Proxy

**Solutions**:
1. Verify `campaign.proxy_provider === 'luna'` - must be exactly "luna"
2. Verify `campaign.use_luna_proxy_search === true` in database
3. Check that search keywords are populated (not empty array)
4. Verify `isSearchTraffic` is true (50% chance based on traffic distribution)

**Debug**: In `runSession()`, check these:
```javascript
console.log('isSearchTraffic:', isSearchTraffic);
console.log('searchKeyword:', searchKeyword);
console.log('campaign.proxy_provider:', campaign.proxy_provider);
console.log('campaign.use_luna_proxy_search:', campaign.use_luna_proxy_search);
```

### Issue: Search returns 0 results
**Symptoms**: Console shows `[SEARCH] Found 0 organic results`

**Solutions**:
1. This is expected initially - search result extraction uses 3 fallback methods
2. Browser API should still have connected (check for `[BROWSER API] Connected` log)
3. Try searching for a more common keyword (e.g., "test site:google.com")
4. Verify Google loaded (check DOM with inspector)

### Issue: Connection timeout to Browser API
**Symptoms**: Server logs show connection errors to `wss://brd-customer-...`

**Solutions**:
1. Verify your Bright Data Browser API credentials are correct
2. Check if your Browser API subscription is active (Bright Data dashboard)
3. Ensure your IP is whitelisted if needed (Bright Data settings)
4. Try with `browser_zone: 'unblocker'` (default)

## Success Criteria

All of these should be true for a successful test:

- [ ] Browser console shows `[DEBUG] Including Browser API credentials for search`
- [ ] Network tab shows payload includes `useLunaProxySearch: true`
- [ ] Payload includes complete Browser API credentials
- [ ] Server logs show `[SEARCH] Using Browser API for Google search`
- [ ] Server logs show WebSocket connection to Browser API endpoint
- [ ] Session completes with status 'completed'
- [ ] Search keywords are recorded in `bot_sessions.search_keyword`
- [ ] Server is NOT showing Luna Proxy logs for search traffic

## Performance Expectations

- **Search Setup**: 2-3 seconds (Google loads)
- **Keyword Entry**: 1 second
- **Search Execution**: 2-3 seconds
- **Result Click**: 1-2 seconds (site loads)
- **Session Duration**: 30-120 seconds (configurable)
- **Total Per Session**: 40-130 seconds

If sessions are timing out, increase `session_duration_max` in campaign settings.

## Next Steps After Testing

1. If all success criteria met:
   - Deploy with confidence
   - Monitor first few campaigns
   - Adjust settings based on real-world performance

2. If failures occur:
   - Review troubleshooting section above
   - Check debug logs thoroughly
   - Verify Bright Data credentials and subscription status
   - Contact support with logs if needed
