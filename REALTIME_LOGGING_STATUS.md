# Real-Time Session Logging - Implementation Summary

## ✅ Completed Tasks

### 1. Database Migrations
- **`supabase/migrations/20260122010000_add_session_logs.sql`** ✅
  - Created `session_logs` table with `log_timestamp`, `level`, `message`, `metadata` columns
  - Added indexes for efficient querying
  - Enabled Row Level Security (RLS) with policies for authenticated users and service role
  - Enabled realtime subscriptions for automatic log pushes to clients
  - Status: Applied to Supabase successfully

- **`supabase/migrations/20260122020000_add_session_logs_cleanup.sql`** ✅
  - Created `cleanup_old_session_logs()` trigger function
  - Automatically deletes logs for sessions older than the 10 most recent per campaign
  - Runs on each new log insert to maintain storage efficiency
  - Status: Ready to apply (paste in Supabase Dashboard SQL Editor)

### 2. Frontend Components
- **`src/components/RealtimeLogs.tsx`** ✅
  - Real-time log viewer component with Supabase subscription
  - Color-coded log levels (info/cyan, warn/yellow, error/red, debug/gray)
  - Expandable window (400x300 collapsed → 800x600 expanded)
  - Auto-scroll toggle for easy monitoring
  - Clear button to reset logs
  - All references to `log.timestamp` corrected to `log.log_timestamp`
  - Status: Ready for use

- **`src/components/CampaignDetails.tsx`** ✅
  - RealtimeLogs component imported and rendered at bottom of page
  - Passes `campaignId` prop for filtering logs
  - Status: Integrated and ready

### 3. Backend Server Code
- **`puppeteer-server-enhanced.js`** ✅
  - Reference implementation with full logging integration
  - `insertSessionLog()` helper function for Supabase inserts
  - Logging at 15+ key points in session lifecycle
  - Status: Ready for manual integration into EC2 puppeteer servers

- **`REALTIME_LOGGING_SETUP.md`** ✅
  - Complete implementation guide for developers
  - Troubleshooting section

## ⏳ Next Steps (Manual)

### Step 1: Apply Cleanup Migration to Supabase
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pffapmqqswcmndlvkjrs/sql/new
2. Copy content from `supabase/migrations/20260122020000_add_session_logs_cleanup.sql`
3. Paste into SQL Editor and click "Run"

### Step 2: Integrate Logging into Puppeteer Server

**Option A: Auto-Deploy (Recommended if using CI/CD)**
```bash
# Update EC2 puppeteer servers via your deployment process
# Key changes from puppeteer-server-enhanced.js:
# 1. Add insertSessionLog() function at top
# 2. Add logging calls throughout session handler
```

**Option B: Manual SSH Update**
```bash
# SSH into both EC2 instances and update server.js
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@44.200.203.114
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@52.54.247.189

# Reference: puppeteer-server-enhanced.js for integration points
# Backup current version first:
cp /home/ubuntu/puppeteer-server/server.js /home/ubuntu/puppeteer-server/server.js.backup

# Then update with logging calls
```

### Step 3: Test Real-Time Logging
1. **Start a new campaign** from the UI (or trigger manually via API)
2. **Navigate to Campaign Details** page in browser
3. **Real-time logs should appear** in floating terminal window at bottom-right
4. **Expand the window** to see full 800x600 log view
5. **Verify logs show** as campaign processes:
   - "Session started" (info)
   - "Device profile selected" (debug)
   - "Navigating to target URL" (info)
   - Journey actions (debug)
   - "Session completed successfully" (info)

## 📊 Architecture Overview

```
Campaign UI
    ↓
CampaignDetails.tsx
    ├── Displays sessions table
    ├── Shows metrics
    └── Renders RealtimeLogs component
        ↓
RealtimeLogs.tsx
    ├── Subscribes to session_logs table via Supabase Realtime
    ├── Displays logs in real-time terminal UI
    └── Auto-scrolls and color-codes by level
        ↓
Supabase (pffapmqqswcmndlvkjrs)
    └── session_logs table
        ├── Receives inserts from puppeteer servers
        ├── Triggers cleanup_old_session_logs() after insert
        ├── Deletes logs for sessions older than 10 most recent
        └── Publishes inserts to realtime subscribers
            ↓
EC2 Puppeteer Servers (44.200.203.114, 52.54.247.189)
    └── Calls insertSessionLog() at key session events
        └── Sends logs to Supabase session_logs table
```

## 🔍 Monitoring Checklist

After implementing, verify:
- [ ] Cleanup migration applied successfully in Supabase
- [ ] Puppeteer servers updated with logging calls
- [ ] Campaign starts and sessions are created
- [ ] RealtimeLogs component appears on CampaignDetails page
- [ ] Logs appear in real-time as campaign executes
- [ ] Log levels are color-coded correctly
- [ ] Auto-scroll works as logs flow in
- [ ] Expand/collapse button resizes window
- [ ] Clear button resets logs
- [ ] Old logs auto-delete after campaign processes 10+ sessions

## 📝 Log Levels Reference

| Level | Color | Use Case |
|-------|-------|----------|
| `info` | Cyan | Major events (session start, navigation, completion) |
| `warn` | Yellow | Issues that don't stop execution (bandwidth limit, SERP timeout) |
| `error` | Red | Failures that stop session (browser crash, network error) |
| `debug` | Gray | Detailed tracking (device selection, click actions, metadata) |

## 🎯 Expected Behavior

**When Campaign Runs:**
1. RealtimeLogs component shows up at bottom-right
2. First log appears: "Session started"
3. Logs flow in as session progresses (device, SERP search, navigation, clicks)
4. After session completes: "Session completed successfully"
5. New logs appear for next session in campaign
6. Logs for sessions older than 10 most recent auto-delete

**Window States:**
- **Collapsed (400x300)**: Shows recent logs preview, terminal icon visible
- **Expanded (800x600)**: Shows full log history, expand button becomes minimize
- **No Logs**: Component hidden until first log appears

## 🚀 Optimization Notes

- Logs limited to 500 most recent per load to avoid memory bloat
- Cleanup trigger deletes logs for all but 10 most recent sessions **per campaign**
- Realtime subscriptions are efficient (only pushes new inserts to subscribed clients)
- RLS policies ensure users only see logs from their own campaigns
- Frontend auto-scroll toggle prevents excessive DOM manipulation

## ❓ Troubleshooting Quick Links

See `REALTIME_LOGGING_SETUP.md` for:
- Logs not appearing
- Logs disappearing unexpectedly
- Performance issues
- Connection problems

---

**Timeline**: Database schemas ready. Frontend ready. Backend integration pending (manual).
**Status**: 66% complete (migrations + frontend done, backend integration needed)
