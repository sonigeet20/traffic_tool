/*
  # Add Device Type Tracking

  1. Changes
    - Add `device_type` column to track whether session used mobile or desktop

  2. Purpose
    - Enable tracking of diverse user agents across sessions
    - Provide analytics on mobile vs desktop traffic distribution
*/

-- Add device type column to bot_sessions table
ALTER TABLE bot_sessions
ADD COLUMN IF NOT EXISTS device_type text CHECK (device_type IN ('mobile', 'desktop'));

-- Create index for device type queries
CREATE INDEX IF NOT EXISTS idx_bot_sessions_device_type ON bot_sessions(device_type);

-- Create index for combined campaign and device type queries
CREATE INDEX IF NOT EXISTS idx_bot_sessions_campaign_device ON bot_sessions(campaign_id, device_type);
