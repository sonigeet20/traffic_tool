# Deployment Checklist - Browser API Search Traffic

## Pre-Deployment Verification

### Code Changes
- [x] `CampaignDetails.tsx` - browserApiConfig state added
- [x] `CampaignDetails.tsx` - loadBrowserApiConfig() function added
- [x] `CampaignDetails.tsx` - handleExecute() pre-loads config before sessions
- [x] `CampaignDetails.tsx` - runSession() includes defensive load + Browser API payload
- [x] `CampaignForm.tsx` - UI labels updated to "Browser API for Search Traffic"
- [x] `server.cjs` - searchWithBrowserAPI() function implemented
- [x] `server.cjs` - /api/automate routing logic includes Browser API check
- [x] Server compiles without errors
- [x] Frontend compiles without errors (pre-existing TypeScript issues noted)

### Documentation
- [x] BROWSER_API_FIX.md - Explains the state timing issue and solution
- [x] BROWSER_API_IMPLEMENTATION.md - Complete architecture and implementation details
- [x] TESTING_CHECKLIST.md - Step-by-step testing guide with troubleshooting

## Pre-Deployment Requirements

### Bright Data Setup
- [ ] Verify Browser API subscription is active in Bright Data dashboard
- [ ] Confirm customer ID and password are correct
- [ ] Test Browser API connection separately (optional but recommended)
- [ ] Verify zone configuration (usually 'unblocker')
- [ ] Check daily/monthly quota limits

### Supabase Configuration
- [ ] Verify `serp_configs` table exists with columns:
  - `user_id` (UUID, foreign key to auth.users)
  - `browser_customer_id` (text)
  - `browser_password` (text)
  - `browser_zone` (text, default: 'unblocker')
  - `browser_endpoint` (text, default: 'brd.superproxy.io')
  - `browser_port` (int, default: 9222)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- [ ] Add Browser API credentials for test account
- [ ] Verify campaigns table has `use_luna_proxy_search` column (boolean)
- [ ] Verify campaigns table has `use_browser_automation` column (boolean)

### Server Configuration
- [ ] Node.js version >= 16.0
- [ ] Puppeteer-extra installed
- [ ] StealthPlugin installed
- [ ] All dependencies in package.json up to date
- [ ] Environment variables configured if using AWS
- [ ] Server can connect to Supabase
- [ ] Server can create WebSocket connections (firewall allows outbound 9222)

### Frontend Configuration
- [ ] React version compatible with useEffect and useState
- [ ] Supabase client initialized correctly
- [ ] API endpoint URLs configured correctly
- [ ] Environment variables (.env) set properly

## Pre-Deployment Testing

### Local Testing
1. [ ] Test Browser API credentials work (use BROWSER_API_FIX.md debug section)
2. [ ] Create test campaign with Browser API enabled
3. [ ] Follow TESTING_CHECKLIST.md completely
4. [ ] Verify all success criteria are met
5. [ ] Monitor server logs for errors
6. [ ] Check database for proper session recording

### Smoke Testing
1. [ ] Test with search traffic (verify Browser API routing)
2. [ ] Test with direct traffic (verify Luna proxy fallback)
3. [ ] Test without search keywords (verify Luna proxy used)
4. [ ] Test with wrong proxy provider (verify Luna proxy used)
5. [ ] Monitor memory usage (Puppeteer can be memory-intensive)

### Edge Cases
- [ ] Campaign with no search keywords → Luna proxy
- [ ] Campaign with empty proxy credentials → Browser API (if enabled) or error handling
- [ ] Concurrent sessions (5+ at once) → Verify no connection conflicts
- [ ] Long-running campaigns (1000+ sessions) → Monitor resource usage
- [ ] User without serp_configs entry → Graceful fallback to Luna proxy
- [ ] Expired Browser API credentials → Server-side error handling

## Deployment Steps

### Step 1: Database Migrations (if needed)
```sql
-- Add columns if not already present (check before running)
ALTER TABLE campaigns ADD COLUMN use_luna_proxy_search BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN use_browser_automation BOOLEAN DEFAULT false;

-- Create serp_configs table if not exists
CREATE TABLE IF NOT EXISTS serp_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_customer_id TEXT,
  browser_password TEXT,
  browser_zone TEXT DEFAULT 'unblocker',
  browser_endpoint TEXT DEFAULT 'brd.superproxy.io',
  browser_port INTEGER DEFAULT 9222,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### Step 2: Deploy Frontend
1. [ ] Build frontend: `npm run build`
2. [ ] Deploy build artifacts to hosting (Vercel, netlify, etc.)
3. [ ] Verify frontend loads without errors
4. [ ] Clear browser cache and test

### Step 3: Deploy Backend
1. [ ] Stop current server instance
2. [ ] Pull latest code
3. [ ] Run `npm install` (if dependencies changed)
4. [ ] Start server with `node server.cjs`
5. [ ] Verify server starts and logs "✅ Server running on port 3000"
6. [ ] Test API endpoint: `curl -X GET http://localhost:3000/health`

### Step 4: Verify Integration
1. [ ] Test frontend-to-backend communication
2. [ ] Create campaign and click "Start Campaign"
3. [ ] Monitor logs for correct routing
4. [ ] Check database for session records
5. [ ] Verify search results are extracted

### Step 5: Monitor & Alert
1. [ ] Set up server monitoring (PM2, New Relic, etc.)
2. [ ] Set up error logging (Sentry, LogRocket, etc.)
3. [ ] Monitor memory usage (Puppeteer can leak)
4. [ ] Monitor Browser API quota usage
5. [ ] Set up alerts for errors and failures

## Post-Deployment Verification

### Immediate (First Hour)
- [ ] No critical errors in logs
- [ ] Server responding to requests
- [ ] Database connection stable
- [ ] Sessions being created successfully
- [ ] Search traffic routing to Browser API
- [ ] Direct traffic routing to Luna proxy

### Short-term (First 24 Hours)
- [ ] Monitor server memory (should not exceed 2GB)
- [ ] Check session success rate (should be > 90%)
- [ ] Verify search results are being extracted
- [ ] Monitor API response times
- [ ] Check Browser API quota usage

### Long-term (First Week)
- [ ] Verify no memory leaks over extended runs
- [ ] Check cost vs performance ratio
- [ ] Gather user feedback
- [ ] Optimize settings based on real data
- [ ] Document any issues encountered

## Rollback Plan

If issues occur post-deployment:

### Minor Issues (Bugs, UI Problems)
1. [ ] Revert frontend code to previous version
2. [ ] Redeploy frontend
3. [ ] Verify issues resolved
4. [ ] Investigate and fix in next release

### Major Issues (Server Crashes, Data Loss)
1. [ ] Stop server immediately
2. [ ] Revert backend code
3. [ ] Restart server
4. [ ] Switch direct traffic back to Luna proxy
5. [ ] Investigate root cause before re-deploying

### Data Integrity Issues
1. [ ] Stop all sessions
2. [ ] Check Supabase database integrity
3. [ ] Verify no orphaned records
4. [ ] Consider database restore from backup

## Support & Monitoring

### Key Metrics to Monitor
- Sessions created per hour
- Session success rate (%)
- Average session duration
- Server CPU usage (%)
- Server memory usage (MB)
- Browser API quota remaining
- Search result extraction success rate (%)
- API response time (ms)

### Common Issues & Fixes
| Issue | Cause | Fix |
|-------|-------|-----|
| 0 organic results | Result selector failed | Check BROWSER_API_FIX.md |
| Browser API timeout | Connection issue | Verify network, try again |
| Luna proxy used for search | Config not loaded | Check serp_configs table |
| OOM (Out of Memory) | Memory leak | Restart server, investigate |
| Slow searches | Google responding slow | Increase timeouts |
| CAPTCHA blocks | Browser API issue | Check subscription status |

## Contacts & Resources

- Bright Data Support: https://bright.zendesk.com/hc/en-us
- Supabase Docs: https://supabase.com/docs
- Puppeteer Docs: https://pptr.dev/
- Server Logs: Check terminal where `node server.cjs` runs
- Browser Console: Press F12 in browser and check Console tab

## Sign-off

- [ ] All pre-deployment checks completed
- [ ] All testing passed
- [ ] Team reviewed and approved
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Ready for production deployment

**Deployment Date**: _______________
**Deployed By**: _______________
**Approval**: _______________
