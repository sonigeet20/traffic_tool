#!/bin/bash
# FIX BACKEND TO CALL SUPABASE ON SESSION COMPLETION - V2 with debug logging
# Run this on the AWS server

cd ~/puppeteer-server

# Backup
cp server.js server.js.backup-v2-$(date +%Y%m%d-%H%M%S)

# Create the fixed startJob function with debug logging
cat > /tmp/startJob-v2.txt << 'FUNCEOF'
async function startJob(jobId, payload) {
  activeSessionCount++;
  console.log(`[QUEUE] Starting job ${jobId} (${activeSessionCount}/${MAX_CONCURRENT_SESSIONS})`);
  JOBS.set(jobId, { status: 'running', startedAt: Date.now(), sessionId: jobId });

  // Helper to update Supabase session status
  async function updateSessionStatus(status, extraData = {}) {
    console.log(`[SUPABASE-DEBUG] Checking payload for session update...`);
    console.log(`[SUPABASE-DEBUG] supabaseUrl: ${payload.supabaseUrl ? 'YES' : 'NO'}`);
    console.log(`[SUPABASE-DEBUG] supabaseKey: ${payload.supabaseKey ? 'YES' : 'NO'}`);
    console.log(`[SUPABASE-DEBUG] sessionId: ${payload.sessionId || 'MISSING'}`);
    
    if (payload.supabaseUrl && payload.supabaseKey && payload.sessionId) {
      try {
        console.log(`[SUPABASE] Updating session ${payload.sessionId} to status: ${status}`);
        const response = await fetch(`${payload.supabaseUrl}/functions/v1/update-session-tracking`, {
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
        if (response.ok) {
          console.log(`[SUPABASE] ✓ Session ${payload.sessionId} updated to ${status}`);
        } else {
          const errorText = await response.text();
          console.error(`[SUPABASE] Update failed: ${response.status} - ${errorText}`);
        }
      } catch (e) {
        console.error(`[SUPABASE] Failed to update session: ${e.message}`);
      }
    } else {
      console.log(`[SUPABASE] Skipping update - missing required payload fields`);
    }
  }

  try {
    const result = await processAutomateJob(payload, jobId);
    JOBS.set(jobId, {
      status: 'completed',
      finishedAt: Date.now(),
      result
    });
    console.log(`[QUEUE] Job ${jobId} completed successfully`);
    
    // Update Supabase with completion status
    await updateSessionStatus('completed', { 
      session_duration_sec: result.actualDurationSec || 0
    });
    
  } catch (err) {
    JOBS.set(jobId, {
      status: 'failed',
      finishedAt: Date.now(),
      error: err.message,
      stack: err.stack
    });
    console.error(`[QUEUE] Job ${jobId} failed: ${err.message}`);
    
    // Update Supabase with failure status
    await updateSessionStatus('failed', { 
      error_message: err.message 
    });
    
  } finally {
    activeSessionCount--;
    console.log(`[QUEUE] Job ${jobId} finished (${activeSessionCount}/${MAX_CONCURRENT_SESSIONS} active)`);
    runQueue();
  }
}
FUNCEOF

# Replace the function
node << 'NODESCRIPT'
const fs = require('fs');

const serverJs = fs.readFileSync('/home/ubuntu/puppeteer-server/server.js', 'utf8');
const newFunction = fs.readFileSync('/tmp/startJob-v2.txt', 'utf8');

const regex = /async function startJob\(jobId, payload\) \{[\s\S]*?\n\}\n(?=\n)/;

if (!regex.test(serverJs)) {
  console.error('ERROR: Could not find startJob function');
  process.exit(1);
}

const updatedJs = serverJs.replace(regex, newFunction + '\n');
fs.writeFileSync('/home/ubuntu/puppeteer-server/server.js', updatedJs);
console.log('✓ server.js updated with debug logging');
NODESCRIPT

if [ $? -eq 0 ]; then
  echo "✓ Backend code updated with debug logging"
  echo "Restarting PM2..."
  pm2 restart server
  echo "✓ Done! Watch logs for [SUPABASE-DEBUG] messages"
else
  echo "✗ Failed to update"
  exit 1
fi
