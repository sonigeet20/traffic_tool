-- Add session_logs table for real-time logging
-- This migration creates a table to store detailed logs for each bot session

-- Drop existing table if it exists (to handle partial creation)
DROP TABLE IF EXISTS session_logs CASCADE;

-- Create session_logs table
CREATE TABLE session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES bot_sessions(id) ON DELETE CASCADE NOT NULL,
  log_timestamp timestamptz DEFAULT now() NOT NULL,
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_timestamp ON session_logs(log_timestamp DESC);

-- Enable RLS
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view logs of their campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'session_logs' AND policyname = 'Users can view logs of own sessions'
  ) THEN
    CREATE POLICY "Users can view logs of own sessions"
      ON session_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM bot_sessions
          JOIN campaigns ON campaigns.id = bot_sessions.campaign_id
          WHERE bot_sessions.id = session_logs.session_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create policy for service role to insert logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'session_logs' AND policyname = 'Service role can insert logs'
  ) THEN
    CREATE POLICY "Service role can insert logs"
      ON session_logs FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime for session_logs
ALTER PUBLICATION supabase_realtime ADD TABLE session_logs;

COMMENT ON TABLE session_logs IS 'Stores real-time logs for bot sessions for debugging and monitoring';
COMMENT ON COLUMN session_logs.level IS 'Log level: info, warn, error, debug';
COMMENT ON COLUMN session_logs.message IS 'Log message describing the event';
COMMENT ON COLUMN session_logs.metadata IS 'Additional structured data about the log event';
