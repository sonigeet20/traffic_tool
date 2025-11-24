/*
  # Add Bounce Rate to Campaigns

  1. Changes
    - Add `bounce_rate` column to campaigns table (percentage 0-100)
    - Default to 30% bounce rate
    - Add bounce tracking to bot_sessions

  ## Notes
  - Bounce rate determines percentage of sessions that exit after 1-5 seconds
  - Bounced sessions will have minimal interactions
*/

-- Add bounce_rate column to campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'bounce_rate'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN bounce_rate integer DEFAULT 30;
  END IF;
END $$;

-- Add is_bounced column to bot_sessions to track bounced sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'is_bounced'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN is_bounced boolean DEFAULT false;
  END IF;
END $$;

-- Add bounce_duration column to track how long bounced sessions stayed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_sessions' AND column_name = 'bounce_duration_ms'
  ) THEN
    ALTER TABLE bot_sessions ADD COLUMN bounce_duration_ms integer;
  END IF;
END $$;

-- Add comment explaining the bounce_rate column
COMMENT ON COLUMN campaigns.bounce_rate IS 'Percentage (0-100) of sessions that should bounce (exit after 1-5 seconds)';
COMMENT ON COLUMN bot_sessions.is_bounced IS 'Whether this session was a bounced session (exited within 1-5 seconds)';
COMMENT ON COLUMN bot_sessions.bounce_duration_ms IS 'Duration in milliseconds for bounced sessions (1000-5000ms)';