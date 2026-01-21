-- Add started_at column to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add completed_at if not exists
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN campaigns.started_at IS 'Timestamp when campaign was started';
COMMENT ON COLUMN campaigns.completed_at IS 'Timestamp when campaign completed all sessions';
