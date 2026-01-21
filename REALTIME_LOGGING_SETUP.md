# Real-Time Session Logging Integration Guide

## Overview
This guide explains how to integrate real-time session logging into the puppeteer server.

## Components

### 1. Database Schema ✅
- **Migration**: `supabase/migrations/20260122010000_add_session_logs.sql` - Creates `session_logs` table
- **Cleanup**: `supabase/migrations/20260122020000_add_session_logs_cleanup.sql` - Keeps only last 10 sessions' logs per campaign
- Status: Ready to apply to Supabase

### 2. Frontend Component ✅
- **File**: `src/components/RealtimeLogs.tsx`
- **Features**:
  - Real-time log display with Supabase subscriptions
  - Color-coded log levels (info=blue, warn=yellow, error=red, debug=gray)
  - Expandable window (400x300 collapsed, 800x600 expanded)
  - Auto-scroll toggle
  - Integrated into CampaignDetails
- Status: Ready to use

### 3. Backend Logging ⏳ NEEDS MANUAL IMPLEMENTATION
- **File**: `puppeteer-server-enhanced.js` (reference implementation)
- **Current Server**: Running on EC2 instances at 52.54.247.189:3000 and 44.200.203.114:3000

## Implementation Steps

### Step 1: Apply Supabase Migrations
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pffapmqqswcmndlvkjrs/sql/new
2. Paste the content from `supabase/migrations/20260122010000_add_session_logs.sql`
3. Click "Run"
4. Paste the content from `supabase/migrations/20260122020000_add_session_logs_cleanup.sql`
5. Click "Run"

### Step 2: Update Puppeteer Server Code

**Option A: SSH Update (Recommended)**
```bash
# SSH into EC2 instance
ssh -i ~/Downloads/browser-automation-key.pem ubuntu@44.200.203.114

# Edit the server.js file (backup first)
cp /home/ubuntu/puppeteer-server/server.js /home/ubuntu/puppeteer-server/server.js.backup

# Add the helper function at the top of POST /api/automate handler
# and integrate logging calls
```

**Option B: Manual Integration**
Reference `puppeteer-server-enhanced.js` for:
1. Add `insertSessionLog()` helper function at top of file
2. Add logging calls at these key points:
   - Session start (info level)
   - Device profile selection (debug level)
   - SERP API search (info level)
   - Browser connection (info level)
   - Page navigation (info level)
   - User journey actions (debug level)
   - Session completion (info level)
   - Errors (error level)

### Step 3: Test Real-Time Logging

1. **Start a new campaign** with sessions
2. **Navigate to Campaign Details** page
3. **Real-time logs should appear** in the floating log viewer
4. **Click the expand button** to see full log window
5. **Logs auto-scroll** as new messages arrive

## Log Entry Structure

Each log entry contains:
```json
{
  "session_id": "uuid",
  "level": "info|warn|error|debug",
  "message": "Human-readable message",
  "log_timestamp": "ISO timestamp",
  "metadata": {
    "key": "value"
  }
}
```

## Cleanup Behavior

- **Automatic deletion** happens after each new log insert
- **Keeps**: Last 10 sessions per campaign
- **Deletes**: Logs for older sessions beyond the 10 most recent
- **One-time cleanup**: Runs when migration is applied (handles existing data)

## Monitoring

To verify logging is working:
1. Check `session_logs` table in Supabase dashboard
2. Verify entries appear as campaign sessions run
3. Check RealtimeLogs component in browser DevTools

## Troubleshooting

**Logs not appearing?**
- Verify migrations applied successfully
- Check Supabase API key is passed in campaign execution request
- Verify session_id is correctly passed to puppeteer server
- Check browser console for errors in RealtimeLogs component

**Logs disappearing?**
- Cleanup trigger is working as expected
- Only last 10 sessions kept per campaign
- This is intentional to prevent storage bloat

**Performance issues?**
- Cleanup function removes old logs automatically
- If still slow, increase the "10 sessions" limit in cleanup migration
