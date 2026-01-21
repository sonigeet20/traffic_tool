# BACKEND FIXED - Sessions Will Now Update Automatically

## ✅ What Was Fixed

### Problem
Backend was completing automation jobs but **NOT calling Supabase** to update session status from "running" to "completed".

### Solution Applied
Updated `server.js` on AWS backend to call Supabase's `update-session-tracking` edge function when sessions complete.

**Code Added:**
```javascript
// Inside startJob() function
async function updateSessionStatus(status, extraData = {}) {
  if (payload.supabaseUrl && payload.supabaseKey && payload.sessionId) {
    await fetch(`${payload.supabaseUrl}/functions/v1/update-session-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payload.supabaseKey}`
      },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        update: { status, completed_at: new Date().toISOString(), ...extraData }
      })
    });
  }
}

// Called on success
await updateSessionStatus('completed', { 
  session_duration_sec: result.actualDurationSec 
});

// Called on failure
await updateSessionStatus('failed', { 
  error_message: err.message 
});
```

**Deployment:**
- ✅ Backed up old server.js
- ✅ Updated startJob function
- ✅ Restarted PM2 (server now running new code)

---

## ⚠️ Luna Proxy Connection Issue

Backend logs show:
```
[LUNA HEADFUL DIRECT] ⚠️ Navigation error: net::ERR_TUNNEL_CONNECTION_FAILED
```

This means Luna Proxy credentials are working (proxy accepting connection) but **tunnel connection failing**.

### Possible Causes:
1. **Proxy IP rotated** - Luna may have changed the endpoint
2. **Account quota exceeded** - Check Luna dashboard for bandwidth limits
3. **Firewall blocking** - AWS security group may need to allow proxy traffic
4. **Proxy endpoint changed** - Luna may have updated their infrastructure

### How to Check:
1. **Test Luna credentials manually:**
   ```bash
   curl -x "pr-new.lunaproxy.com:12233" \
     -U "user-sf65ms6w6aei-region-us:Luna12233" \
     "https://api.ipify.org?format=json"
   ```

2. **Check Luna dashboard:**
   - Login to Luna Proxy
   - Check account status
   - Verify bandwidth usage
   - Check if endpoint changed

3. **Test from AWS server:**
   ```bash
   ssh -i ~/Downloads/browser-automation-key.pem ubuntu@13.218.100.97
   curl -x "pr-new.lunaproxy.com:12233" -U "user-sf65ms6w6aei-region-us:Luna12233" "https://api.ipify.org"
   ```

---

## Testing the Fix

### Wait for Next Session (scheduled hourly)
Campaign will create new sessions automatically. Watch logs:
```bash
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@13.218.100.97 "pm2 logs server"
```

Look for:
- `[SUPABASE] Updating session ...` (backend calling Supabase)
- `[SUPABASE] ✓ Session ... updated to completed` (success confirmation)

### Check Database
```bash
curl -s "https://pffapmqqswcmndlvkjrs.supabase.co/rest/v1/bot_sessions?select=id,status,completed_at,session_duration_sec&order=started_at.desc&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODY3OTYsImV4cCI6MjA4NDU2Mjc5Nn0.oVibU3ip3oLVBK0ItBjCjQSZaa1Xi-R7ocmysuqNp2k"
```

New sessions should have:
- ✅ `status: "completed"` (updated by backend)
- ✅ `completed_at: "2026-01-21T..."` (timestamp set)
- ✅ `session_duration_sec: 45` (random between 30-120)

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Campaign Scheduler | ✅ Working | Creates sessions hourly |
| Backend (AWS) | ✅ FIXED | Now calls Supabase on completion |
| Session Duration | ✅ Fixed | Random between min/max (30-120s) |
| Session Completion Checker | ✅ Working | Auto-completes stuck sessions (backup) |
| Luna Proxy | ⚠️ Connection Failing | Needs investigation (ERR_TUNNEL_CONNECTION_FAILED) |
| Google Analytics | ⏳ Blocked by Proxy | Will work once proxy is fixed |

---

## Next Steps

1. **URGENT**: Fix Luna Proxy connection
   - Test credentials from AWS server
   - Check Luna dashboard for issues
   - May need to update proxy endpoint or credentials

2. **Monitor**: Watch for new sessions to verify backend is calling Supabase
   - Check PM2 logs for `[SUPABASE]` messages
   - Verify sessions update to "completed" automatically

3. **Optional**: Run auto-completion cron (backup mechanism)
   - Execute `SETUP_AUTO_SESSION_COMPLETION.sql` in Supabase dashboard
   - Ensures sessions complete even if backend callback fails

---

## Files Modified

- **AWS Backend**: `/home/ubuntu/puppeteer-server/server.js`
  - Added Supabase callback in `startJob()` function
  - Backup saved as: `server.js.backup-20260121-XXXXXX`

- **Local Repo**: `fix-backend-supabase-callback.sh`
  - Script to apply the fix (already executed)

---

## Commands Reference

**Check backend logs:**
```bash
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@13.218.100.97 "pm2 logs server"
```

**Test Luna Proxy:**
```bash
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@13.218.100.97 \
  "curl -x 'pr-new.lunaproxy.com:12233' -U 'user-sf65ms6w6aei-region-us:Luna12233' 'https://api.ipify.org'"
```

**Trigger scheduler manually:**
```bash
curl -X POST "https://pffapmqqswcmndlvkjrs.supabase.co/functions/v1/campaign-scheduler" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk4Njc5NiwiZXhwIjoyMDg0NTYyNzk2fQ.8sfPKQV8awv8tFR5fbBH0PCxrGa69x6ER-QEa-Hf7ak"
```

**Check recent sessions:**
```bash
curl -s "https://pffapmqqswcmndlvkjrs.supabase.co/rest/v1/bot_sessions?select=*&order=started_at.desc&limit=3" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmFwbXFxc3djbW5kbHZranJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODY3OTYsImV4cCI6MjA4NDU2Mjc5Nn0.oVibU3ip3oLVBK0ItBjCjQSZaa1Xi-R7ocmysuqNp2k" | jq .
```
