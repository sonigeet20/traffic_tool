/*
  # Add session duration tracking

  1. Changes
    - Add expected_duration_ms column to bot_sessions
    - Update auto_complete_sessions function to use this duration
  
  2. Notes
    - This allows precise completion timing for each session
*/

-- Add expected duration column
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS expected_duration_ms INTEGER;

-- Update auto-complete function to use expected duration
CREATE OR REPLACE FUNCTION auto_complete_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Complete sessions that have exceeded their expected duration
  UPDATE bot_sessions
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE 
    status = 'running'
    AND expected_duration_ms IS NOT NULL
    AND EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000 >= expected_duration_ms;
    
  -- Complete sessions without duration after 2 minutes (fallback)
  UPDATE bot_sessions
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE 
    status = 'running'
    AND expected_duration_ms IS NULL
    AND started_at < NOW() - INTERVAL '2 minutes';
    
  -- Mark very old stuck sessions as failed
  UPDATE bot_sessions
  SET 
    status = 'failed',
    error_message = 'Session timeout - exceeded 5 minutes',
    completed_at = NOW()
  WHERE 
    status = 'running'
    AND started_at < NOW() - INTERVAL '5 minutes';
END;
$$;