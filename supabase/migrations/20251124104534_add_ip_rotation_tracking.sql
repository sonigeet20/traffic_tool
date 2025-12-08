/*
  # Add IP rotation tracking for sessions

  1. New Tables
    - `session_ip_tracking`
      - `id` (uuid, primary key) - Unique identifier
      - `session_id` (uuid) - Reference to bot_sessions
      - `ip_address` (text) - The IP address used
      - `country_code` (text) - Country code (US, UK, etc.)
      - `used_at` (timestamptz) - When this IP was used
      - `campaign_id` (uuid) - Reference to campaign
      - `user_id` (uuid) - Reference to auth.users

  2. Indexes
    - Index on ip_address and used_at for fast lookups
    - Index on campaign_id for filtering by campaign

  3. Security
    - Enable RLS
    - Add policies for authenticated users to access their own IP tracking data

  4. Notes
    - This table tracks IP addresses used in sessions
    - Prevents IP reuse within 1 hour window
    - Helps ensure unique IPs for better traffic simulation
    - IPs older than 1 hour can be reused
*/

-- Create session_ip_tracking table
CREATE TABLE IF NOT EXISTS session_ip_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES bot_sessions(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  country_code text NOT NULL,
  used_at timestamptz DEFAULT now(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_ip_tracking_ip_used_at ON session_ip_tracking(ip_address, used_at);
CREATE INDEX IF NOT EXISTS idx_session_ip_tracking_campaign ON session_ip_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_session_ip_tracking_user ON session_ip_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_session_ip_tracking_country ON session_ip_tracking(country_code, used_at);

-- Enable RLS
ALTER TABLE session_ip_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own IP tracking data
CREATE POLICY "Users can view own IP tracking data"
  ON session_ip_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can insert IP tracking data
CREATE POLICY "Service role can insert IP tracking data"
  ON session_ip_tracking
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can read all IP tracking data
CREATE POLICY "Service role can read all IP tracking data"
  ON session_ip_tracking
  FOR SELECT
  TO service_role
  USING (true);

-- Add helpful comments
COMMENT ON TABLE session_ip_tracking IS 'Tracks IP addresses used in bot sessions to prevent reuse within 1 hour';
COMMENT ON COLUMN session_ip_tracking.ip_address IS 'The actual IP address used for the session';
COMMENT ON COLUMN session_ip_tracking.used_at IS 'Timestamp when this IP was used (for 1-hour cooldown)';
COMMENT ON COLUMN session_ip_tracking.country_code IS 'Country code for geo-targeting (US, UK, CA, etc.)';
