/*
  # Auto-complete bot sessions based on duration

  1. Function
    - Creates a database function to auto-complete sessions
    - Marks sessions as completed after their calculated duration
    - Runs every minute via pg_cron
  
  2. Security
    - Function runs with elevated privileges to update sessions
*/

-- Create function to auto-complete sessions
CREATE OR REPLACE FUNCTION auto_complete_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Complete sessions that have exceeded their duration
  UPDATE bot_sessions
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE 
    status = 'running'
    AND (
      (is_bounced = true AND EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000 >= bounce_duration_ms)
      OR
      (is_bounced = false AND started_at < NOW() - INTERVAL '2 minutes')
    );
    
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