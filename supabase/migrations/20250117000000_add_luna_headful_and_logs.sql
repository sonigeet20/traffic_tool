-- Add Luna headful direct option to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS use_luna_headful_direct BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN campaigns.use_luna_headful_direct IS 'Enable Luna proxy headful direct mode (Option 2 - Direct traffic with extension support)';

-- Add session logs table for storing detailed logs
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  log_entries JSONB NOT NULL, -- Array of log entries
  total_logs INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_session_logs_campaign_id ON session_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at DESC);

-- Add table comment
COMMENT ON TABLE session_logs IS 'Detailed logs for each automation session for debugging and monitoring';
