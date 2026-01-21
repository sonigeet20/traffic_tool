# ⚡ Real-Time Logging - Quick Reference

## What's New ✨
- **Real-time log viewer** in campaign details page (bottom-right floating terminal)
- **Automatic log cleanup** - keeps only last 10 sessions' logs per campaign
- **Color-coded levels** - info (cyan), warn (yellow), error (red), debug (gray)
- **Live updates** - logs appear as sessions execute

## Files Created/Modified

### New Files:
- ✅ `supabase/migrations/20260122010000_add_session_logs.sql` - Database table
- ✅ `supabase/migrations/20260122020000_add_session_logs_cleanup.sql` - Auto-cleanup trigger
- ✅ `src/components/RealtimeLogs.tsx` - Frontend component
- ✅ `puppeteer-server-enhanced.js` - Reference backend implementation
- ✅ `REALTIME_LOGGING_SETUP.md` - Implementation guide
- ✅ `REALTIME_LOGGING_STATUS.md` - Complete status document

### Modified Files:
- ✅ `src/components/CampaignDetails.tsx` - Added RealtimeLogs component

## Do These NOW 🔴

### 1️⃣ Apply Cleanup Migration
```
1. Go to https://supabase.com/dashboard/project/pffapmqqswcmndlvkjrs/sql/new
2. Copy from: supabase/migrations/20260122020000_add_session_logs_cleanup.sql
3. Paste in SQL editor → Click "Run"
```

### 2️⃣ Update Puppeteer Servers (EC2)
```
Option A: Use puppeteer-server-enhanced.js as reference
- SSH into EC2 instances (44.200.203.114 & 52.54.247.189)
- Integrate insertSessionLog() calls into server.js

Option B: Deploy via your CI/CD pipeline
- Merge logging code into main puppeteer server
```

### 3️⃣ Test It
```
1. Start a campaign from UI
2. Open Campaign Details page
3. Watch real-time logs appear at bottom-right
4. Expand window to see full 800x600 view
5. Verify "Session completed successfully" appears
```

## Log Example 📝
```
[info] Session started - Target: example.com, Search: keyword
[debug] Device profile selected: Windows 11 - Chrome 120 - High-end
[info] SERP API search starting for keyword: target keyword
[info] Found target URL in SERP results
[info] Navigating to target URL: https://example.com/page
[info] Page loaded successfully
[debug] Executing 2 user journey actions
[debug] User journey action: clicked #button-id
[info] Session completed successfully
```

## Logs Auto-Delete When ❌
- Campaign has more than 10 sessions running
- Oldest session logs get deleted automatically
- Keeps only last 10 sessions' logs per campaign
- One-time cleanup on trigger apply
- Ongoing cleanup after each new log insert

## Features 🎯

| Feature | How to Use |
|---------|-----------|
| **Expand** | Click maximize icon in top-right |
| **Auto-scroll** | Check "Auto-scroll" checkbox to follow new logs |
| **Clear** | Click "Clear" button to reset view |
| **Close** | Click X button to hide component |
| **Color coding** | Different colors for info/warn/error/debug |

## What Logs Show 📊

- ✅ Session start/completion
- ✅ Device profile selection
- ✅ SERP search results
- ✅ URL navigation
- ✅ Browser connection status
- ✅ User journey actions (clicks, typing)
- ✅ Bandwidth usage
- ✅ Proxy setup
- ✅ Extension loading
- ✅ Errors and warnings

## Components Involved 🔧

```
RealtimeLogs Component
  ↓ Subscribes to
Supabase session_logs table
  ↓ Receives logs from
EC2 Puppeteer Servers
  ↓ Insert logs via
insertSessionLog() function
```

## Deployment Checklist ☑️

- [ ] Cleanup migration applied to Supabase
- [ ] Puppeteer server updated with logging
- [ ] Campaign started successfully
- [ ] Logs appear in Campaign Details page
- [ ] All 4 log levels showing correctly
- [ ] Auto-scroll working
- [ ] Expand/collapse working
- [ ] Old logs auto-deleting (10+ sessions)

---

**Status**: Ready to test | **Effort**: 2-3 hours for full integration | **Impact**: Full session visibility ✨
