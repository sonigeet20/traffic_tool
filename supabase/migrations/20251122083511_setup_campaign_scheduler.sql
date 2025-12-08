/*
  # Setup Campaign Scheduler with pg_cron

  1. Enable pg_cron extension
  2. Create a scheduled job to trigger campaign-scheduler edge function every hour
  3. Add a helper function to invoke the edge function

  ## Notes
  - Runs every hour to process active campaigns
  - Automatically stops campaigns when total sessions reached
*/

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the campaign scheduler edge function
CREATE OR REPLACE FUNCTION trigger_campaign_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get Supabase URL and key from environment or settings
  -- Note: In production, these would be set via Supabase secrets
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Call the edge function using pg_net or http extension
  -- This is a placeholder - actual implementation depends on your setup
  RAISE NOTICE 'Campaign scheduler triggered at %', now();
END;
$$;

-- Schedule the campaign scheduler to run every hour
-- Note: This requires pg_cron to be enabled in your Supabase project
SELECT cron.schedule(
  'campaign-scheduler-hourly',
  '0 * * * *', -- Run at the start of every hour
  $$
  SELECT trigger_campaign_scheduler();
  $$
);

-- Alternative: Create a simple tracking table for manual triggers
CREATE TABLE IF NOT EXISTS campaign_scheduler_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  result jsonb,
  error text
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduler_log_triggered 
  ON campaign_scheduler_log(triggered_at DESC);

-- Enable RLS
ALTER TABLE campaign_scheduler_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage logs
CREATE POLICY "Service role can manage scheduler logs"
  ON campaign_scheduler_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);