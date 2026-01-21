-- Add cleanup trigger to keep only logs from last 10 sessions per campaign
-- This migration creates a trigger to automatically delete old session logs

-- Create a function to clean up old session logs
CREATE OR REPLACE FUNCTION cleanup_old_session_logs()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id uuid;
  v_session_count int;
BEGIN
  -- Get the campaign_id for the current session
  SELECT campaign_id INTO v_campaign_id
  FROM bot_sessions
  WHERE id = NEW.session_id;
  
  -- Count total sessions for this campaign
  SELECT COUNT(*) INTO v_session_count
  FROM bot_sessions
  WHERE campaign_id = v_campaign_id;
  
  -- If more than 10 sessions, delete logs from older sessions
  IF v_session_count > 10 THEN
    DELETE FROM session_logs
    WHERE session_id IN (
      SELECT id FROM bot_sessions
      WHERE campaign_id = v_campaign_id
      ORDER BY created_at DESC
      LIMIT (v_session_count - 10) OFFSET 10
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on session_logs table to run cleanup when new logs are inserted
DROP TRIGGER IF EXISTS trigger_cleanup_old_session_logs ON session_logs;
CREATE TRIGGER trigger_cleanup_old_session_logs
AFTER INSERT ON session_logs
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_session_logs();

-- Create a one-time cleanup to remove logs for sessions older than the 10 most recent per campaign
-- This handles the case where there are already many sessions
DO $$
DECLARE
  v_campaign_id uuid;
  v_session_count int;
BEGIN
  FOR v_campaign_id IN
    SELECT DISTINCT campaign_id FROM bot_sessions
  LOOP
    -- Count total sessions for this campaign
    SELECT COUNT(*) INTO v_session_count
    FROM bot_sessions
    WHERE campaign_id = v_campaign_id;
    
    -- If more than 10 sessions, delete logs from older ones
    IF v_session_count > 10 THEN
      DELETE FROM session_logs
      WHERE session_id IN (
        SELECT id FROM bot_sessions
        WHERE campaign_id = v_campaign_id
        ORDER BY created_at DESC
        OFFSET 10
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION cleanup_old_session_logs() IS 'Automatically deletes session logs for campaigns with more than 10 sessions, keeping only the most recent 10';
