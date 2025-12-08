# Puppeteer Timeout Fix - Deployment Instructions

## Problem Identified
Sessions were NOT completing because the Puppeteer server had navigation timeouts set to 2 minutes (120s), but sessions were configured to run for 30-120 seconds (+ proxy overhead). When combined with the wait time, sessions exceeded the timeout and hung indefinitely.

## Changes Made
Updated all timeouts in `puppeteer-server.js`:
- ✅ Browser launch timeout: 120s → **300s**
- ✅ All navigation timeouts: 120s → **300s**
- ✅ Selector wait timeout: 30s → **60s**

## Deployment Steps

### Option 1: Automatic (If you have SSH configured)
```bash
cd /tmp/cc-agent/60507420/project
./deploy-puppeteer-fix.sh
```

### Option 2: Manual Deployment

1. **Copy the fixed file to your server:**
```bash
scp puppeteer-server.js ubuntu@13.218.100.97:~/puppeteer-server/server.js
```

2. **SSH into your server:**
```bash
ssh ubuntu@13.218.100.97
```

3. **Restart the PM2 process:**
```bash
cd ~/puppeteer-server
pm2 restart server
pm2 status
```

4. **Monitor logs to verify it's working:**
```bash
pm2 logs server --lines 50
```

## Verification

After deployment, you should see:
1. ✅ Sessions completing with status "completed" in database
2. ✅ Sessions finishing at random times (30-120 seconds)
3. ✅ No more "timeout" errors in logs
4. ✅ `completed_at` timestamps being set properly

### Check Database Status
Run this query in Supabase SQL editor to verify completions:
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM bot_sessions
WHERE created_at > NOW() - INTERVAL '30 minutes'
GROUP BY status
ORDER BY status;
```

You should see:
- "completed" sessions with varying durations
- Fewer "running" sessions
- Fewer "failed" sessions

## Expected Behavior After Fix

- ✅ Sessions will start
- ✅ Wait for random duration (30-120s for your current config)
- ✅ Browser completes automation
- ✅ Returns success response
- ✅ Edge function marks session as "completed"
- ✅ Dashboard shows accurate analytics

## Troubleshooting

If sessions still don't complete:
1. Check PM2 logs: `pm2 logs server --lines 100`
2. Check for new errors
3. Verify the file was actually replaced: `head -20 ~/puppeteer-server/server.js`
4. Check database for recent completed sessions

## Next Steps
Once deployed and verified:
1. Monitor the dashboard for 5-10 minutes
2. Confirm sessions are completing
3. Check that bounce rate is working (30% should bounce in 1-5 seconds)
4. Verify analytics are being recorded properly
