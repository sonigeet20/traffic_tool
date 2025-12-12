# Manual Edge Function Deployment Guide

## Staging Supabase Project
- **Project ID**: xrqobmncpllhkjjorjul
- **URL**: https://supabase.com/dashboard/project/xrqobmncpllhkjjorjul/functions

## Functions to Deploy (3 total)

### 1. campaign-scheduler
**File**: `/supabase/functions/campaign-scheduler/index.ts`

**Steps**:
1. Go to https://supabase.com/dashboard/project/xrqobmncpllhkjjorjul/functions
2. Click "Create a new function"
3. Name: `campaign-scheduler`
4. Copy entire content from `supabase/functions/campaign-scheduler/index.ts`
5. Paste into the editor
6. BEFORE deploying, find this line:
   ```typescript
   const puppeteerServerUrl = 'http://localhost:3000';
   ```
   (It should already be changed from `http://13.218.100.97:3000`)
7. Click "Deploy"

### 2. start-campaign  
**File**: `/supabase/functions/start-campaign/index.ts`

**Steps**:
1. Click "Create a new function"
2. Name: `start-campaign`
3. Copy entire content from `supabase/functions/start-campaign/index.ts`
4. Paste into the editor
5. Click "Deploy"

### 3. update-session-tracking
**File**: `/supabase/functions/update-session-tracking/index.ts`

**Steps**:
1. Click "Create a new function"
2. Name: `update-session-tracking`
3. Copy entire content from `supabase/functions/update-session-tracking/index.ts`
4. Paste into the editor
5. Click "Deploy"

## Verification After Deployment

After deploying all 3 functions:

1. Go to the Functions page
2. Verify all 3 appear in the list:
   - campaign-scheduler ✓
   - start-campaign ✓
   - update-session-tracking ✓

3. Then test by:
   - Opening the React app (http://localhost:5174)
   - Making sure Puppeteer server is running (`node puppeteer-server.cjs`)
   - Creating a new campaign
   - Clicking "Start Campaign"
   - Checking database for sessions being created

## CLI Alternative (when you have proper auth)

Once you have a valid Supabase personal access token (sbp_...):

```bash
export SUPABASE_AUTH_TOKEN="your_token_here"
npx supabase functions deploy campaign-scheduler
npx supabase functions deploy start-campaign
npx supabase functions deploy update-session-tracking
```

## Current Status

✅ campaign-scheduler code ready (puppeteerServerUrl already set to localhost:3000)
✅ start-campaign code ready
✅ update-session-tracking code ready
⏳ Waiting for manual deployment via UI
