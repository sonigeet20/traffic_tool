-- ═══════════════════════════════════════════════════════════════════════════
-- BROWSER API CREDENTIALS TABLE SETUP
-- Run this SQL in Supabase SQL Editor to create the serp_configs table
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Add the missing browser_username column (if it doesn't exist)
ALTER TABLE serp_configs ADD COLUMN IF NOT EXISTS browser_username TEXT;

-- STEP 2: Recreate RLS policies (drop old ones first if they exist)
DROP POLICY IF EXISTS "Users can view own serp_configs" ON serp_configs;
DROP POLICY IF EXISTS "Users can update own serp_configs" ON serp_configs;
DROP POLICY IF EXISTS "Users can insert own serp_configs" ON serp_configs;
DROP POLICY IF EXISTS "Users can delete own serp_configs" ON serp_configs;

-- Enable Row Level Security (safe to run if already enabled)
ALTER TABLE serp_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own serp_configs
CREATE POLICY "Users can view own serp_configs"
  ON serp_configs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own serp_configs
CREATE POLICY "Users can update own serp_configs"
  ON serp_configs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own serp_configs
CREATE POLICY "Users can insert own serp_configs"
  ON serp_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own serp_configs
CREATE POLICY "Users can delete own serp_configs"
  ON serp_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- AFTER TABLE IS CREATED, INSERT YOUR CREDENTIALS VIA FRONTEND
-- Go to Settings → Bright Data Browser API and enter your credentials there
-- ═══════════════════════════════════════════════════════════════════════════

-- OR if you prefer manual SQL insertion, use this template:
-- (Uncomment and modify with your actual credentials)
/*
INSERT INTO serp_configs (
  user_id,
  browser_customer_id,
  browser_username,
  browser_password,
  browser_zone,
  browser_endpoint,
  browser_port
) VALUES (
  'YOUR_USER_UUID_HERE',
  'your_bright_data_customer_id',
  'your_bright_data_username',
  'your_bright_data_password',
  'unblocker',
  'brd.superproxy.io',
  9222
) ON CONFLICT (user_id) DO UPDATE SET
  browser_customer_id = 'your_bright_data_customer_id',
  browser_username = 'your_bright_data_username',
  browser_password = 'your_bright_data_password',
  updated_at = CURRENT_TIMESTAMP;
*/

-- To find your user UUID, run this:
-- SELECT id, email FROM auth.users;
